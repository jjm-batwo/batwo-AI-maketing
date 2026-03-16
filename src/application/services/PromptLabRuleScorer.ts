// src/application/services/PromptLabRuleScorer.ts
import type { AdCopyVariant } from '@application/ports/IAIService'

const HOOK_PATTERNS: Record<string, RegExp> = {
  urgency: /오늘만|한정|마감|지금|즉시|남은|시간|급히|서두|놓치/,
  social_proof: /\d+[만명%]|후기|리뷰|인기|베스트|1위|선택한|검증/,
  benefit: /무료|할인|혜택|절약|보장|증정|특별|추가|덤|적립/,
  curiosity: /비결|비밀|방법|이유|알고|몰랐|사실|진짜|실제/,
  fear_of_missing: /놓치면|후회|마지막|품절|소진|한정|매진/,
  authority: /전문가|공인|특허|인증|수상|의사|교수|연구/,
  emotional: /행복|사랑|감동|꿈|희망|자신감|변화|새로운/,
}

export interface RuleScorerInput {
  variants: AdCopyVariant[]
  keywords: string[]
  bestVariantCopy: AdCopyVariant[] | null
}

export class PromptLabRuleScorer {
  score(input: RuleScorerInput): number {
    const first = input.variants[0]
    if (!first) return 0
    return (
      this.scoreMetaSpec(first) +
      this.scoreCTA(first) +
      this.scoreKeywordReflection(first, input.keywords) +
      this.scoreHookPresence(first) +
      this.scoreDiversity(input.variants, input.bestVariantCopy)
    )
  }

  scoreMetaSpec(variant: AdCopyVariant): number {
    let score = 0
    if (variant.headline.length <= 40) score += 5
    if (variant.primaryText.length <= 125) score += 3
    if (variant.description.length <= 30) score += 2
    return score
  }

  scoreCTA(variant: AdCopyVariant): number {
    return variant.callToAction.trim().length > 0 ? 5 : 0
  }

  scoreKeywordReflection(variant: AdCopyVariant, keywords: string[]): number {
    if (keywords.length === 0) return 10
    const text = `${variant.headline} ${variant.primaryText} ${variant.description}`.toLowerCase()
    const matched = keywords.filter((kw) => text.includes(kw.toLowerCase())).length
    return Math.round((matched / keywords.length) * 10)
  }

  scoreHookPresence(variant: AdCopyVariant): number {
    const text = `${variant.headline} ${variant.primaryText} ${variant.description}`
    for (const pattern of Object.values(HOOK_PATTERNS)) {
      if (pattern.test(text)) return 5
    }
    return 0
  }

  scoreDiversity(currentCopy: AdCopyVariant[], bestCopy: AdCopyVariant[] | null): number {
    if (!bestCopy) return 10
    const toTokens = (variants: AdCopyVariant[]): Set<string> => {
      const text = variants.map((v) => `${v.headline} ${v.primaryText} ${v.description}`).join(' ')
      return new Set(text.split(/\s+/).filter(Boolean))
    }
    const a = toTokens(currentCopy)
    const b = toTokens(bestCopy)
    const intersection = new Set([...a].filter((x) => b.has(x)))
    const union = new Set([...a, ...b])
    const jaccard = union.size > 0 ? intersection.size / union.size : 1
    if (jaccard < 0.3) return 10
    if (jaccard <= 0.6) return 5
    return 0
  }
}
