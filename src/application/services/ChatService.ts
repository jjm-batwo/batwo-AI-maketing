/**
 * RAG-based Chatbot Service for Campaign Insights Q&A
 *
 * 주요 기능:
 * - 사용자 캠페인 데이터 기반 컨텍스트 생성
 * - 대화 히스토리 관리
 * - 일반적인 마케팅 질문 패턴 감지 및 최적화
 * - 액션 제안 및 후속 질문 제시
 */

import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IReportRepository } from '@domain/repositories/IReportRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IAIService } from '@application/ports/IAIService'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

// ============================================================================
// Types
// ============================================================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: Date
}

export interface ChatContext {
  campaigns: {
    id: string
    name: string
    status: string
    metrics: {
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
      roas: number
      ctr: number
      cvr: number
      cpa: number
    }
  }[]
  recentReports: {
    id: string
    summary: string
    date: string
    keyMetrics: { name: string; value: string; change?: string }[]
  }[]
  recentAnomalies: {
    campaignName: string
    metric: string
    change: number
    severity: string
  }[]
}

export interface ChatResponse {
  message: string
  sources: {
    type: 'campaign' | 'report' | 'anomaly'
    id: string
    relevance: number
  }[]
  suggestedActions?: {
    action: string
    campaignId?: string
  }[]
  suggestedQuestions?: string[]
}

/**
 * 대화 히스토리 저장소 (인메모리)
 * 실제 프로덕션에서는 Redis나 DB 테이블 사용 권장
 */
interface ConversationHistory {
  conversationId: string
  userId: string
  messages: ChatMessage[]
  createdAt: Date
  lastActivity: Date
}

// ============================================================================
// Service
// ============================================================================

export class ChatService {
  // 인메모리 대화 히스토리 저장소
  private conversations: Map<string, ConversationHistory> = new Map()

  // 히스토리 TTL: 1시간
  private readonly HISTORY_TTL_MS = 60 * 60 * 1000

  constructor(
    private readonly campaignRepo: ICampaignRepository,
    private readonly reportRepo: IReportRepository,
    private readonly kpiRepo: IKPIRepository,
    private readonly aiService: IAIService
  ) {
    // 주기적으로 만료된 대화 정리 (5분마다)
    setInterval(() => this.cleanExpiredConversations(), 5 * 60 * 1000)
  }

