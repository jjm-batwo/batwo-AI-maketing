import type { IIntentLLMPort } from '@domain/ports/IIntentLLMPort'
import type { IAIService, AIConfig } from '@application/ports/IAIService'
import { ChatIntent } from '@domain/value-objects/ChatIntent'

const TRUNCATE_LENGTH = 500

const INTENT_LLM_CONFIG: AIConfig = {
  temperature: 0,
  maxTokens: 20,
  model: 'gpt-4o-mini',
}

const INTENT_DESCRIPTIONS: Record<ChatIntent, string> = {
  [ChatIntent.CAMPAIGN_CREATION]: '캠페인 생성/시작/런칭',
  [ChatIntent.REPORT_QUERY]: '리포트 조회/보고서 확인/데이터 요청',
  [ChatIntent.KPI_ANALYSIS]: 'KPI 분석/성과 확인/효율 질문',
  [ChatIntent.PIXEL_SETUP]: '픽셀 설치/추적 코드 설정',
  [ChatIntent.BUDGET_OPTIMIZATION]: '예산 최적화/광고비 조정',
  [ChatIntent.CREATIVE_FATIGUE]: '소재 피로도/크리에이티브 교체/빈도 문제',
  [ChatIntent.LEARNING_PHASE]: '학습 단계/예산 미소진/노출 안 됨',
  [ChatIntent.STRUCTURE_OPTIMIZATION]: '캠페인 구조 정리/세트 통합/CBO·ABO',
  [ChatIntent.LEAD_QUALITY]: '리드 품질/허수 고객/가짜 문의',
  [ChatIntent.TRACKING_HEALTH]: '전환 추적/CAPI/이벤트 매칭/데이터 불일치',
  [ChatIntent.GENERAL]: '일반 인사/잡담/분류 불가',
}

const SYSTEM_PROMPT = `당신은 마케팅 챗봇의 인텐트 분류기입니다.
사용자 메시지를 읽고, 아래 인텐트 중 가장 적합한 것 하나만 반환하세요.

가능한 인텐트:
${Object.entries(INTENT_DESCRIPTIONS)
  .map(([key, desc]) => `- ${key}: ${desc}`)
  .join('\n')}

규칙:
- 인텐트 이름만 반환 (예: CAMPAIGN_CREATION)
- 설명이나 이유를 붙이지 마세요
- 확실하지 않으면 GENERAL을 반환하세요`

export class IntentLLMAdapter implements IIntentLLMPort {
  constructor(private readonly aiService: IAIService) {}

  async classifyIntent(message: string, _candidates: ChatIntent[]): Promise<ChatIntent> {
    const truncated = message.length > TRUNCATE_LENGTH
      ? message.slice(0, TRUNCATE_LENGTH)
      : message

    const response = await this.aiService.chatCompletion(
      SYSTEM_PROMPT,
      truncated,
      INTENT_LLM_CONFIG,
    )

    return this.parseIntent(response.trim())
  }

  private parseIntent(response: string): ChatIntent {
    const normalized = response.toUpperCase().trim()
    const values = Object.values(ChatIntent) as string[]

    if (values.includes(normalized)) {
      return normalized as ChatIntent
    }

    return ChatIntent.GENERAL
  }
}
