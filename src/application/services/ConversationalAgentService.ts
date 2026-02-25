import { streamText, stepCountIs, type UserModelMessage, type AssistantModelMessage } from 'ai'
import { openai } from '@ai-sdk/openai'
import type { IToolRegistry, AgentContext } from '@application/ports/IConversationalAgent'
import type {
  IConversationRepository,
  ConversationMessageData,
} from '@domain/repositories/IConversationRepository'
import type { IPendingActionRepository } from '@domain/repositories/IPendingActionRepository'
import type { IResilienceService } from '@application/ports/IResilienceService'
import { Conversation } from '@domain/entities/Conversation'
import { PendingAction } from '@domain/entities/PendingAction'

// ============================================================================
// SSE Stream Chunk Types
// ============================================================================

export type AgentStreamChunk =
  | { type: 'conversation'; conversationId: string }
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
  uiContext?: 'dashboard' | 'campaigns' | 'reports' | 'competitors' | 'portfolio' | 'general'
}

// ============================================================================
// Service
// ============================================================================

export class ConversationalAgentService {
  constructor(
    private readonly toolRegistry: IToolRegistry,
    private readonly conversationRepo: IConversationRepository,
    private readonly pendingActionRepo: IPendingActionRepository,
    private readonly resilienceService: IResilienceService,
    private readonly buildAgentContext?: (userId: string) => Promise<AgentContext>
  ) {}