  /**
   * 메인 챗 메서드
   */
  async chat(
    userId: string,
    message: string,
    conversationId?: string
  ): Promise<ChatResponse & { conversationId: string }> {
    // 1. 대화 히스토리 가져오기 또는 새로 생성
    const conversation = conversationId
      ? this.getConversation(conversationId)
      : this.createConversation(userId)

    if (!conversation || conversation.userId !== userId) {
      throw new Error('Invalid conversation')
    }

    // 2. 사용자 메시지 추가
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    })
    conversation.lastActivity = new Date()

    // 3. 사용자 데이터 컨텍스트 구축
    const context = await this.buildContext(userId)

    // 4. 질문 패턴 감지 및 빠른 응답
    const quickResponse = await this.tryQuickResponse(message, context)
    if (quickResponse) {
      conversation.messages.push({
        role: 'assistant',
        content: quickResponse.message,
        timestamp: new Date(),
      })

      return {
        ...quickResponse,
        conversationId: conversation.conversationId,
      }
    }

    // 5. AI 응답 생성
    const aiResponse = await this.generateResponse(
      message,
      context,
      conversation.messages.slice(-10) // 최근 10개 메시지만 사용
    )

    // 6. 응답 저장
    conversation.messages.push({
      role: 'assistant',
      content: aiResponse.message,
      timestamp: new Date(),
    })

    return {
      ...aiResponse,
      conversationId: conversation.conversationId,
    }
  }

  /**
   * 사용자 캠페인 데이터 기반 컨텍스트 구축
   */
  async buildContext(userId: string): Promise<ChatContext> {
    // 캠페인 데이터
    const campaigns = await this.campaignRepo.findByUserId(userId)

    // 각 캠페인의 최근 30일 KPI 집계
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const campaignsContext = await Promise.all(
      campaigns.map(async (c) => {
        const kpiAgg = await this.kpiRepo.aggregateByCampaignId(
          c.id,
          thirtyDaysAgo,
          now
        )

        const roas = kpiAgg.totalSpend > 0 ? kpiAgg.totalRevenue / kpiAgg.totalSpend : 0
        const ctr = kpiAgg.totalImpressions > 0 ? (kpiAgg.totalClicks / kpiAgg.totalImpressions) * 100 : 0
        const cvr = kpiAgg.totalClicks > 0 ? (kpiAgg.totalConversions / kpiAgg.totalClicks) * 100 : 0
        const cpa = kpiAgg.totalConversions > 0 ? kpiAgg.totalSpend / kpiAgg.totalConversions : 0

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          metrics: {
            impressions: kpiAgg.totalImpressions,
            clicks: kpiAgg.totalClicks,
            conversions: kpiAgg.totalConversions,
            spend: kpiAgg.totalSpend,
            revenue: kpiAgg.totalRevenue,
            roas,
            ctr,
            cvr,
            cpa,
          },
        }
      })
    )

    // 최근 리포트 (최근 3개)
    const allReports = await this.reportRepo.findByUserId(userId)
    const reports = allReports.slice(0, 3)
    const reportsContext = reports.map((r) => {
      // AI Insights에서 summary 추출
      const summary = r.aiInsights.length > 0
        ? r.aiInsights[0].insight
        : '리포트 요약 없음'

      // Section에서 주요 메트릭 추출
      const keyMetrics = r.sections
        .filter((s) => s.metrics)
        .flatMap((s) =>
          Object.entries(s.metrics ?? {})
            .filter(([_, value]) => value !== undefined)
            .map(([name, value]) => ({
              name,
              value: String(value),
            }))
        )
        .slice(0, 5)

      return {
        id: r.id,
        summary,
        date: r.createdAt.toISOString(),
        keyMetrics,
      }
    })

    // 이상 징후 (실제로는 AnomalyDetectionService에서 가져와야 함)
    // 여기서는 간단히 ROAS가 낮은 캠페인을 이상 징후로 간주
    const recentAnomalies = campaignsContext
      .filter((c) => c.metrics.roas < 1.5 && c.status === CampaignStatus.ACTIVE)
      .map((c) => ({
        campaignName: c.name,
        metric: 'ROAS',
        change: c.metrics.roas - 2.5, // 목표 대비 변화
        severity: c.metrics.roas < 1.0 ? 'critical' : 'warning',
      }))
      .slice(0, 5)

    return {
      campaigns: campaignsContext,
      recentReports: reportsContext,
      recentAnomalies,
    }
  }

  /**
   * 일반적인 질문 패턴 감지 및 빠른 응답
   */
  private async tryQuickResponse(
    message: string,
    context: ChatContext
  ): Promise<ChatResponse | null> {
    const lowerMessage = message.toLowerCase()

    // 패턴 1: ROAS 하락 질문
    if (
      (lowerMessage.includes('roas') || lowerMessage.includes('로아스')) &&
      (lowerMessage.includes('떨어') ||
        lowerMessage.includes('낮') ||
        lowerMessage.includes('하락'))
    ) {
      const lowRoasCampaigns = context.campaigns.filter(
        (c) => c.metrics.roas < 1.5 && c.status === CampaignStatus.ACTIVE
      )

      if (lowRoasCampaigns.length === 0) {
        return null // AI 응답 필요
      }

      const analysis = lowRoasCampaigns
        .map(
          (c) =>
            `- **${c.name}**: ROAS ${c.metrics.roas.toFixed(2)}x (CPA: ₩${c.metrics.cpa.toLocaleString('ko-KR')})`
        )
        .join('\n')

      return {
        message: `현재 ROAS가 낮은 캠페인이 ${lowRoasCampaigns.length}개 있습니다:\n\n${analysis}\n\n주요 원인으로는 타겟팅 피로도, 크리에이티브 성과 하락, 경쟁 심화 등이 있을 수 있습니다.`,
        sources: lowRoasCampaigns.map((c) => ({
          type: 'campaign' as const,
          id: c.id,
          relevance: 1.0,
        })),
        suggestedActions: [
          {
            action: '성과가 낮은 소재를 교체하고 새로운 크리에이티브 테스트',
            campaignId: lowRoasCampaigns[0].id,
          },
          {
            action: '타겟 오디언스를 확장하거나 룩어라이크 생성',
            campaignId: lowRoasCampaigns[0].id,
          },
        ],
        suggestedQuestions: [
          '어떤 캠페인을 중단해야 하나요?',
          '예산을 어떻게 재분배해야 하나요?',
          '크리에이티브 성과는 어떤가요?',
        ],
      }
    }

    // 패턴 2: 확장 (스케일링) 질문
    if (
      lowerMessage.includes('확장') ||
      lowerMessage.includes('스케일') ||
      lowerMessage.includes('늘리')
    ) {
      const highPerformingCampaigns = context.campaigns
        .filter((c) => c.metrics.roas >= 2.5 && c.status === CampaignStatus.ACTIVE)
        .sort((a, b) => b.metrics.roas - a.metrics.roas)
        .slice(0, 3)

      if (highPerformingCampaigns.length === 0) {
        return {
          message:
            '현재 ROAS 2.5x 이상의 캠페인이 없어 확장을 권장하기 어렵습니다. 먼저 기존 캠페인의 성과를 개선하는 것을 추천드립니다.',
          sources: [],
          suggestedActions: [
            { action: '타겟팅 및 크리에이티브 최적화를 통해 ROAS 개선' },
          ],
          suggestedQuestions: [
            '어떻게 ROAS를 개선할 수 있나요?',
            '예산을 줄여야 하나요?',
          ],
        }
      }

      const recommendations = highPerformingCampaigns
        .map(
          (c) =>
            `- **${c.name}**: ROAS ${c.metrics.roas.toFixed(2)}x, 현재 지출 ₩${c.metrics.spend.toLocaleString('ko-KR')}/일`
        )
        .join('\n')

      return {
        message: `다음 캠페인들이 확장 적합합니다:\n\n${recommendations}\n\n점진적으로 예산을 20-30%씩 증액하며 ROAS 변화를 모니터링하세요.`,
        sources: highPerformingCampaigns.map((c) => ({
          type: 'campaign' as const,
          id: c.id,
          relevance: 1.0,
        })),
        suggestedActions: highPerformingCampaigns.map((c) => ({
          action: `${c.name} 예산을 ₩${Math.round(c.metrics.spend * 1.3).toLocaleString('ko-KR')}/일로 30% 증액`,
          campaignId: c.id,
        })),
        suggestedQuestions: [
          '확장 시 주의할 점은 무엇인가요?',
          '얼마나 빨리 예산을 늘려야 하나요?',
        ],
      }
    }

    // 패턴 3: 예산 배분 질문
    if (
      lowerMessage.includes('예산') &&
      (lowerMessage.includes('배분') || lowerMessage.includes('분배'))
    ) {
      const totalSpend = context.campaigns.reduce(
        (sum, c) => sum + c.metrics.spend,
        0
      )
      const totalRevenue = context.campaigns.reduce(
        (sum, c) => sum + c.metrics.revenue,
        0
      )
      const overallRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

      const sortedByRoas = [...context.campaigns]
        .filter((c) => c.status === CampaignStatus.ACTIVE)
        .sort((a, b) => b.metrics.roas - a.metrics.roas)

      const topPerformers = sortedByRoas.slice(0, 3)
      const underperformers = sortedByRoas.filter((c) => c.metrics.roas < 1.5)

      return {
        message: `전체 ROAS는 ${overallRoas.toFixed(2)}x입니다.\n\n**예산 재분배 권장사항:**\n\n상위 성과 캠페인 (예산 증액):\n${topPerformers.map((c) => `- ${c.name}: ROAS ${c.metrics.roas.toFixed(2)}x → 예산 +30%`).join('\n')}\n\n저성과 캠페인 (예산 감축):\n${underperformers.map((c) => `- ${c.name}: ROAS ${c.metrics.roas.toFixed(2)}x → 예산 -50% 또는 중단 검토`).join('\n')}`,
        sources: [...topPerformers, ...underperformers].map((c) => ({
          type: 'campaign' as const,
          id: c.id,
          relevance: 1.0,
        })),
        suggestedActions: [
          {
            action: '상위 3개 캠페인 예산 30% 증액',
          },
          {
            action: 'ROAS 1.5x 미만 캠페인 예산 50% 감축',
          },
        ],
        suggestedQuestions: [
          '언제 예산을 변경해야 하나요?',
          '캠페인을 중단하는 기준은 무엇인가요?',
        ],
      }
    }

    return null // AI 응답 필요
  }

  /**
   * AI 기반 응답 생성
   */
  private async generateResponse(
    message: string,
    context: ChatContext,
    history: ChatMessage[]
  ): Promise<ChatResponse> {
    // 시스템 프롬프트에 컨텍스트 주입
    const systemPrompt = this.buildSystemPrompt(context)

    // 대화 히스토리 포맷팅
    const historyText = history
      .filter((m) => m.role !== 'system')
      .slice(-6) // 최근 3턴만 사용
      .map((m) => `${m.role === 'user' ? '사용자' : '어시스턴트'}: ${m.content}`)
      .join('\n')

    const userPrompt = `${historyText ? `이전 대화:\n${historyText}\n\n` : ''}현재 질문: ${message}\n\n위 질문에 대해 사용자의 캠페인 데이터를 기반으로 구체적이고 실행 가능한 답변을 제공하세요. 관련 있는 캠페인이나 리포트가 있다면 명시하세요.`

    // OpenAI API 호출 (AIService의 chatCompletion 메서드 직접 사용 불가하므로 우회)
    // 여기서는 generateReportInsights를 활용하여 유사한 형태로 호출
    // 실제로는 AIService에 범용 chat 메서드를 추가하는 것이 좋음
    const rawResponse = await this.generateChatCompletion(
      systemPrompt,
      userPrompt
    )

    // JSON 파싱 시도 (구조화된 응답이면)
    let parsedResponse: ChatResponse
    try {
      const jsonMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/)
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : rawResponse.trim()
      parsedResponse = JSON.parse(jsonStr) as ChatResponse
    } catch {
      // 일반 텍스트 응답
      parsedResponse = {
        message: rawResponse,
        sources: [],
        suggestedQuestions: [
          '다른 궁금한 점이 있으신가요?',
          '추가 분석이 필요하신가요?',
        ],
      }
    }

    return parsedResponse
  }

  /**
   * 시스템 프롬프트 생성 (컨텍스트 주입)
   */
  private buildSystemPrompt(context: ChatContext): string {
    const campaignSummary = context.campaigns
      .map(
        (c) =>
          `- ${c.name} (${c.status}): ROAS ${c.metrics.roas.toFixed(2)}x, 지출 ₩${c.metrics.spend.toLocaleString('ko-KR')}, 전환 ${c.metrics.conversions}개`
      )
      .join('\n')

    const anomalySummary = context.recentAnomalies
      .map(
        (a) =>
          `- ${a.campaignName}: ${a.metric} ${a.change > 0 ? '+' : ''}${a.change.toFixed(1)}x (${a.severity})`
      )
      .join('\n')

    return `당신은 한국 디지털 마케팅 전문 AI 어시스턴트입니다. 사용자의 Meta 광고 캠페인 성과를 분석하고, 실행 가능한 조언을 제공합니다.

**현재 사용자 캠페인 현황:**
${campaignSummary || '- 활성 캠페인 없음'}

**최근 이상 징후:**
${anomalySummary || '- 특이사항 없음'}

**역할 및 원칙:**
1. 사용자 데이터를 기반으로 구체적이고 맞춤화된 답변 제공
2. 실행 가능한 액션 아이템 제시 (예: "XX 캠페인 예산 30% 증액")
3. 명확하고 간결한 한국어 사용
4. 근거 있는 권장사항 제공 (ROAS, CPA 등 수치 기반)
5. 불확실한 경우 "추가 데이터가 필요합니다" 명시

**응답 형식 (선택):**
구조화된 응답이 적절한 경우 다음 JSON 형식 사용:
\`\`\`json
{
  "message": "답변 내용",
  "sources": [{ "type": "campaign", "id": "캠페인ID", "relevance": 1.0 }],
  "suggestedActions": [{ "action": "실행 아이템", "campaignId": "ID" }],
  "suggestedQuestions": ["후속 질문1", "후속 질문2"]
}
\`\`\`

일반 대화는 자연스러운 텍스트로 응답하세요.`
  }

  /**
   * 범용 Chat Completion (AIService 확장 대신 임시 구현)
   */
  private async generateChatCompletion(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    // AIService의 private chatCompletion 메서드를 사용할 수 없으므로
    // 임시로 generateReportInsights를 활용하거나, 여기서 직접 OpenAI API 호출
    // 프로덕션에서는 AIService에 public chat() 메서드 추가 권장

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = (await response.json()) as {
      choices: { message: { content: string } }[]
    }
    return data.choices[0]?.message?.content ?? ''
  }

  /**
   * 대화 히스토리 관리
   */
  private createConversation(userId: string): ConversationHistory {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`
    const conversation: ConversationHistory = {
      conversationId,
      userId,
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date(),
    }

    this.conversations.set(conversationId, conversation)
    return conversation
  }

  private getConversation(conversationId: string): ConversationHistory | null {
    return this.conversations.get(conversationId) ?? null
  }

  private cleanExpiredConversations(): void {
    const now = Date.now()
    for (const [id, conv] of this.conversations.entries()) {
      if (now - conv.lastActivity.getTime() > this.HISTORY_TTL_MS) {
        this.conversations.delete(id)
      }
    }
  }

  /**
   * 대화 히스토리 조회 (디버깅/로깅용)
   */
  getConversationHistory(conversationId: string): ChatMessage[] | null {
    const conv = this.conversations.get(conversationId)
    return conv?.messages ?? null
  }
}
