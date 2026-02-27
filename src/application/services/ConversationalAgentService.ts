import { streamText, stepCountIs, type UserModelMessage, type AssistantModelMessage, type ToolModelMessage } from 'ai'
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
import { IntentClassifier } from '@domain/services/IntentClassifier'
import { ChatIntent } from '@domain/value-objects/ChatIntent'

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
  insightsContext?: string
}

// ============================================================================
// Service
// ============================================================================

export class ConversationalAgentService {
  private readonly intentClassifier = IntentClassifier.create()

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
      // Phase 1: Setup — retry + CB로 보호, DB 작업은 스트리밍 전에 완료
      const setupData = await this.resilienceService.withRetry(
        () =>
          this.resilienceService.circuitBreaker('db-setup').execute(async () => {
            let conversationId = input.conversationId
            if (!conversationId) {
              const conv = Conversation.create(input.userId)
              const saved = await this.conversationRepo.save(conv)
              conversationId = saved?.id ?? input.conversationId ?? crypto.randomUUID()
            }

            await this.conversationRepo.addMessage(conversationId, {
              role: 'user',
              content: input.message,
              toolCalls: null,
              toolName: null,
              toolResult: null,
              metadata: null,
            })

            let agentContext: AgentContext
            if (this.buildAgentContext) {
              const baseContext = await this.buildAgentContext(input.userId)
              agentContext = { ...baseContext, conversationId }
            } else {
              agentContext = { conversationId } as AgentContext
            }

            const history = await this.conversationRepo.getMessages(conversationId, { limit: 20 })
            const messages = this.toCoreMessages(history)
            const systemPrompt = this.buildSystemPrompt(input.uiContext, input.message, input.insightsContext)

            return { conversationId, agentContext, messages, systemPrompt }
          }),
        { retries: 2 }
      )

      yield { type: 'conversation', conversationId: setupData.conversationId }

      // Phase 2: LLM 스트리밍 — 청크를 즉시 yield (진정한 스트리밍)
      // CB 패턴은 request-response에 적합하지만 long-lived stream과는 비호환이므로 제거
      const reportIntent = /(보고서|리포트)/.test(input.message)
      let fullText = ''
      let streamedTextEmitted = false
      const toolMessages: string[] = []
      const toolResults: Array<{ toolName: string; data: unknown; formattedMessage: string }> = []

