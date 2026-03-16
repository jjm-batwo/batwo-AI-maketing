// src/infrastructure/prompt-lab/PromptLabLLMJudge.ts
import type { IAIService, AdCopyVariant } from '@application/ports/IAIService'

export interface LLMJudgeResult {
  score: number
  dimensions: {
    attention: number
    action: number
    relevance: number
    emotion: number
    clarity: number
  }
  tokenUsage: number
}

const JUDGE_SYSTEM_PROMPT = `당신은 Facebook/Instagram 광고 카피 품질 평가 전문가입니다.
주어진 광고 카피를 5개 차원으로 채점합니다. 각 차원은 1-12점입니다.

## 채점 앵커

### 12점 (최상):
- headline: "오늘만! 2,847명이 선택한 피부 비결 50% 할인"
→ 숫자로 주의 끌고, 소셜프루프, 할인까지 결합

### 6점 (보통):
- headline: "좋은 품질의 스킨케어 제품 할인 중"
→ 기본 정보 전달은 되지만 차별화 없음

### 2점 (하):
- headline: "제품 소개합니다"
→ 정보 없음, 행동 유도 없음

## 반드시 JSON으로만 응답:
{"attention":N,"action":N,"relevance":N,"emotion":N,"clarity":N}`

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export class PromptLabLLMJudge {
  constructor(private readonly ai: IAIService) {}

  async evaluate(variant: AdCopyVariant): Promise<LLMJudgeResult> {
    const userPrompt = `## 평가 대상 광고 카피

headline: ${variant.headline}
primaryText: ${variant.primaryText}
description: ${variant.description}
callToAction: ${variant.callToAction}
targetAudience: ${variant.targetAudience}

JSON으로 채점하세요.`

    try {
      const response = await this.ai.chatCompletion(
        JUDGE_SYSTEM_PROMPT,
        userPrompt,
        { temperature: 0, maxTokens: 200 },
      )

      const estimatedTokenUsage = Math.ceil(
        (JUDGE_SYSTEM_PROMPT.length + userPrompt.length) / 4,
      ) + 200

      const cleaned = response.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(cleaned)

      const dimensions = {
        attention: clamp(parsed.attention ?? 1, 1, 12),
        action: clamp(parsed.action ?? 1, 1, 12),
        relevance: clamp(parsed.relevance ?? 1, 1, 12),
        emotion: clamp(parsed.emotion ?? 1, 1, 12),
        clarity: clamp(parsed.clarity ?? 1, 1, 12),
      }

      const score = Object.values(dimensions).reduce((sum, v) => sum + v, 0)
      return { score, dimensions, tokenUsage: estimatedTokenUsage }
    } catch {
      return {
        score: 0,
        dimensions: { attention: 0, action: 0, relevance: 0, emotion: 0, clarity: 0 },
        tokenUsage: 0,
      }
    }
  }
}
