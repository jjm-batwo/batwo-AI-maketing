import type { AIConfig } from '@application/ports/IAIService'

export interface KPIInsightPromptInput {
  insights: Array<{
    id: string
    title: string
    description: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    category: string
    metric?: string
    currentValue?: number
    changePercent?: number
  }>
  model: 'gpt-4o' | 'gpt-4o-mini'
}

export function buildKPIInsightPrompt(input: KPIInsightPromptInput): {
  systemPrompt: string
  userPrompt: string
  config: AIConfig
} {
  const systemPrompt =
    '당신은 한국 이커머스 광고 성과를 분석하는 디지털 마케팅 KPI 전략가입니다. 인사이트별 근본 원인, 실행 권장안, 단기 예측을 근거 기반으로 제시하고 반드시 유효한 JSON만 반환하세요.'

  const userPrompt = `다음 KPI 인사이트를 분석해 구조화된 결과를 작성하세요.

입력 인사이트:
${JSON.stringify(input.insights)}

반환 형식(반드시 JSON 배열, 마크다운 금지):
[{
  "id": "인사이트 ID",
  "rootCause": "근본 원인 분석(1문장)",
  "recommendations": ["즉시 실행 가능한 액션 1", "즉시 실행 가능한 액션 2"],
  "forecast": {
    "direction": "improving | declining | stable",
    "confidence": 0-100 숫자,
    "reasoning": "예측 근거(1문장)"
  }
}]`

  const config: AIConfig = {
    model: input.model,
    temperature: 0.4,
    maxTokens: 3000,
  }

  return {
    systemPrompt,
    userPrompt,
    config,
  }
}