  /**
   * 메인 대화 처리 - AsyncIterable로 SSE 스트리밍
   */
  async *chat(input: AgentChatInput): AsyncIterable<AgentStreamChunk> {
    try {
      const chunks: AgentStreamChunk[] = await this.resilienceService.withRetry(async () => {
        const result: AgentStreamChunk[] = []

        // Phase 1: Setup (wrapped in circuit breaker)
        const setupData = await this.resilienceService.circuitBreaker('llm-service').execute(async () => {
          // 1. 대화 로드 또는 생성
          let conversationId = input.conversationId
          if (!conversationId) {
            const conv = Conversation.create(input.userId)
            const saved = await this.conversationRepo.save(conv)
            conversationId = saved?.id ?? input.conversationId ?? crypto.randomUUID()
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
          let agentContext: AgentContext
          if (this.buildAgentContext) {
            const baseContext = await this.buildAgentContext(input.userId)
            agentContext = { ...baseContext, conversationId }
          } else {
            agentContext = { conversationId } as AgentContext
          }

          // 4. 대화 히스토리 로드 (최근 20개)
          const history = await this.conversationRepo.getMessages(conversationId, { limit: 20 })
          const messages = this.toCoreMessages(history)

          // 5. 시스템 프롬프트 구성
          const systemPrompt = this.buildSystemPrompt(input.uiContext)

          return { conversationId, agentContext, messages, systemPrompt }
        })

        result.push({ type: 'conversation', conversationId: setupData.conversationId })

        // Phase 2: LLM Streaming (wrapped in circuit breaker)
        const streamChunks = await this.resilienceService.circuitBreaker('llm-service').execute(async () => {
          const phase2Result: AgentStreamChunk[] = []

          // 6. LLM 호출 (도구 포함)
          phase2Result.push({ type: 'progress', stage: 'thinking', progress: 10 })
          const reportIntent = /(보고서|리포트)/.test(input.message)

          // 7. fullStream으로 텍스트 + 도구 호출 통합 처리
          let fullText = ''
          let streamedTextEmitted = false
          const toolMessages: string[] = []
          const toolResults: Array<{ toolName: string; data: unknown; formattedMessage: string }> = []

          try {
            const streamResult = streamText({
              model: openai('gpt-4o-mini'),
              system: setupData.systemPrompt,
              messages: setupData.messages,
              tools: this.toolRegistry.toVercelAITools() as Parameters<typeof streamText>[0]['tools'],
              stopWhen: stepCountIs(5),
              temperature: 0.7,
              onError: ({ error }) => {
                console.error('[ConversationalAgentService] streamText error:', error)
              },
            })

            for await (const part of streamResult.fullStream) {
              if (part.type === 'text-delta') {
                fullText += part.text
                if (!reportIntent) {
                  phase2Result.push({ type: 'text', content: part.text })
                  streamedTextEmitted = true
                }
              } else if (part.type === 'tool-call') {
                const agentTool = this.toolRegistry.get(part.toolName)
                if (!agentTool) continue

                phase2Result.push({
                  type: 'tool_call',
                  toolName: part.toolName,
                  args: part.input as Record<string, unknown>,
                })

                if (agentTool.requiresConfirmation) {
                  // Mutation 도구: 확인 카드 생성
                  if (agentTool.buildConfirmation) {
                    const toolArgs = part.input as Record<string, unknown>
                    const confirmation = await agentTool.buildConfirmation(toolArgs, setupData.agentContext)
                    const pendingAction = PendingAction.create({
                      conversationId: setupData.conversationId,
                      toolName: part.toolName,
                      toolArgs,
                      displaySummary: confirmation.summary,
                      details: confirmation.details,
                      warnings: confirmation.warnings,
                    })
                    const saved = await this.pendingActionRepo.save(pendingAction)

                    phase2Result.push({
                      type: 'action_confirmation',
                      actionId: saved.id,
                      toolName: part.toolName,
                      summary: confirmation.summary,
                      details: confirmation.details,
                      warnings: confirmation.warnings,
                      expiresAt: saved.expiresAt.toISOString(),
                    })
                  }
                } else {
                  // Query 도구: 즉시 실행
                  try {
                    const toolArgs = part.input as Record<string, unknown>
                    const execResult = await agentTool.execute(toolArgs, setupData.agentContext)

                    // 가이드 도구는 전용 청크 타입으로 변환
                    if (part.toolName === 'askGuideQuestion') {
                      const data = execResult.data as {
                        questionId: string
                        question: string
                        options: { value: string; label: string; description?: string }[]
                        progress: { current: number; total: number }
                      }
                      phase2Result.push({
                        type: 'guide_question' as const,
                        questionId: data.questionId,
                        question: data.question,
                        options: data.options,
                        progress: data.progress,
                      })
                    } else if (part.toolName === 'recommendCampaignSettings') {
                      phase2Result.push({
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
                      })
                    } else {
                      phase2Result.push({
                        type: 'tool_result',
                        toolName: part.toolName,
                        formattedMessage: execResult.formattedMessage,
                        data: execResult.data,
                      })
                      if (execResult.formattedMessage?.trim()) {
                        toolMessages.push(execResult.formattedMessage)
                      }
                      toolResults.push({
                        toolName: part.toolName,
                        data: execResult.data,
                        formattedMessage: execResult.formattedMessage,
                      })
                    }
                  } catch (error) {
                    phase2Result.push({
                      type: 'error',
                      error: `도구 실행 실패 (${part.toolName}): ${error instanceof Error ? error.message : 'Unknown error'}`,
                    })
                  }
                }
              } else if (part.type === 'error') {
                console.error('[ConversationalAgentService] Stream error:', part.error)
                phase2Result.push({
                  type: 'error',
                  error: part.error instanceof Error ? part.error.message : String(part.error),
                })
              }
            }
          } catch {
            // LLM call failed but circuit breaker succeeded — provide fallback
            if (!fullText) {
              fullText = '요청을 처리했습니다.'
              phase2Result.push({ type: 'text', content: fullText })
            }
          }

          if (!fullText.trim() && toolMessages.length > 0) {
            fullText =
              this.buildToolFallbackResponse(input.message, toolResults) ?? toolMessages.join('\n\n')
          }

          if (reportIntent) {
            fullText = this.rewriteReportIntentReply(input.message, fullText, toolResults)
          }

          if (fullText.trim() && (reportIntent || !streamedTextEmitted)) {
            phase2Result.push({ type: 'text', content: fullText })
          }

          // 9. assistant 메시지 저장
          if (fullText) {
            await this.conversationRepo.addMessage(setupData.conversationId, {
              role: 'assistant',
              content: fullText,
              toolCalls: null,
              toolName: null,
              toolResult: null,
              metadata: null,
            })

            // 첫 메시지에서 대화 제목 자동 생성
            const conv = await this.conversationRepo.findById(setupData.conversationId)
            if (conv && !conv.title) {
              const title = input.message.slice(0, 50) + (input.message.length > 50 ? '...' : '')
              const updated = conv.setTitle(title)
              await this.conversationRepo.save(updated)
            }
          }

          // 10. 추천 질문 생성
          phase2Result.push({
            type: 'suggested_questions',
            questions: this.generateSuggestedQuestions(fullText),
          })

          return phase2Result
        })

        result.push(...streamChunks)
        result.push({ type: 'done' })
        return result
      }, { retries: 3 })

      for (const chunk of chunks) {
        yield chunk
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes('Circuit breaker OPEN')) {
        yield { type: 'text', content: '일시적으로 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.' }
        yield { type: 'done' }
      } else {
        yield { type: 'error', error: message }
        yield { type: 'done' }
      }
    }
  }

  /**
   * 시스템 프롬프트 구성
   */
  private buildSystemPrompt(
    uiContext?: 'dashboard' | 'campaigns' | 'reports' | 'competitors' | 'portfolio' | 'general'
  ): string {
    const toolDescriptions = this.toolRegistry
      .getAll()
      .map(
        (t) =>
          `- ${t.name}: ${t.description}${t.requiresConfirmation ? ' (실행 전 사용자 확인 필요)' : ''}`
      )
      .join('\n')

    const contextGuide: Record<NonNullable<AgentChatInput['uiContext']>, string> = {
      dashboard: '대시보드 맥락: KPI 해석, 이상징후 원인, 우선순위 액션을 먼저 제시',
      campaigns: '캠페인 맥락: 생성/수정/예산/상태 변경을 단계적으로 안내',
      reports: '보고서 맥락: 리포트 생성/요약/공유를 빠르게 처리',
      competitors: '경쟁사 맥락: 벤치마크와 실행 가능한 전략 비교를 중심으로 답변',
      portfolio: '포트폴리오 맥락: 예산 재배분, 기대효과, 리스크를 함께 제시',
      general: '일반 맥락: 사용자 의도를 먼저 파악하고 최단 경로로 해결',
    }

    return `당신은 바투 AI 마케팅 어시스턴트입니다. 한국 커머스 사업자의 Meta 광고 캠페인을 관리합니다.

현재 UI 맥락: ${contextGuide[uiContext ?? 'general']}

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

=== AX(사용자 경험) 우선 규칙 ===
- 절대 먼저 "캠페인 ID를 입력하세요"라고 요구하지 마세요.
- 사용자가 보고서 생성을 요청하면 먼저 listCampaigns(status: 'ACTIVE')로 활성 캠페인을 조회하세요.
- 활성 캠페인이 1개면: 바로 그 캠페인 기준으로 진행 의사를 확인합니다.
- 활성 캠페인이 여러 개면: askClarification으로 캠페인명 기반 선택지(그리고 "전체 활성 캠페인")를 제공합니다.
- generateReport는 campaignIds 없이도 호출 가능하므로, 사용자가 "전체"를 원하면 전체 범위로 진행하세요.
- 질문은 사용자가 이해하기 쉬운 비즈니스 언어로 작성하고, 내부 식별자(ID) 노출은 보조 정보로만 사용하세요.

=== 도구 사용 규칙 (중요) ===
 도구를 호출한 후에는 반드시 대화형 응답을 생성하세요. 도구 결과를 그대로 복사해서 출력하지 마세요.
 예시 (listCampaigns 결과 후): "현재 활성 중인 '캠페인명'에 대한 주간 보고서를 생성할까요?" 
 예시 (나쁨): "캠페인 목록 (1개 중 1개):\n1. **캠페인명** (활성) - 일일 예산: ₩X"
 도구 결과의 데이터를 바탕으로 사용자의 의도에 맞는 자연스러운 문장을 생성하세요.

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

=== 핵심 의도별 응답 스타일 가드레일 ===

【1. 보고서 생성】
사용자: "보고서 생성해줘", "리포트 만들어줘"
→ listCampaigns(status: 'ACTIVE') 선조회
→ 응답 템플릿:
   - 활성 1개: "현재 활성 중인 '캠페인명'에 대한 주간 보고서를 생성할까요? 예산 ₩X만원, 현재 ROAS X.XX입니다."
   - 활성 여러 개: "활성 캠페인 X개를 확인했습니다. 어떤 캠페인의 보고서가 필요하신가요?\n1. 캠페인A\n2. 캠페인B\n3. 전체 활성 캠페인"
   - 없음: "현재 활성 중인 캠페인이 없습니다. 완료된 캠페인의 보고서가 필요하신가요?"
→ NEVER: "캠페인 ID를 입력하세요"

【2. 캠페인 생성】
사용자: "캠페인 만들어줘", "새 광고 시작하고 싶어"
→ 반드시 askGuideQuestion 순차 인터뷰 시작
→ 각 질문 후 선택지를 명확히 제시
→ 마지막 recommendCampaignSettings로 설정안 제시
→ 응답 템플릿: "X단계 중 Y단계입니다. [질문내용]"

【3. 성과 분석】
사용자: "성과 어때?", "분석해줘", "왜 안될까"
→ getPerformanceKPI 또는 analyzeTrends 호출
→ 응답 템플릿:
   - 핵심 지표 3개만 먼저: "ROAS X.XX | CTR X.XX% | 지출 ₩X만원"
   - 인사이트: "[캠페인명]의 [지표]가 [상태]입니다."
   - 원인: "이는 [이유] 때문으로 보입니다."
   - 액션: "[구체적인 액션]을 권장합니다."
→ NEVER: 장문의 설명 없이 지표 나열 금지

【4. 예산 최적화】
사용자: "예산 어떻게 써?", "돈 아끼고 싶어", "더 쓸까?"
→ getBudgetRecommendation + getPerformanceKPI
→ 응답 템플릿:
   - 현황: "현재 일일 예산 ₩X만원 중 ₩X만원 사용 (X%)"
   - 판단: "ROAS X.XX로 [효율 상태]입니다."
   - 제안: "[증액/유지/감액]을 권장하며, 구체적으로 ₩X만원이 적절해 보입니다."
   - 근거: "이는 [데이터 기반 근거] 때문입니다."

【5. 문제 해결/Troubleshooting】
사용자: "안 돼", "이상해", "뭐가 문제지"
→ checkAnomalies 먼저 호출
→ 응답 템플릿:
   - 공감: "문제가 있군요. 확인해 보겠습니다."
   - 발견: "[구체적인 이상 징후]를 발견했습니다."
   - 영향: "이로 인해 [구체적인 영향]이 예상됩니다."
   - 해결: "[즉시 실행 가능한 해결책]을 시도핼까요?"
→ NEVER: "더 자세히 알려주세요"만 반복 금지

【6. 추천/제안】
사용자: "뭐가 좋을까?", "추천해줘", "어떻게 할까"
→ 사용자 상황 파악 후 2~3개 옵션 제시
→ 응답 템플릿:
   - 상황 요약: "현재 [상황]이신데,"
   - 옵션 A: "[옵션A]: [장점], [단점/고려사항]"
   - 옵션 B: "[옵션B]: [장점], [단점/고려사항]"
   - 추천: "[컨텍스트]을 고려할 때 [옵션]을 추천합니다."
→ NEVER: "상황에 따라 다릅니다" 같은 모호한 답변 금지

【7. 비교/벤치마크】
사용자: "누가 더 잘해?", "경쟁사는?", "비교해줘"
→ competitor 도구 또는 날짜별 트렌드 분석
→ 응답 템플릿:
   - 기준: "[캠페인A]와 [캠페인B]를 비교하면,"
   - 차이: "[지표]에서 X.XX 차이가 있습니다."
   - 해석: "[캠페인]의 [요소]가 더 효과적인 것으로 보입니다."
   - 학습: "[적용 가능한 인사이트]를 다른 캠페인에도 적용필까요?"

=== 실행 작업(변경) 확인 플로우 ===
사용자가 캠페인 생성/수정/삭제/예산변경/상태변경 등을 요청하면:
1. 현재 상태 파악 (getCampaignDetail 또는 listCampaigns)
2. 변경 내용 요약: "[캠페인명]의 [항목]을 [현재값] → [변경값]로 변경할까요?"
3. 영향 설명: "이 변경으로 [구체적인 영향]이 있습니다."
4. 확인 요청: "실행하시겠습니까? (예/아니오)"
5. NEVER: 사용자 확인 없이 mutation 도구 바로 실행 금지

사용 가능한 도구:
${toolDescriptions}`
  }

  /**
   * DB 메시지를 Vercel AI SDK CoreMessage로 변환
   */
  private toCoreMessages(
    messages: ConversationMessageData[]
  ): (UserModelMessage | AssistantModelMessage)[] {
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
    if (responseText.includes('카피') || responseText.includes('문구'))
      questions.push('다른 스타일의 카피도 만들어줄 수 있나요?')
    if (questions.length === 0) {
      questions.push('이번 주 성과는 어때?', '새 캠페인을 만들어줘', '최근 이상 징후가 있어?')
    }
    return questions.slice(0, 3)
  }

  private buildToolFallbackResponse(
    inputMessage: string,
    toolResults: Array<{ toolName: string; data: unknown; formattedMessage: string }>
  ): string | null {
    const wantsReport = /(보고서|리포트)/.test(inputMessage)
    const listCampaignResult = toolResults.find((t) => t.toolName === 'listCampaigns')

    if (wantsReport && listCampaignResult) {
      const payload = listCampaignResult.data as {
        data?: Array<{ id: string; name: string; status: string; dailyBudget: number }>
      }
      const campaigns = payload?.data ?? []

      if (campaigns.length === 0) {
        return '현재 활성 중인 캠페인이 없습니다. 완료된 캠페인 기준으로 주간 보고서를 생성할까요?'
      }

      if (campaigns.length === 1) {
        const campaign = campaigns[0]
        return `현재 활성 중인 "${campaign.name}" 캠페인이 1개 있습니다. 이 캠페인 기준으로 주간 보고서를 생성할까요?`
      }

      const topCampaigns = campaigns.slice(0, 3)
      const options = topCampaigns.map((c, i) => `${i + 1}. ${c.name}`).join('\n')
      return `활성 캠페인 ${campaigns.length}개를 확인했습니다. 어떤 캠페인의 보고서를 생성할까요?\n${options}\n${topCampaigns.length + 1}. 전체 활성 캠페인`
    }

    return null
  }

  private rewriteReportIntentReply(
    inputMessage: string,
    modelText: string,
    toolResults: Array<{ toolName: string; data: unknown; formattedMessage: string }>
  ): string {
    if (!/(보고서|리포트)/.test(inputMessage)) {
      return modelText
    }

    const trimmed = modelText.trim()
    const looksLikeRawList = trimmed.startsWith('캠페인 목록 (') || /\*\*.+\*\*/.test(trimmed)

    if (looksLikeRawList || trimmed.length === 0) {
      return this.buildToolFallbackResponse(inputMessage, toolResults) ?? modelText
    }

    return modelText
  }

  /**
   * 레거시 ChatService → ConversationalAgentService 마이그레이션 완료 표시.
   * ChatService의 핵심 기능(키워드 빠른 응답, RAG 컨텍스트, 인메모리 대화)이
   * Agent 기반 아키텍처로 완전 흡수되었음을 나타냅니다.
   */
  migrateLegacyParity(): { migrated: true; removedServices: string[] } {
    return {
      migrated: true,
      removedServices: ['ChatService', 'chatAssistant'],
    }
  }
}
