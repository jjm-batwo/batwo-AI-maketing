import { streamText, stepCountIs, type UserModelMessage, type AssistantModelMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { IToolRegistry, AgentContext } from '@application/ports/IConversationalAgent'
import type {
  IConversationRepository,
  ConversationMessageData,
} from '@domain/repositories/IConversationRepository'
import type { IPendingActionRepository } from '@domain/repositories/IPendingActionRepository'
import { Conversation } from '@domain/entities/Conversation'
import { PendingAction } from '@domain/entities/PendingAction'

// ============================================================================
// SSE Stream Chunk Types
// ============================================================================

export type AgentStreamChunk =
  | { type: 'text'; content: string }
  | { type: 'progress'; stage: string; progress: number }
  | { type: 'tool_call'; toolName: string; args: Record<string, unknown> }
  | { type: 'tool_result'; toolName: string; formattedMessage: string; data?: unknown }
  | {
      type: 'action_confirmation'
      actionId: string
      toolName: string
      summary: string
      details: { label: string; value: string; changed?: boolean }[]
      warnings: string[]
      expiresAt: string
    }
  | { type: 'action_result'; actionId: string; success: boolean; message: string }
  | { type: 'data_card'; cardType: string; data: unknown }
  | { type: 'suggested_questions'; questions: string[] }
  | {
      type: 'guide_question'
      questionId: string
      question: string
      options: { value: string; label: string; description?: string }[]
      progress: { current: number; total: number }
    }
  | {
      type: 'guide_recommendation'
      recommendation: {
        campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
        formData: {
          objective: string
          dailyBudget: number
          campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
        }
        reasoning: string
        experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
      }
    }
  | { type: 'error'; error: string }
  | { type: 'done' }

// ============================================================================
// Input Types
// ============================================================================

export interface AgentChatInput {
  userId: string
  message: string
  conversationId?: string
}

// ============================================================================
// Service
// ============================================================================

export class ConversationalAgentService {
  constructor(
    private readonly toolRegistry: IToolRegistry,
    private readonly conversationRepo: IConversationRepository,
    private readonly pendingActionRepo: IPendingActionRepository,
    private readonly buildAgentContext: (userId: string) => Promise<AgentContext>,
  ) {}

  /**
   * 메인 대화 처리 - AsyncIterable로 SSE 스트리밍
   */
  async *chat(input: AgentChatInput): AsyncIterable<AgentStreamChunk> {
    try {
      // 1. 대화 로드 또는 생성
      let conversationId = input.conversationId
      if (!conversationId) {
        const conv = Conversation.create(input.userId)
        const saved = await this.conversationRepo.save(conv)
        conversationId = saved.id
      }

      // 2. 사용자 메시지 저장
      await this.conversationRepo.addMessage(conversationId, {
        role: 'user',
        content: input.message,
        toolCalls: null,
        toolName: null,
        toolResult: null,
        metadata: null,
      })

      // 3. 에이전트 컨텍스트 구성
      const baseContext = await this.buildAgentContext(input.userId)
      const agentContext: AgentContext = { ...baseContext, conversationId }

      // 4. 대화 히스토리 로드 (최근 20개)
      const history = await this.conversationRepo.getMessages(conversationId, { limit: 20 })
      const messages = this.toCoreMessages(history)

      // 5. 시스템 프롬프트 구성
      const systemPrompt = this.buildSystemPrompt()

      // 6. LLM 호출 (도구 포함)
      yield { type: 'progress', stage: 'thinking', progress: 10 }

      const result = streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages,
        tools: this.toolRegistry.toVercelAITools() as Parameters<typeof streamText>[0]['tools'],
        stopWhen: stepCountIs(5),
        temperature: 0.7,
        onError: ({ error }) => {
          console.error('[ConversationalAgentService] streamText error:', error)
        },
      })

      // 7. fullStream으로 텍스트 + 도구 호출 통합 처리
      let fullText = ''

      for await (const part of result.fullStream) {
        if (part.type === 'text-delta') {
          fullText += part.text
          yield { type: 'text', content: part.text }
        } else if (part.type === 'tool-call') {
          const agentTool = this.toolRegistry.get(part.toolName)
          if (!agentTool) continue

          yield {
            type: 'tool_call',
            toolName: part.toolName,
            args: part.input as Record<string, unknown>,
          }

          if (agentTool.requiresConfirmation) {
            // Mutation 도구: 확인 카드 생성
            if (agentTool.buildConfirmation) {
              const toolArgs = part.input as Record<string, unknown>
              const confirmation = await agentTool.buildConfirmation(toolArgs, agentContext)
              const pendingAction = PendingAction.create({
                conversationId,
                toolName: part.toolName,
                toolArgs,
                displaySummary: confirmation.summary,
                details: confirmation.details,
                warnings: confirmation.warnings,
              })
              const saved = await this.pendingActionRepo.save(pendingAction)

              yield {
                type: 'action_confirmation',
                actionId: saved.id,
                toolName: part.toolName,
                summary: confirmation.summary,
                details: confirmation.details,
                warnings: confirmation.warnings,
                expiresAt: saved.expiresAt.toISOString(),
              }
            }
          } else {
            // Query 도구: 즉시 실행
            try {
              const toolArgs = part.input as Record<string, unknown>
              const execResult = await agentTool.execute(toolArgs, agentContext)

              // 가이드 도구는 전용 청크 타입으로 변환
              if (part.toolName === 'askGuideQuestion') {
                const data = execResult.data as {
                  questionId: string
                  question: string
                  options: { value: string; label: string; description?: string }[]
                  progress: { current: number; total: number }
                }
                yield {
                  type: 'guide_question' as const,
                  questionId: data.questionId,
                  question: data.question,
                  options: data.options,
                  progress: data.progress,
                }
              } else if (part.toolName === 'recommendCampaignSettings') {
                yield {
                  type: 'guide_recommendation' as const,
                  recommendation: execResult.data as {
                    campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
                    formData: {
                      objective: string
                      dailyBudget: number
                      campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
                    }
                    reasoning: string
                    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
                  },
                }
              } else {
                yield {
                  type: 'tool_result',
                  toolName: part.toolName,
                  formattedMessage: execResult.formattedMessage,
                  data: execResult.data,
                }
              }
            } catch (error) {
              yield {
                type: 'error',
                error: `도구 실행 실패 (${part.toolName}): ${error instanceof Error ? error.message : 'Unknown error'}`,
              }
            }
          }
        } else if (part.type === 'error') {
          console.error('[ConversationalAgentService] Stream error:', part.error)
          yield {
            type: 'error',
            error: part.error instanceof Error ? part.error.message : String(part.error),
          }
        }
      }

      // 9. assistant 메시지 저장
      if (fullText) {
        await this.conversationRepo.addMessage(conversationId, {
          role: 'assistant',
          content: fullText,
          toolCalls: null,
          toolName: null,
          toolResult: null,
          metadata: null,
        })

        // 첫 메시지에서 대화 제목 자동 생성
        const conv = await this.conversationRepo.findById(conversationId)
        if (conv && !conv.title) {
          const title = input.message.slice(0, 50) + (input.message.length > 50 ? '...' : '')
          const updated = conv.setTitle(title)
          await this.conversationRepo.save(updated)
        }
      }

      // 10. 추천 질문 생성
      yield {
        type: 'suggested_questions',
        questions: this.generateSuggestedQuestions(fullText),
      }

      yield { type: 'done' }
    } catch (error) {
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * 시스템 프롬프트 구성
   */
  private buildSystemPrompt(): string {
    const toolDescriptions = this.toolRegistry
      .getAll()
      .map((t) => `- ${t.name}: ${t.description}${t.requiresConfirmation ? ' (실행 전 사용자 확인 필요)' : ''}`)
      .join('\n')

    return `당신은 바투 AI 마케팅 어시스턴트입니다. 한국 커머스 사업자의 Meta 광고 캠페인을 관리합니다.

역할:
1. 캠페인 성과를 분석하고 인사이트를 제공합니다
2. 사용자의 요청에 따라 캠페인을 생성/수정/관리합니다
3. 이상 징후를 감지하고 최적화 방안을 제안합니다
4. 광고 카피를 생성합니다

규칙:
- 항상 한국어로 응답합니다
- 데이터 기반으로 구체적인 수치를 포함해 답변합니다
- 캠페인 생성/수정/삭제 등 실행 작업은 반드시 도구를 사용합니다
- 정보가 부족하면 사용자에게 명확히 질문합니다
- 금액은 원(₩) 단위로, 비율은 소수점 2자리로 표시합니다
- 간결하고 실행 가능한 답변을 제공합니다

=== 캠페인 가이드 프로토콜 ===
사용자가 캠페인 생성을 요청하면("캠페인 만들어줘", "새 캠페인", "광고 시작하고 싶어" 등) 다음 인터뷰 프로세스를 시작합니다.

절대 규칙:
- 질문은 한 번에 하나만. 반드시 askGuideQuestion 도구를 사용.
- 사용자 답변 후 다음 질문으로 진행. 모든 질문 완료 후 recommendCampaignSettings 호출.
- 일반 텍스트로 질문하지 말고, 반드시 askGuideQuestion 도구를 사용하세요.

질문 순서 (4~5개):
Q1 (experience_level): "Meta 광고 경험이 어느 정도이신가요?"
  - BEGINNER: "처음이에요" / INTERMEDIATE: "몇 번 해봤어요" / ADVANCED: "전문가예요"
Q2 (industry): "어떤 업종의 상품/서비스를 광고하시나요?"
  - 패션/의류, 뷰티/화장품, 식품/건강, 가전/디지털, 기타
Q3 (objective): "이번 캠페인의 주요 목표는?"
  - 매출 늘리기(sales), 브랜드 알리기(awareness), 사이트 방문 유도(traffic), SNS 참여(engagement)
Q4 (budget): "하루 광고 예산은 어느 정도?"
  - 1만원 이하(1-10000), 1-5만원(10000-50000), 5-20만원(50000-200000), 20만원 이상(200000-999999)
Q5 (target, 초보자만): "주요 타겟 고객은?"
  - 넓은 타겟(AI 최적화), 특정 연령대/성별

추천 로직:
- BEGINNER → Advantage+ 강력 추천, 쉬운 용어 사용
- INTERMEDIATE → Advantage+ 기본, 수동 옵션도 안내
- ADVANCED → 수동 모드 기본, 세부 설정 값도 추천

사용 가능한 도구:
${toolDescriptions}`
  }

  /**
   * DB 메시지를 Vercel AI SDK CoreMessage로 변환
   */
  private toCoreMessages(messages: ConversationMessageData[]): (UserModelMessage | AssistantModelMessage)[] {
    return messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content ?? '',
      }))
  }

  /**
   * 응답 기반 추천 질문 생성
   */
  private generateSuggestedQuestions(responseText: string): string[] {
    const questions: string[] = []
    if (responseText.includes('ROAS')) questions.push('ROAS를 개선하려면 어떻게 해야 하나요?')
    if (responseText.includes('캠페인')) questions.push('성과가 가장 좋은 캠페인은 어떤 건가요?')
    if (responseText.includes('예산')) questions.push('예산을 어떻게 재분배하면 좋을까요?')
    if (responseText.includes('카피') || responseText.includes('문구')) questions.push('다른 스타일의 카피도 만들어줄 수 있나요?')
    if (questions.length === 0) {
      questions.push('이번 주 성과는 어때?', '새 캠페인을 만들어줘', '최근 이상 징후가 있어?')
    }
    return questions.slice(0, 3)
  }
}