      yield { type: 'progress', stage: 'thinking', progress: 10 }

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
              yield { type: 'text', content: part.text }
              streamedTextEmitted = true
            }
          } else if (part.type === 'tool-call') {
            yield* this.handleToolCall(part, setupData, toolMessages, toolResults)
          } else if (part.type === 'error') {
            console.error('[ConversationalAgentService] Stream error:', part.error)
            yield {
              type: 'error' as const,
              error: part.error instanceof Error ? part.error.message : String(part.error),
            }
          }
        }
      } catch {
        if (!fullText) {
          fullText = '요청을 처리했습니다.'
          yield { type: 'text', content: fullText }
        }
      }

      // 후처리: 폴백/보고서 응답 재작성
      if (!fullText.trim() && toolMessages.length > 0) {
        fullText =
          this.buildToolFallbackResponse(input.message, toolResults) ?? toolMessages.join('\n\n')
      }
      if (reportIntent) {
        fullText = this.rewriteReportIntentReply(input.message, fullText, toolResults)
      }
      if (fullText.trim() && (reportIntent || !streamedTextEmitted)) {
        yield { type: 'text', content: fullText }
      }

      // assistant 메시지 저장 (스트리밍 완료 후, 실패해도 사용자 응답에 영향 없음)
      if (fullText) {
        try {
          await this.conversationRepo.addMessage(setupData.conversationId, {
            role: 'assistant',
            content: fullText,
            toolCalls: null,
            toolName: null,
            toolResult: null,
            metadata: null,
          })

          const conv = await this.conversationRepo.findById(setupData.conversationId)
          if (conv && !conv.title) {
            const title = input.message.slice(0, 50) + (input.message.length > 50 ? '...' : '')
            const updated = conv.setTitle(title)
            await this.conversationRepo.save(updated)
          }
        } catch (err) {
          console.error('[ConversationalAgentService] assistant 메시지 저장 실패:', err)
        }
      }

      yield {
        type: 'suggested_questions',
        questions: this.generateSuggestedQuestions(input.message),
      }
      yield { type: 'done' }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async *handleToolCall(
    part: { toolName: string; input: unknown },
    setupData: { conversationId: string; agentContext: AgentContext },
    toolMessages: string[],
    toolResults: Array<{ toolName: string; data: unknown; formattedMessage: string }>
  ): AsyncIterable<AgentStreamChunk> {
    const agentTool = this.toolRegistry.get(part.toolName)
    if (!agentTool) return

    yield {
      type: 'tool_call',
      toolName: part.toolName,
      args: part.input as Record<string, unknown>,
    }

    if (agentTool.requiresConfirmation) {
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
      try {
        const toolArgs = part.input as Record<string, unknown>
        const execResult = await agentTool.execute(toolArgs, setupData.agentContext)

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
        yield {
          type: 'error',
          error: `도구 실행 실패 (${part.toolName}): ${error instanceof Error ? error.message : 'Unknown error'}`,
        }
      }
    }
  }


  /**
   * 시스템 프롬프트 구성
   */
  private buildSystemPrompt(
    uiContext?: 'dashboard' | 'campaigns' | 'reports' | 'competitors' | 'portfolio' | 'general',
    userMessage?: string,
    insightsContext?: string
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

    // 인텐트 분류 → 해당 가이드라인만 포함
    const intent = userMessage
      ? this.intentClassifier.classify(userMessage).intent
      : ChatIntent.GENERAL

    const intentGuides = this.getIntentGuide(intent)

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
- 절대 먼저 "캠페인 ID를 입력하세요"라고 요구하지 마세요.
- 질문은 비즈니스 언어로, ID는 보조 정보로만 사용하세요.

=== 도구 사용 규칙 (중요) ===
도구를 호출한 후에는 반드시 대화형 응답을 생성하세요. 도구 결과를 그대로 복사해서 출력하지 마세요.
도구 결과의 데이터를 바탕으로 사용자의 의도에 맞는 자연스러운 문장을 생성하세요.
사용자 확인 없이 mutation 도구를 바로 실행하지 마세요.

${intentGuides}
${insightsContext ? `
=== 현재 대시보드 AI 인사이트 (실시간 데이터 — 최우선 참조) ===
아래는 대시보드에서 실시간 감지된 인사이트입니다. 이 데이터는 Meta API에서 직접 가져온 최신 값이므로 도구 결과보다 우선합니다.

사용자가 인사이트에 언급된 지표(하락, 급증 등)를 질문하면:
1. 인사이트의 수치(현재값, 변화율, 캠페인명)를 정확히 인용하여 답변합니다
2. 도구(checkAnomalies/analyzeTrends)는 추가 맥락(기간별 추세, 다른 지표 비교)을 보충하는 용도로 사용합니다
3. 도구 결과와 인사이트 수치가 다르면 인사이트 수치가 정확합니다 (도구는 로컬 DB 집계이므로 지연 가능)

${insightsContext}
` : ''}
사용 가능한 도구:
${toolDescriptions}`
  }

  /**
   * 인텐트별 가이드라인 — 해당 인텐트의 섹션만 반환하여 토큰 절감
   */
  private getIntentGuide(intent: ChatIntent): string {
    const guides: Record<ChatIntent, string> = {
      [ChatIntent.CAMPAIGN_CREATION]: `=== 캠페인 가이드 프로토콜 ===
반드시 askGuideQuestion 도구로 순차 인터뷰를 시작합니다. 일반 텍스트로 질문하지 마세요.
질문은 한 번에 하나만. 모든 질문 완료 후 recommendCampaignSettings 호출.
질문 순서: 경험 수준 → 업종 → 목표 → 예산 → 타겟(초보자만)
BEGINNER → Advantage+ 강력 추천, INTERMEDIATE → Advantage+ 기본, ADVANCED → 수동 모드 기본`,

      [ChatIntent.REPORT_QUERY]: `=== 보고서 생성 가이드 ===
먼저 listCampaigns(status: 'ACTIVE')로 활성 캠페인을 조회하세요.
활성 1개: 해당 캠페인 기준으로 진행 의사 확인
활성 여러 개: 캠페인명 기반 선택지 + "전체 활성 캠페인" 옵션 제공
없음: 완료된 캠페인 보고서 제안
NEVER: "캠페인 ID를 입력하세요"`,

      [ChatIntent.KPI_ANALYSIS]: `=== 성과 분석 가이드 ===
대시보드 인사이트에 관련 데이터가 있으면 그 수치를 정확히 인용하여 답변합니다 (도구 호출 없이도 답변 가능).
추가 분석이 필요하면 checkAnomalies 또는 analyzeTrends를 보충 호출합니다.
이상 징후(하락, 급증, 급감, 감지) 질문에는 인사이트 인용 + checkAnomalies 보충.
일반 성과 조회에는 getPerformanceKPI 또는 analyzeTrends를 호출합니다.
핵심 지표 3개 먼저: "ROAS X.XX | CTR X.XX% | 지출 ₩X만원"
인사이트 수치 인용 → 원인 분석 → 구체적인 액션 순서로 답변
NEVER: 장문 설명 없이 지표만 나열, 도구 결과를 인사이트보다 우선하지 마세요`,

      [ChatIntent.PIXEL_SETUP]: `=== 픽셀 설정 가이드 ===
설치 플랫폼 확인 → 전환 이벤트 설정 → 기존 픽셀 상태 점검 순서로 안내합니다.
기술적 용어를 최소화하고 단계별로 안내하세요.`,

      [ChatIntent.BUDGET_OPTIMIZATION]: `=== 예산 최적화 가이드 ===
getBudgetRecommendation + getPerformanceKPI를 호출합니다.
현황 → 판단(ROAS 기반) → 제안(구체적 금액) → 근거 순서로 답변
NEVER: 모호한 "상황에 따라 다릅니다" 답변`,

      [ChatIntent.GENERAL]: `=== 일반 응답 가이드 ===
사용자 의도를 먼저 파악하고 최단 경로로 해결합니다.
보고서 요청 → listCampaigns 선조회, 캠페인 생성 → askGuideQuestion 인터뷰
문제 해결 → checkAnomalies 먼저 호출, 비교 → competitor 도구 활용`,
    }
    return guides[intent]
  }

  /**
   * DB 메시지를 Vercel AI SDK CoreMessage로 변환
   * tool 메시지를 포함하여 LLM이 이전 도구 호출 결과를 참조할 수 있도록 함
   */
  private toCoreMessages(
    messages: ConversationMessageData[]
  ): (UserModelMessage | AssistantModelMessage | ToolModelMessage)[] {
    // toolCallId 매핑: assistant의 toolCalls와 후속 tool 결과를 연결
    const toolCallIdMap = new Map<string, string>()
    let pendingCalls: { toolCallId: string; toolName: string }[] = []

    for (const m of messages) {
      if (m.role === 'assistant' && m.toolCalls?.length) {
        pendingCalls = m.toolCalls.map((tc, i) => ({
          toolCallId: `${m.id}-tc-${i}`,
          toolName: tc.name,
        }))
      } else if (m.role === 'tool' && m.toolName) {
        const match = pendingCalls.find((tc) => tc.toolName === m.toolName)
        if (match) {
          toolCallIdMap.set(m.id, match.toolCallId)
          pendingCalls = pendingCalls.filter((tc) => tc !== match)
        } else {
          toolCallIdMap.set(m.id, `orphan-${m.id}`)
        }
      }
    }

    return messages
      .filter((m) => m.role !== 'system')
      .map((m): UserModelMessage | AssistantModelMessage | ToolModelMessage => {
        if (m.role === 'assistant' && m.toolCalls?.length) {
          return {
            role: 'assistant' as const,
            content: [
              ...(m.content ? [{ type: 'text' as const, text: m.content }] : []),
              ...m.toolCalls.map((tc, i) => ({
                type: 'tool-call' as const,
                toolCallId: `${m.id}-tc-${i}`,
                toolName: tc.name,
                input: tc.args as unknown,
              })),
            ],
          } as AssistantModelMessage
        }
        if (m.role === 'tool') {
          return {
            role: 'tool' as const,
            content: [
              {
                type: 'tool-result' as const,
                toolCallId: toolCallIdMap.get(m.id) ?? `orphan-${m.id}`,
                toolName: m.toolName ?? 'unknown',
                output: {
                  type: 'json' as const,
                  value: m.toolResult ?? m.content ?? '',
                },
              },
            ],
          } as ToolModelMessage
        }
        return {
          role: m.role as 'user' | 'assistant',
          content: m.content ?? '',
        }
      })
  }

  /**
   * 응답 기반 추천 질문 생성
   */
  /**
   * 인텐트 기반 추천 질문 생성 — 현재 대화 맥락에 맞는 후속 질문 제안
   */
  private generateSuggestedQuestions(userMessage: string): string[] {
    const result = this.intentClassifier.classify(userMessage)
    const intent = result.intent

    // 인텐트별 후속 질문 맵 — 현재 의도의 자연스러운 다음 단계
    const followUpMap: Record<ChatIntent, string[]> = {
      [ChatIntent.CAMPAIGN_CREATION]: [
        '현재 활성 캠페인 성과를 먼저 볼까요?',
        '예산은 얼마로 설정하면 좋을까요?',
        '경쟁사는 어떤 광고를 하고 있나요?',
      ],
      [ChatIntent.REPORT_QUERY]: [
        '성과가 가장 좋은 캠페인은 어떤 건가요?',
        '지난주 대비 변화가 있나요?',
        '예산 최적화가 필요한 캠페인이 있나요?',
      ],
      [ChatIntent.KPI_ANALYSIS]: [
        'ROAS를 개선하려면 어떻게 해야 하나요?',
        '예산을 어떻게 재분배하면 좋을까요?',
        '이상 징후가 있는 캠페인이 있나요?',
      ],
      [ChatIntent.PIXEL_SETUP]: [
        '전환 이벤트는 어떤 것을 추적하면 좋을까요?',
        '픽셀이 정상 작동하는지 확인해줘',
        '카페24에 픽셀을 설치하고 싶어요',
      ],
      [ChatIntent.BUDGET_OPTIMIZATION]: [
        '성과가 좋은 캠페인에 예산을 더 투자할까요?',
        '전체 포트폴리오 최적화 제안을 볼까요?',
        '비용 대비 효율이 낮은 캠페인은 어떤 건가요?',
      ],
      [ChatIntent.GENERAL]: [
        '이번 주 성과는 어때?',
        '새 캠페인을 만들어줘',
        '최근 이상 징후가 있어?',
      ],
    }

    return followUpMap[intent]
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

}
