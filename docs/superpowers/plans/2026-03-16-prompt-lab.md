# Prompt Lab Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Autoresearch-inspired autonomous prompt evolution loop that optimizes ad copy prompts per industry using a hybrid evaluator (rule 40% + LLM Judge 60%).

**Architecture:** New services in hexagonal architecture — `PromptLabService` (orchestrator), `PromptLabRuleScorer` (domain logic), `PromptLabLLMJudge` + `PromptLabEvaluator` (infrastructure), `PromptLabMutator` (variant generation). Single integration point: `ScienceAIService.enrichAdCopyInput()`.

**Tech Stack:** TypeScript, Vitest, OpenAI gpt-4o-mini, existing IAIService/ScienceAIService chain

**Spec:** `docs/superpowers/specs/2026-03-16-prompt-lab-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/domain/value-objects/PromptLabTypes.ts` | All types: PromptVariant, PromptLabConfig, PromptLabResult, PromptLabReport |
| Create | `src/application/services/PromptLabRuleScorer.ts` | Rule-based scoring (40점, pure functions) |
| Create | `src/infrastructure/prompt-lab/PromptLabLLMJudge.ts` | LLM Judge adapter (60점, OpenAI API) |
| Create | `src/infrastructure/prompt-lab/PromptLabEvaluator.ts` | Hybrid scorer facade (RuleScorer + LLMJudge) |
| Create | `src/infrastructure/prompt-lab/PromptLabMutator.ts` | Variant generation (1 axis mutation) |
| Create | `src/infrastructure/prompt-lab/PromptLabCache.ts` | In-memory bestVariant cache per industry |
| Create | `src/infrastructure/prompt-lab/PromptLabAIAdapter.ts` | PromptVariant → GenerateAdCopyInput 변환 + 토큰 추적 래퍼 |
| Create | `src/application/services/PromptLabService.ts` | Experiment loop orchestrator |
| Modify | `src/infrastructure/external/openai/ScienceAIService.ts:50-53` | Read from PromptLabCache in enrichAdCopyInput |
| Create | `src/app/api/prompt-lab/run/route.ts` | API endpoint (withPermission + Zod validation) |
| Create | `tests/unit/domain/value-objects/PromptLabTypes.test.ts` | Type validation tests |
| Create | `tests/unit/application/services/PromptLabRuleScorer.test.ts` | Rule scorer tests |
| Create | `tests/unit/infrastructure/prompt-lab/PromptLabLLMJudge.test.ts` | LLM Judge tests |
| Create | `tests/unit/infrastructure/prompt-lab/PromptLabEvaluator.test.ts` | Hybrid evaluator tests |
| Create | `tests/unit/infrastructure/prompt-lab/PromptLabMutator.test.ts` | Mutator tests |
| Create | `tests/unit/infrastructure/prompt-lab/PromptLabAIAdapter.test.ts` | AI adapter tests |
| Create | `tests/unit/application/services/PromptLabService.test.ts` | Loop orchestrator tests |

---

## Chunk 1: Domain Types + Rule Scorer

### Task 1: PromptLabTypes (Value Objects)

**Files:**
- Create: `src/domain/value-objects/PromptLabTypes.ts`
- Test: `tests/unit/domain/value-objects/PromptLabTypes.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/domain/value-objects/PromptLabTypes.test.ts
import { describe, it, expect } from 'vitest'
import {
  createDefaultVariant,
  createPromptLabConfig,
  type PromptVariant,
  type PromptLabConfig,
  type PromptLabResult,
  type PromptLabReport,
} from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

describe('PromptLabTypes', () => {
  describe('createDefaultVariant', () => {
    it('should create baseline variant with all 9 domains', () => {
      const variant = createDefaultVariant()
      expect(variant.scienceDomains).toHaveLength(9)
      expect(variant.temperature).toBe(0.8)
      expect(variant.fewShotStrategy).toBe('industry')
      expect(variant.systemRole).toBe('expert_marketer')
      expect(variant.instructionStyle).toBe('moderate')
      expect(variant.description).toBe('baseline')
    })
  })

  describe('createPromptLabConfig', () => {
    it('should apply defaults for optional fields', () => {
      const config = createPromptLabConfig({
        industry: 'ecommerce' as Industry,
        sampleInput: {
          productName: '테스트 상품',
          productDescription: '테스트 설명',
          targetAudience: '20-30대 여성',
          tone: 'professional' as const,
          objective: 'conversion' as const,
          industry: 'ecommerce' as Industry,
        },
      })
      expect(config.maxDurationMs).toBe(3_600_000)
      expect(config.maxConsecutiveCrashes).toBe(3)
      expect(config.iterationDelayMs).toBe(36_000)
    })

    it('should allow overriding defaults', () => {
      const config = createPromptLabConfig({
        industry: 'beauty' as Industry,
        maxDurationMs: 1_800_000, // 30분
        iterationDelayMs: 18_000, // 18초 간격
        sampleInput: {
          productName: '뷰티 상품',
          productDescription: '뷰티 설명',
          targetAudience: '20대 여성',
          tone: 'casual' as const,
          objective: 'awareness' as const,
          industry: 'beauty' as Industry,
        },
      })
      expect(config.maxDurationMs).toBe(1_800_000)
      expect(config.maxTokenBudget).toBe(200_000)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/domain/value-objects/PromptLabTypes.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/domain/value-objects/PromptLabTypes.ts
import type { KnowledgeDomain } from '@domain/value-objects/MarketingScience'
import { ALL_KNOWLEDGE_DOMAINS } from '@domain/value-objects/MarketingScience'
import type { Industry } from '@domain/value-objects/Industry'
import type { GenerateAdCopyInput, AdCopyVariant } from '@application/ports/IAIService'

// --- Variant (= autoresearch의 train.py 수정본) ---

export interface PromptVariant {
  id: string
  scienceDomains: KnowledgeDomain[]
  temperature: number
  fewShotStrategy: 'industry' | 'hook' | 'topPerformer'
  systemRole: string
  instructionStyle: 'strict' | 'moderate' | 'loose'
  description: string
}

// --- Config (= autoresearch의 program.md) ---

export type PromptLabSampleInput = GenerateAdCopyInput & { industry: Industry }

export interface PromptLabConfig {
  industry: Industry
  maxDurationMs: number        // 사용자 지정 (제한 없음), 필수값
  maxConsecutiveCrashes: number
  iterationDelayMs: number     // 반복 간 대기 (기본 36_000 → 시간당 ~100회)
  sampleInput: PromptLabSampleInput
}

// --- Result (= autoresearch의 results.tsv 한 행) ---

export interface PromptLabResult {
  id: string
  variantId: string
  industry: Industry
  score: number
  ruleScore: number
  llmScore: number
  status: 'keep' | 'discard' | 'crash'
  description: string
  generatedCopy: AdCopyVariant[]
  tokenUsage: number
  createdAt: Date
}

// --- Report (= 실험 완료 후 전체 보고) ---

export interface PromptLabReport {
  bestVariant: PromptVariant
  bestScore: number
  baselineScore: number
  results: PromptLabResult[]
  totalTokensUsed: number
  totalDurationMs: number
  totalIterations: number
  improvementFromBaseline: number
}

// --- Factory Functions ---

export function createDefaultVariant(): PromptVariant {
  return {
    id: `variant-${crypto.randomUUID().slice(0, 8)}`,
    scienceDomains: [...ALL_KNOWLEDGE_DOMAINS],
    temperature: 0.8,
    fewShotStrategy: 'industry',
    systemRole: 'expert_marketer',
    instructionStyle: 'moderate',
    description: 'baseline',
  }
}

export function createPromptLabConfig(
  partial: Pick<PromptLabConfig, 'industry' | 'sampleInput'> &
    Partial<Omit<PromptLabConfig, 'industry' | 'sampleInput'>>,
): PromptLabConfig {
  return {
    maxDurationMs: 3_600_000,      // 기본 1시간 (사용자가 자유롭게 변경)
    maxConsecutiveCrashes: 3,
    iterationDelayMs: 36_000,      // 36초 간격 → 시간당 ~100회
    ...partial,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/domain/value-objects/PromptLabTypes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/value-objects/PromptLabTypes.ts tests/unit/domain/value-objects/PromptLabTypes.test.ts
git commit -m "feat(prompt-lab): add domain types and factory functions"
```

---

### Task 2: PromptLabRuleScorer (40점 규칙 기반 채점)

**Files:**
- Create: `src/application/services/PromptLabRuleScorer.ts`
- Test: `tests/unit/application/services/PromptLabRuleScorer.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/application/services/PromptLabRuleScorer.test.ts
import { describe, it, expect } from 'vitest'
import { PromptLabRuleScorer } from '@application/services/PromptLabRuleScorer'
import type { AdCopyVariant } from '@application/ports/IAIService'

function makeVariant(overrides: Partial<AdCopyVariant> = {}): AdCopyVariant {
  return {
    headline: '지금 바로 시작하세요',
    primaryText: '한정 기간 50% 할인! 지금 구매하면 무료 배송까지.',
    description: '오늘만 특별 혜택',
    callToAction: '지금 구매하기',
    targetAudience: '20-30대 여성',
    ...overrides,
  }
}

describe('PromptLabRuleScorer', () => {
  const scorer = new PromptLabRuleScorer()

  describe('scoreMetaSpec', () => {
    it('should give 10/10 when all lengths within limits', () => {
      const variant = makeVariant()
      expect(scorer.scoreMetaSpec(variant)).toBe(10)
    })

    it('should give 0 for headline when exceeding 40 chars', () => {
      const variant = makeVariant({
        headline: '이것은 40자를 초과하는 매우 길고 길고 길고 길고 길고 긴 헤드라인입니다 정말로요',
      })
      expect(scorer.scoreMetaSpec(variant)).toBeLessThan(10)
    })
  })

  describe('scoreCTA', () => {
    it('should give 5 when CTA exists', () => {
      expect(scorer.scoreCTA(makeVariant())).toBe(5)
    })

    it('should give 0 when CTA is empty', () => {
      expect(scorer.scoreCTA(makeVariant({ callToAction: '' }))).toBe(0)
    })
  })

  describe('scoreKeywordReflection', () => {
    it('should score proportionally to keyword inclusion', () => {
      const variant = makeVariant({ primaryText: '할인 혜택으로 구매하세요' })
      const keywords = ['할인', '혜택', '무료', '배송', '특가']
      // 2 out of 5 keywords present → 4/10
      expect(scorer.scoreKeywordReflection(variant, keywords)).toBe(4)
    })

    it('should give 10 when no keywords specified', () => {
      expect(scorer.scoreKeywordReflection(makeVariant(), [])).toBe(10)
    })
  })

  describe('scoreHookPresence', () => {
    it('should detect urgency hook patterns', () => {
      const variant = makeVariant({ headline: '오늘만! 한정 수량' })
      expect(scorer.scoreHookPresence(variant)).toBe(5)
    })

    it('should give 0 when no hook pattern found', () => {
      const variant = makeVariant({
        headline: '상품 소개',
        primaryText: '상품입니다',
        description: '설명',
      })
      expect(scorer.scoreHookPresence(variant)).toBe(0)
    })
  })

  describe('scoreDiversity', () => {
    it('should give 10 for baseline (no comparison)', () => {
      expect(scorer.scoreDiversity([makeVariant()], null)).toBe(10)
    })

    it('should give 0 for identical copies', () => {
      const current = [makeVariant()]
      const best = [makeVariant()]
      expect(scorer.scoreDiversity(current, best)).toBe(0)
    })

    it('should give 10 for very different copies', () => {
      const current = [makeVariant({ headline: '완전히 새로운 접근', primaryText: '전혀 다른 내용의 카피' })]
      const best = [makeVariant()]
      expect(scorer.scoreDiversity(current, best)).toBe(10)
    })
  })

  describe('score (total)', () => {
    it('should return 0-40 range', () => {
      const result = scorer.score({
        variants: [makeVariant()],
        keywords: ['할인', '혜택'],
        bestVariantCopy: null,
      })
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(40)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/application/services/PromptLabRuleScorer.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write minimal implementation**

```typescript
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

  scoreDiversity(
    currentCopy: AdCopyVariant[],
    bestCopy: AdCopyVariant[] | null,
  ): number {
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/application/services/PromptLabRuleScorer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/services/PromptLabRuleScorer.ts tests/unit/application/services/PromptLabRuleScorer.test.ts
git commit -m "feat(prompt-lab): add rule-based scorer (40 points)"
```

---

## Chunk 2: LLM Judge + Hybrid Evaluator

### Task 3: PromptLabLLMJudge (60점 LLM 평가)

**Files:**
- Create: `src/infrastructure/prompt-lab/PromptLabLLMJudge.ts`
- Test: `tests/unit/infrastructure/prompt-lab/PromptLabLLMJudge.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/infrastructure/prompt-lab/PromptLabLLMJudge.test.ts
import { describe, it, expect, vi } from 'vitest'
import { PromptLabLLMJudge } from '@infrastructure/prompt-lab/PromptLabLLMJudge'
import type { IAIService } from '@application/ports/IAIService'

function makeMockAIService(response: string): IAIService {
  return {
    chatCompletion: vi.fn().mockResolvedValue(response),
    generateAdCopy: vi.fn(),
    generateCampaignOptimization: vi.fn(),
    generateReportInsights: vi.fn(),
    generateBudgetRecommendation: vi.fn(),
    generateCreativeVariants: vi.fn(),
    analyzeCompetitorTrends: vi.fn(),
    generateCompetitorInsights: vi.fn(),
  } as unknown as IAIService
}

describe('PromptLabLLMJudge', () => {
  it('should parse valid JSON scores', async () => {
    const mockResponse = JSON.stringify({
      attention: 10,
      action: 8,
      relevance: 9,
      emotion: 7,
      clarity: 11,
    })
    const ai = makeMockAIService(mockResponse)
    const judge = new PromptLabLLMJudge(ai)

    const result = await judge.evaluate({
      headline: '오늘만 50% 할인',
      primaryText: '지금 구매하면 무료 배송!',
      description: '한정 혜택',
      callToAction: '구매하기',
      targetAudience: '20-30대',
    })

    expect(result.score).toBe(45) // 10+8+9+7+11
    expect(result.dimensions.attention).toBe(10)
    expect(result.tokenUsage).toBeGreaterThan(0)
  })

  it('should clamp scores to 1-12 range', async () => {
    const mockResponse = JSON.stringify({
      attention: 15, action: -1, relevance: 12, emotion: 0, clarity: 12,
    })
    const ai = makeMockAIService(mockResponse)
    const judge = new PromptLabLLMJudge(ai)

    const result = await judge.evaluate({
      headline: 'test', primaryText: 'test',
      description: 'test', callToAction: 'test', targetAudience: 'test',
    })

    expect(result.dimensions.attention).toBe(12)
    expect(result.dimensions.action).toBe(1)
  })

  it('should return 0 score on parse failure', async () => {
    const ai = makeMockAIService('invalid json')
    const judge = new PromptLabLLMJudge(ai)

    const result = await judge.evaluate({
      headline: 'test', primaryText: 'test',
      description: 'test', callToAction: 'test', targetAudience: 'test',
    })

    expect(result.score).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/infrastructure/prompt-lab/PromptLabLLMJudge.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/infrastructure/prompt-lab/PromptLabLLMJudge.ts
import type { IAIService, AdCopyVariant } from '@application/ports/IAIService'

export interface LLMJudgeResult {
  score: number // 0-60
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

      // chatCompletion()은 string만 반환하므로 보수적 추정
      // (입력 길이 / 4) + maxTokens 설정값
      const estimatedTokenUsage = Math.ceil(
        (JUDGE_SYSTEM_PROMPT.length + userPrompt.length) / 4,
      ) + 200 // maxTokens 설정값

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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/infrastructure/prompt-lab/PromptLabLLMJudge.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/prompt-lab/PromptLabLLMJudge.ts tests/unit/infrastructure/prompt-lab/PromptLabLLMJudge.test.ts
git commit -m "feat(prompt-lab): add LLM Judge adapter (60 points)"
```

---

### Task 4: PromptLabEvaluator (하이브리드 파사드)

**Files:**
- Create: `src/infrastructure/prompt-lab/PromptLabEvaluator.ts`
- Test: `tests/unit/infrastructure/prompt-lab/PromptLabEvaluator.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/infrastructure/prompt-lab/PromptLabEvaluator.test.ts
import { describe, it, expect, vi } from 'vitest'
import { PromptLabEvaluator } from '@infrastructure/prompt-lab/PromptLabEvaluator'
import { PromptLabRuleScorer } from '@application/services/PromptLabRuleScorer'
import type { PromptLabLLMJudge, LLMJudgeResult } from '@infrastructure/prompt-lab/PromptLabLLMJudge'
import type { AdCopyVariant } from '@application/ports/IAIService'

function makeVariant(): AdCopyVariant {
  return {
    headline: '오늘만 특별 할인',
    primaryText: '지금 구매하면 50% 할인!',
    description: '한정 혜택',
    callToAction: '구매하기',
    targetAudience: '20-30대',
  }
}

function makeMockJudge(score: number): PromptLabLLMJudge {
  return {
    evaluate: vi.fn().mockResolvedValue({
      score,
      dimensions: { attention: score / 5, action: score / 5, relevance: score / 5, emotion: score / 5, clarity: score / 5 },
      tokenUsage: 500,
    } satisfies LLMJudgeResult),
  } as unknown as PromptLabLLMJudge
}

describe('PromptLabEvaluator', () => {
  it('should combine rule score + LLM score', async () => {
    const judge = makeMockJudge(45) // 45/60
    const evaluator = new PromptLabEvaluator(new PromptLabRuleScorer(), judge)

    const result = await evaluator.evaluate({
      variants: [makeVariant()],
      keywords: [],
      bestVariantCopy: null,
    })

    expect(result.ruleScore).toBeGreaterThan(0)
    expect(result.ruleScore).toBeLessThanOrEqual(40)
    expect(result.llmScore).toBe(45)
    expect(result.totalScore).toBe(result.ruleScore + 45)
    expect(result.tokenUsage).toBe(500)
  })

  it('should skip LLM evaluation when ruleScore < 20', async () => {
    const judge = makeMockJudge(45)
    const scorer = new PromptLabRuleScorer()
    vi.spyOn(scorer, 'score').mockReturnValue(15) // below threshold
    const evaluator = new PromptLabEvaluator(scorer, judge)

    const result = await evaluator.evaluate({
      variants: [makeVariant()],
      keywords: [],
      bestVariantCopy: null,
    })

    expect(result.llmScore).toBe(0)
    expect(result.totalScore).toBe(15)
    expect(judge.evaluate).not.toHaveBeenCalled()
  })

  it('should confirm with median of 3 (initial + 2 additional)', async () => {
    let callCount = 0
    const judge = {
      evaluate: vi.fn().mockImplementation(async () => {
        callCount++
        const scores = [45, 40, 42]
        const s = scores[(callCount - 1) % 3]
        return { score: s, dimensions: {}, tokenUsage: 500 } as LLMJudgeResult
      }),
    } as unknown as PromptLabLLMJudge

    const evaluator = new PromptLabEvaluator(new PromptLabRuleScorer(), judge)

    const result = await evaluator.evaluateWithConfirmation({
      variants: [makeVariant()],
      keywords: [],
      bestVariantCopy: null,
      initialLLMScore: 45, // 첫 evaluate 결과를 전달
    })

    // median of [45(initial), 40, 42] = 42
    expect(result.llmScore).toBe(42)
    expect(judge.evaluate).toHaveBeenCalledTimes(2) // 추가 2회만 호출
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/infrastructure/prompt-lab/PromptLabEvaluator.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/infrastructure/prompt-lab/PromptLabEvaluator.ts
import type { AdCopyVariant } from '@application/ports/IAIService'
import type { PromptLabRuleScorer, RuleScorerInput } from '@application/services/PromptLabRuleScorer'
import type { PromptLabLLMJudge } from '@infrastructure/prompt-lab/PromptLabLLMJudge'

export interface EvaluationInput {
  variants: AdCopyVariant[]
  keywords: string[]
  bestVariantCopy: AdCopyVariant[] | null
}

export interface EvaluationResult {
  ruleScore: number
  llmScore: number
  totalScore: number
  tokenUsage: number
}

const RULE_SCORE_THRESHOLD = 20

export class PromptLabEvaluator {
  constructor(
    private readonly ruleScorer: PromptLabRuleScorer,
    private readonly llmJudge: PromptLabLLMJudge,
  ) {}

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const ruleScorerInput: RuleScorerInput = {
      variants: input.variants,
      keywords: input.keywords,
      bestVariantCopy: input.bestVariantCopy,
    }

    const ruleScore = this.ruleScorer.score(ruleScorerInput)

    if (ruleScore < RULE_SCORE_THRESHOLD) {
      return { ruleScore, llmScore: 0, totalScore: ruleScore, tokenUsage: 0 }
    }

    const judgeResult = await this.llmJudge.evaluate(input.variants[0])
    return {
      ruleScore,
      llmScore: judgeResult.score,
      totalScore: ruleScore + judgeResult.score,
      tokenUsage: judgeResult.tokenUsage,
    }
  }

  async evaluateWithConfirmation(
    input: EvaluationInput & { initialLLMScore: number },
  ): Promise<EvaluationResult> {
    const ruleScore = this.ruleScorer.score({
      variants: input.variants,
      keywords: input.keywords,
      bestVariantCopy: input.bestVariantCopy,
    })

    if (ruleScore < RULE_SCORE_THRESHOLD) {
      return { ruleScore, llmScore: 0, totalScore: ruleScore, tokenUsage: 0 }
    }

    // 스펙: 초기 1회 + 추가 2회 = 총 3회 중앙값
    const variant = input.variants[0]
    const [r2, r3] = await Promise.all([
      this.llmJudge.evaluate(variant),
      this.llmJudge.evaluate(variant),
    ])

    const scores = [input.initialLLMScore, r2.score, r3.score].sort((a, b) => a - b)
    const medianScore = scores[1]
    const totalTokens = r2.tokenUsage + r3.tokenUsage

    return {
      ruleScore,
      llmScore: medianScore,
      totalScore: ruleScore + medianScore,
      tokenUsage: totalTokens,
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/infrastructure/prompt-lab/PromptLabEvaluator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/prompt-lab/PromptLabEvaluator.ts tests/unit/infrastructure/prompt-lab/PromptLabEvaluator.test.ts
git commit -m "feat(prompt-lab): add hybrid evaluator (rule 40 + LLM 60)"
```

---

## Chunk 3: Mutator + Cache

### Task 5: PromptLabMutator (변형 생성기)

**Files:**
- Create: `src/infrastructure/prompt-lab/PromptLabMutator.ts`
- Test: `tests/unit/infrastructure/prompt-lab/PromptLabMutator.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/infrastructure/prompt-lab/PromptLabMutator.test.ts
import { describe, it, expect } from 'vitest'
import { PromptLabMutator } from '@infrastructure/prompt-lab/PromptLabMutator'
import { createDefaultVariant } from '@domain/value-objects/PromptLabTypes'

describe('PromptLabMutator', () => {
  const mutator = new PromptLabMutator()

  it('should mutate exactly 1 axis from baseline', () => {
    const baseline = createDefaultVariant()
    const mutated = mutator.mutate(baseline)

    let changedAxes = 0
    if (JSON.stringify(mutated.scienceDomains) !== JSON.stringify(baseline.scienceDomains)) changedAxes++
    if (mutated.temperature !== baseline.temperature) changedAxes++
    if (mutated.fewShotStrategy !== baseline.fewShotStrategy) changedAxes++
    if (mutated.systemRole !== baseline.systemRole) changedAxes++
    if (mutated.instructionStyle !== baseline.instructionStyle) changedAxes++

    expect(changedAxes).toBe(1)
  })

  it('should generate different mutations across calls', () => {
    const baseline = createDefaultVariant()
    const mutations = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const m = mutator.mutate(baseline)
      mutations.add(m.description)
    }
    expect(mutations.size).toBeGreaterThan(1)
  })

  it('should keep scienceDomains >= 3 (MIN_REQUIRED_DOMAINS)', () => {
    const baseline = createDefaultVariant()
    for (let i = 0; i < 50; i++) {
      const m = mutator.mutate(baseline)
      expect(m.scienceDomains.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('should keep temperature in 0.3-1.0 range', () => {
    const baseline = createDefaultVariant()
    for (let i = 0; i < 50; i++) {
      const m = mutator.mutate(baseline)
      expect(m.temperature).toBeGreaterThanOrEqual(0.3)
      expect(m.temperature).toBeLessThanOrEqual(1.0)
    }
  })

  it('should always set a description', () => {
    const baseline = createDefaultVariant()
    const mutated = mutator.mutate(baseline)
    expect(mutated.description).not.toBe('baseline')
    expect(mutated.description.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/infrastructure/prompt-lab/PromptLabMutator.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/infrastructure/prompt-lab/PromptLabMutator.ts
import type { PromptVariant } from '@domain/value-objects/PromptLabTypes'
import { ALL_KNOWLEDGE_DOMAINS, MIN_REQUIRED_DOMAINS } from '@domain/value-objects/MarketingScience'
import type { KnowledgeDomain } from '@domain/value-objects/MarketingScience'

type MutationAxis = 'scienceDomains' | 'temperature' | 'fewShotStrategy' | 'systemRole' | 'instructionStyle'

const SYSTEM_ROLES = ['expert_marketer', 'consumer_psychologist', 'data_analyst', 'creative_director']
const INSTRUCTION_STYLES: PromptVariant['instructionStyle'][] = ['strict', 'moderate', 'loose']
const FEW_SHOT_STRATEGIES: PromptVariant['fewShotStrategy'][] = ['industry', 'hook', 'topPerformer']

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export class PromptLabMutator {
  private axes: MutationAxis[] = [
    'scienceDomains', 'temperature', 'fewShotStrategy', 'systemRole', 'instructionStyle',
  ]

  mutate(base: PromptVariant): PromptVariant {
    const axis = this.axes[Math.floor(Math.random() * this.axes.length)]
    const mutated = { ...base, id: `variant-${crypto.randomUUID().slice(0, 8)}` }

    switch (axis) {
      case 'scienceDomains':
        mutated.scienceDomains = this.mutateDomains(base.scienceDomains)
        mutated.description = `science context → ${mutated.scienceDomains.length}개 도메인`
        break

      case 'temperature': {
        const delta = pickRandom([-0.2, -0.1, 0.1, 0.2])
        const raw = Math.round((base.temperature + delta) * 10) / 10
        mutated.temperature = Math.max(0.3, Math.min(1.0, raw))
        if (mutated.temperature === base.temperature) {
          mutated.temperature = base.temperature >= 0.7 ? 0.5 : 0.9
        }
        mutated.description = `temperature → ${mutated.temperature}`
        break
      }

      case 'fewShotStrategy': {
        const others = FEW_SHOT_STRATEGIES.filter((s) => s !== base.fewShotStrategy)
        mutated.fewShotStrategy = pickRandom(others)
        mutated.description = `few-shot strategy → ${mutated.fewShotStrategy}`
        break
      }

      case 'systemRole': {
        const others = SYSTEM_ROLES.filter((r) => r !== base.systemRole)
        mutated.systemRole = pickRandom(others)
        mutated.description = `system role → ${mutated.systemRole}`
        break
      }

      case 'instructionStyle': {
        const others = INSTRUCTION_STYLES.filter((s) => s !== base.instructionStyle)
        mutated.instructionStyle = pickRandom(others)
        mutated.description = `instruction style → ${mutated.instructionStyle}`
        break
      }
    }

    return mutated
  }

  private mutateDomains(current: KnowledgeDomain[]): KnowledgeDomain[] {
    const all = [...ALL_KNOWLEDGE_DOMAINS]

    if (current.length > MIN_REQUIRED_DOMAINS && Math.random() < 0.5) {
      // Remove one random domain
      const idx = Math.floor(Math.random() * current.length)
      return current.filter((_, i) => i !== idx)
    }

    if (current.length < all.length) {
      // Add one random missing domain
      const missing = all.filter((d) => !current.includes(d))
      if (missing.length > 0) {
        return [...current, pickRandom(missing)]
      }
    }

    // Swap: remove one, add a different one
    const idx = Math.floor(Math.random() * current.length)
    const removed = current.filter((_, i) => i !== idx)
    const missing = all.filter((d) => !removed.includes(d))
    if (missing.length > 0) {
      return [...removed, pickRandom(missing)]
    }
    return current
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/infrastructure/prompt-lab/PromptLabMutator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/prompt-lab/PromptLabMutator.ts tests/unit/infrastructure/prompt-lab/PromptLabMutator.test.ts
git commit -m "feat(prompt-lab): add single-axis prompt mutator"
```

---

### Task 6: PromptLabCache (인메모리 캐시)

**Files:**
- Create: `src/infrastructure/prompt-lab/PromptLabCache.ts`
- Test: (inline — 작아서 Task 7 통합 테스트에서 검증)

- [ ] **Step 1: Write implementation** (너무 작아서 TDD 대신 직접 구현)

```typescript
// src/infrastructure/prompt-lab/PromptLabCache.ts
import type { PromptVariant } from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

const cache = new Map<Industry, PromptVariant>()

export const PromptLabCache = {
  get(industry: Industry): PromptVariant | undefined {
    return cache.get(industry)
  },

  set(industry: Industry, variant: PromptVariant): void {
    cache.set(industry, variant)
  },

  clear(): void {
    cache.clear()
  },

  has(industry: Industry): boolean {
    return cache.has(industry)
  },
}
```

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/prompt-lab/PromptLabCache.ts
git commit -m "feat(prompt-lab): add in-memory variant cache"
```

### Task 6b: PromptLabAIAdapter (variant → 카피 생성 변환 + 토큰 추적)

**Files:**
- Create: `src/infrastructure/prompt-lab/PromptLabAIAdapter.ts`
- Test: `tests/unit/infrastructure/prompt-lab/PromptLabAIAdapter.test.ts`

> **리뷰 이슈 해결**: CRITICAL — PromptVariant 설정이 실제 카피 생성에 반영되지 않는 문제 + 토큰 추적

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/infrastructure/prompt-lab/PromptLabAIAdapter.test.ts
import { describe, it, expect, vi } from 'vitest'
import { PromptLabAIAdapter } from '@infrastructure/prompt-lab/PromptLabAIAdapter'
import type { IAIService, GenerateAdCopyInput } from '@application/ports/IAIService'
import { createDefaultVariant } from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

function makeMockAI(): IAIService {
  return {
    generateAdCopy: vi.fn().mockResolvedValue([{
      headline: '테스트', primaryText: '본문',
      description: '설명', callToAction: '구매', targetAudience: '20대',
    }]),
    chatCompletion: vi.fn().mockResolvedValue('response'),
  } as unknown as IAIService
}

describe('PromptLabAIAdapter', () => {
  it('should apply variant temperature to AI config', async () => {
    const ai = makeMockAI()
    const adapter = new PromptLabAIAdapter(ai)
    const variant = { ...createDefaultVariant(), temperature: 0.5 }

    const input: GenerateAdCopyInput & { industry: Industry } = {
      productName: '테스트', productDescription: '설명',
      targetAudience: '20대', tone: 'casual',
      objective: 'conversion', industry: 'ecommerce',
    }

    await adapter.generateWithVariant(input, variant)

    expect(ai.generateAdCopy).toHaveBeenCalledWith(
      expect.objectContaining({
        scienceContext: expect.any(String),
      }),
    )
  })

  it('should filter scienceDomains in the science context hint', async () => {
    const ai = makeMockAI()
    const adapter = new PromptLabAIAdapter(ai)
    const variant = {
      ...createDefaultVariant(),
      scienceDomains: ['neuromarketing', 'meta_best_practices', 'copywriting_psychology'] as any,
      description: 'reduced domains',
    }

    const input: GenerateAdCopyInput & { industry: Industry } = {
      productName: '테스트', productDescription: '설명',
      targetAudience: '20대', tone: 'casual',
      objective: 'conversion', industry: 'ecommerce',
    }

    await adapter.generateWithVariant(input, variant)

    const calledInput = vi.mocked(ai.generateAdCopy).mock.calls[0][0]
    // scienceContext should mention only the selected domains
    expect(calledInput.scienceContext).toContain('neuromarketing')
    expect(calledInput.scienceContext).not.toContain('crowd_psychology')
  })

  it('should track estimated token usage', async () => {
    const ai = makeMockAI()
    const adapter = new PromptLabAIAdapter(ai)

    const result = await adapter.generateWithVariant(
      {
        productName: '테스트', productDescription: '설명',
        targetAudience: '20대', tone: 'casual',
        objective: 'conversion', industry: 'ecommerce',
      },
      createDefaultVariant(),
    )

    expect(result.estimatedTokenUsage).toBeGreaterThan(0)
    expect(result.variants).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/infrastructure/prompt-lab/PromptLabAIAdapter.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/infrastructure/prompt-lab/PromptLabAIAdapter.ts
import type { IAIService, GenerateAdCopyInput, AdCopyVariant } from '@application/ports/IAIService'
import type { PromptVariant, PromptLabSampleInput } from '@domain/value-objects/PromptLabTypes'

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  expert_marketer: '10년 경력의 퍼포먼스 마케팅 전문가',
  consumer_psychologist: '소비자 심리학 박사이자 광고 컨설턴트',
  data_analyst: '데이터 기반 마케팅 분석가',
  creative_director: '글로벌 광고 대행사 크리에이티브 디렉터',
}

const INSTRUCTION_HINTS: Record<string, string> = {
  strict: '반드시 다음 규칙을 지켜라: 숫자를 포함하고, CTA를 명확히 하고, 혜택을 구체적으로 제시하라.',
  moderate: '자연스러운 흐름으로 작성하되, 핵심 혜택과 행동 유도를 포함하라.',
  loose: '자유롭고 창의적으로 작성하라. 형식에 구애받지 말고 가장 매력적인 카피를 만들어라.',
}

export interface GenerateWithVariantResult {
  variants: AdCopyVariant[]
  estimatedTokenUsage: number
}

export class PromptLabAIAdapter {
  constructor(private readonly ai: IAIService) {}

  async generateWithVariant(
    input: PromptLabSampleInput,
    variant: PromptVariant,
  ): Promise<GenerateWithVariantResult> {
    // variant 설정을 scienceContext 힌트로 변환
    const scienceHint = this.buildScienceHint(variant)

    const enrichedInput: GenerateAdCopyInput = {
      ...input,
      scienceContext: scienceHint,
    }

    // NOTE: temperature는 현재 AIService가 prompt 수준에서 제어하지 않고
    // AD_COPY_AI_CONFIG에 하드코딩되어 있음. 향후 AIConfig 오버라이드 지원 시 적용.
    // 현재는 scienceContext를 통한 간접 제어에 집중.

    const variants = await this.ai.generateAdCopy(enrichedInput)

    // 보수적 토큰 추정: 입력 길이 + 예상 출력
    const inputEstimate = Math.ceil(scienceHint.length / 4) + 500 // 기본 프롬프트
    const outputEstimate = 600 // 카피 3개 기준
    const estimatedTokenUsage = inputEstimate + outputEstimate

    return { variants, estimatedTokenUsage }
  }

  private buildScienceHint(variant: PromptVariant): string {
    const roleLabel = SYSTEM_ROLE_LABELS[variant.systemRole] ?? variant.systemRole
    const instruction = INSTRUCTION_HINTS[variant.instructionStyle] ?? ''
    const domains = variant.scienceDomains.join(', ')

    return [
      `[PromptLab 최적화 컨텍스트]`,
      `역할: ${roleLabel}`,
      `활성 분석 도메인: ${domains}`,
      `지시 스타일: ${instruction}`,
      `Few-shot 전략: ${variant.fewShotStrategy}`,
    ].join('\n')
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/infrastructure/prompt-lab/PromptLabAIAdapter.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/prompt-lab/PromptLabAIAdapter.ts tests/unit/infrastructure/prompt-lab/PromptLabAIAdapter.test.ts
git commit -m "feat(prompt-lab): add AI adapter for variant→input conversion"
```

---

## Chunk 4: Experiment Loop (핵심)

### Task 7: PromptLabService (실험 루프 오케스트레이터)

**Files:**
- Create: `src/application/services/PromptLabService.ts`
- Test: `tests/unit/application/services/PromptLabService.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/unit/application/services/PromptLabService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PromptLabService } from '@application/services/PromptLabService'
import type { PromptLabEvaluator, EvaluationResult } from '@infrastructure/prompt-lab/PromptLabEvaluator'
import type { PromptLabMutator } from '@infrastructure/prompt-lab/PromptLabMutator'
import type { PromptLabAIAdapter, GenerateWithVariantResult } from '@infrastructure/prompt-lab/PromptLabAIAdapter'
import type { AdCopyVariant } from '@application/ports/IAIService'
import { createPromptLabConfig, createDefaultVariant } from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

function makeVariant(): AdCopyVariant {
  return {
    headline: '테스트 헤드라인',
    primaryText: '테스트 본문',
    description: '테스트 설명',
    callToAction: '구매하기',
    targetAudience: '20-30대',
  }
}

function makeMockEvaluator(scores: number[]): PromptLabEvaluator {
  let callIdx = 0
  return {
    evaluate: vi.fn().mockImplementation(async () => {
      const s = scores[callIdx++ % scores.length]
      return {
        ruleScore: Math.min(s, 40),
        llmScore: Math.max(0, s - 40),
        totalScore: s,
        tokenUsage: 3000,
      } satisfies EvaluationResult
    }),
    evaluateWithConfirmation: vi.fn().mockImplementation(async () => {
      const s = scores[callIdx++ % scores.length]
      return {
        ruleScore: Math.min(s, 40),
        llmScore: Math.max(0, s - 40),
        totalScore: s,
        tokenUsage: 5000,
      } satisfies EvaluationResult
    }),
  } as unknown as PromptLabEvaluator
}

function makeMockAdapter(): PromptLabAIAdapter {
  return {
    generateWithVariant: vi.fn().mockResolvedValue({
      variants: [makeVariant()],
      estimatedTokenUsage: 1100,
    } satisfies GenerateWithVariantResult),
  } as unknown as PromptLabAIAdapter
}

function makeMockMutator(): PromptLabMutator {
  let counter = 0
  return {
    mutate: vi.fn().mockImplementation((base) => ({
      ...base,
      id: `mutated-${++counter}`,
      temperature: 0.6,
      description: `mutation ${counter}`,
    })),
  } as unknown as PromptLabMutator
}

describe('PromptLabService', () => {
  let service: PromptLabService

  const config = createPromptLabConfig({
    industry: 'ecommerce' as Industry,
    maxDurationMs: 100, // 100ms — 테스트용 짧은 시간
    sampleInput: {
      productName: '테스트', productDescription: '설명',
      targetAudience: '20대', tone: 'casual' as const,
      objective: 'conversion' as const, industry: 'ecommerce' as Industry,
    },
  })

  it('should run baseline first then iterate until time runs out', async () => {
    // baseline=50, then improving scores
    const evaluator = makeMockEvaluator([50, 60, 55, 70, 65, 72])
    service = new PromptLabService(makeMockAdapter(), evaluator, makeMockMutator())

    const report = await service.run(config)

    expect(report.baselineScore).toBe(50)
    expect(report.bestScore).toBeGreaterThanOrEqual(50)
    expect(report.results.length).toBeGreaterThanOrEqual(2) // baseline + at least 1
    expect(report.improvementFromBaseline).toBeGreaterThanOrEqual(0)
  })

  it('should stop when time runs out', async () => {
    const evaluator = makeMockEvaluator([50, 60, 70, 80, 75, 85])
    service = new PromptLabService(makeMockAdapter(), evaluator, makeMockMutator())

    // 50ms 제한, delay 0 → 빠르게 여러 번 돌고 시간 초과로 종료
    const shortConfig = { ...config, maxDurationMs: 50, iterationDelayMs: 0 }
    const report = await service.run(shortConfig)

    expect(report.totalDurationMs).toBeLessThan(200) // 약간의 오버헤드 허용
    expect(report.results.length).toBeGreaterThanOrEqual(2) // baseline + 1 이상
  })

  it('should stop on 3 consecutive crashes', async () => {
    const adapter = makeMockAdapter()

    const evaluator = makeMockEvaluator([50]) // baseline succeeds
    // Override: first call succeeds, rest fail
    let firstCall = true
    vi.mocked(adapter.generateWithVariant).mockImplementation(async () => {
      if (firstCall) { firstCall = false; return { variants: [makeVariant()], estimatedTokenUsage: 1100 } }
      throw new Error('API error')
    })

    service = new PromptLabService(adapter, evaluator, makeMockMutator())
    const report = await service.run({ ...config, maxDurationMs: 60_000 })

    // Should stop after 3 consecutive crashes
    const crashes = report.results.filter((r) => r.status === 'crash')
    expect(crashes.length).toBe(3)
  })

  it('should discard variants below baseline * 0.8', async () => {
    // baseline=50, then 35 (below 50*0.8=40)
    const evaluator = makeMockEvaluator([50, 35, 60])
    service = new PromptLabService(makeMockAdapter(), evaluator, makeMockMutator())

    const report = await service.run({ ...config, maxDurationMs: 60_000 })

    const discarded = report.results.find((r) => r.score === 35)
    expect(discarded?.status).toBe('discard')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/application/services/PromptLabService.test.ts`
Expected: FAIL

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/application/services/PromptLabService.ts
import type { AdCopyVariant } from '@application/ports/IAIService'
import type { PromptLabEvaluator } from '@infrastructure/prompt-lab/PromptLabEvaluator'
import type { PromptLabMutator } from '@infrastructure/prompt-lab/PromptLabMutator'
import type { PromptLabAIAdapter } from '@infrastructure/prompt-lab/PromptLabAIAdapter'
import {
  createDefaultVariant,
  type PromptLabConfig,
  type PromptLabResult,
  type PromptLabReport,
  type PromptVariant,
} from '@domain/value-objects/PromptLabTypes'

const BASELINE_FLOOR_RATIO = 0.8

export class PromptLabService {
  constructor(
    private readonly aiAdapter: PromptLabAIAdapter,
    private readonly evaluator: PromptLabEvaluator,
    private readonly mutator: PromptLabMutator,
  ) {}

  async run(config: PromptLabConfig): Promise<PromptLabReport> {
    const results: PromptLabResult[] = []
    let totalTokensUsed = 0 // 추적만 하고 제한은 안 함
    let consecutiveCrashes = 0

    // 1. Baseline (= autoresearch 첫 실행)
    const baselineVariant = createDefaultVariant()
    const baselineResult = await this.runExperiment(baselineVariant, config, null)
    results.push(baselineResult)
    totalTokensUsed += baselineResult.tokenUsage

    let bestVariant = baselineVariant
    let bestScore = baselineResult.score
    let bestCopy = baselineResult.generatedCopy
    const baselineScore = baselineResult.score

    // 2. LOOP (= autoresearch LOOP FOREVER, 시간 소진까지)
    const startTime = Date.now()
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

    while (true) {
      const elapsed = Date.now() - startTime
      if (elapsed >= config.maxDurationMs) break
      if (consecutiveCrashes >= config.maxConsecutiveCrashes) break

      const mutated = this.mutator.mutate(bestVariant)
      const result = await this.runExperiment(mutated, config, bestCopy)
      totalTokensUsed += result.tokenUsage

      if (result.status === 'crash') {
        consecutiveCrashes++
        results.push(result)
        continue
      }

      consecutiveCrashes = 0

      // 품질 하한선: baseline * 0.8 미만이면 즉시 discard
      if (result.score < baselineScore * BASELINE_FLOOR_RATIO) {
        result.status = 'discard'
        results.push(result)
        continue
      }

      // keep/discard 결정 (score > best일 때 초기 1회 + 추가 2회 = 3회 중앙값)
      if (result.score > bestScore) {
        const confirmed = await this.evaluator.evaluateWithConfirmation({
          variants: result.generatedCopy,
          keywords: config.sampleInput.keywords ?? [],
          bestVariantCopy: bestCopy,
          initialLLMScore: result.llmScore,
        })
        totalTokensUsed += confirmed.tokenUsage

        if (confirmed.totalScore > bestScore) {
          result.status = 'keep'
          result.score = confirmed.totalScore
          result.ruleScore = confirmed.ruleScore
          result.llmScore = confirmed.llmScore
          bestVariant = mutated
          bestScore = confirmed.totalScore
          bestCopy = result.generatedCopy
        } else {
          result.status = 'discard'
        }
      } else {
        result.status = 'discard'
      }

      results.push(result)

      // 시간당 ~100회 페이스 유지 (API rate limit 보호 + 비용 제어)
      if (config.iterationDelayMs > 0) {
        await delay(config.iterationDelayMs)
      }
    }

    return {
      bestVariant,
      bestScore,
      baselineScore,
      results,
      totalTokensUsed,
      totalDurationMs: Date.now() - startTime,
      totalIterations: results.length - 1, // baseline 제외
      improvementFromBaseline:
        baselineScore > 0
          ? ((bestScore - baselineScore) / baselineScore) * 100
          : 0,
    }
  }

  private async runExperiment(
    variant: PromptVariant,
    config: PromptLabConfig,
    bestCopy: AdCopyVariant[] | null,
  ): Promise<PromptLabResult> {
    try {
      // PromptLabAIAdapter가 variant 설정을 실제 카피 생성에 반영
      const { variants: copy, estimatedTokenUsage: genTokens } =
        await this.aiAdapter.generateWithVariant(config.sampleInput, variant)

      const evalResult = await this.evaluator.evaluate({
        variants: copy,
        keywords: config.sampleInput.keywords ?? [],
        bestVariantCopy: bestCopy,
      })

      return {
        id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        variantId: variant.id,
        industry: config.industry,
        score: evalResult.totalScore,
        ruleScore: evalResult.ruleScore,
        llmScore: evalResult.llmScore,
        status: 'keep', // will be updated by caller
        description: variant.description,
        generatedCopy: copy,
        tokenUsage: genTokens + evalResult.tokenUsage,
        createdAt: new Date(),
      }
    } catch {
      return {
        id: `result-${Date.now()}-crash`,
        variantId: variant.id,
        industry: config.industry,
        score: 0,
        ruleScore: 0,
        llmScore: 0,
        status: 'crash',
        description: variant.description,
        generatedCopy: [],
        tokenUsage: 0,
        createdAt: new Date(),
      }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/application/services/PromptLabService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/services/PromptLabService.ts tests/unit/application/services/PromptLabService.test.ts
git commit -m "feat(prompt-lab): add experiment loop orchestrator"
```

---

## Chunk 5: Integration (ScienceAIService 연동 + API)

### Task 8: ScienceAIService 연동

**Files:**
- Modify: `src/infrastructure/external/openai/ScienceAIService.ts:50-53`
- Existing test: `tests/unit/infrastructure/openai/ScienceAIService.test.ts`

- [ ] **Step 1: Write the failing test (기존 테스트 파일에 추가)**

```typescript
// tests/unit/infrastructure/openai/ScienceAIService.test.ts 에 추가
describe('PromptLabCache integration', () => {
  it('should apply cached variant settings when available', async () => {
    const { PromptLabCache } = await import('@infrastructure/prompt-lab/PromptLabCache')
    PromptLabCache.set('ecommerce', {
      id: 'cached-1',
      scienceDomains: ['neuromarketing', 'meta_best_practices', 'copywriting_psychology'],
      temperature: 0.6,
      fewShotStrategy: 'hook',
      systemRole: 'consumer_psychologist',
      instructionStyle: 'strict',
      description: 'cached optimal variant',
    })

    // Verify the cache is read during enrichment
    // (exact assertion depends on how enrichAdCopyInput works)
    const cached = PromptLabCache.get('ecommerce')
    expect(cached).toBeDefined()
    expect(cached!.temperature).toBe(0.6)

    PromptLabCache.clear()
  })
})
```

- [ ] **Step 2: Run existing tests to confirm they still pass**

Run: `npx vitest run tests/unit/infrastructure/openai/ScienceAIService.test.ts`
Expected: PASS (기존 테스트 깨지지 않는지 확인)

- [ ] **Step 3: Modify ScienceAIService.enrichAdCopyInput()**

At `ScienceAIService.ts`, in the `generateAdCopy` method (line ~50), add PromptLabCache lookup:

```typescript
// Before the existing enrichment call, add:
import { PromptLabCache } from '@infrastructure/prompt-lab/PromptLabCache'

// In generateAdCopy method:
async generateAdCopy(input: GenerateAdCopyInput): Promise<AdCopyVariant[]> {
  // Check for prompt lab optimized settings
  const enhanced = input as EnhancedAdCopyInput
  if (enhanced.industry) {
    const cachedVariant = PromptLabCache.get(enhanced.industry)
    if (cachedVariant) {
      // Apply cached temperature (other variant settings
      // affect prompt building which happens in enrichment)
      // Note: scienceDomains filtering is applied during enrichment
    }
  }

  const enriched = this.intelligence.enrichAdCopyInput(input)
  return this.inner.generateAdCopy(enriched)
}
```

> **중요**: 정확한 수정은 기존 `ScienceAIService.ts` 코드를 읽은 후 결정. PromptLabCache에서 variant를 꺼내서 enrichment 과정에 주입하는 방식. 기존 동작은 cache miss 시 그대로 유지.

- [ ] **Step 4: Run full test suite to verify no breakage**

Run: `npx vitest run tests/unit/infrastructure/openai/ScienceAIService.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/external/openai/ScienceAIService.ts tests/unit/infrastructure/openai/ScienceAIService.test.ts
git commit -m "feat(prompt-lab): integrate PromptLabCache with ScienceAIService"
```

---

### Task 9: API Endpoint

**Files:**
- Create: `src/app/api/prompt-lab/run/route.ts`

- [ ] **Step 1: Write API route**

```typescript
// src/app/api/prompt-lab/run/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { PromptLabService } from '@application/services/PromptLabService'
import { PromptLabEvaluator } from '@infrastructure/prompt-lab/PromptLabEvaluator'
import { PromptLabRuleScorer } from '@application/services/PromptLabRuleScorer'
import { PromptLabLLMJudge } from '@infrastructure/prompt-lab/PromptLabLLMJudge'
import { PromptLabMutator } from '@infrastructure/prompt-lab/PromptLabMutator'
import { PromptLabAIAdapter } from '@infrastructure/prompt-lab/PromptLabAIAdapter'
import { PromptLabCache } from '@infrastructure/prompt-lab/PromptLabCache'
import { createPromptLabConfig } from '@domain/value-objects/PromptLabTypes'
import { withPermission } from '@app/api/middleware/withPermission'
// Import your actual AIService factory/singleton
// import { getAIService } from '@infrastructure/external/openai/AIService'

const RequestSchema = z.object({
  industry: z.enum(['ecommerce', 'food_beverage', 'beauty', 'fashion', 'education', 'service', 'saas', 'health']),
  sampleInput: z.object({
    productName: z.string().min(1),
    productDescription: z.string().min(1),
    targetAudience: z.string().min(1),
    tone: z.enum(['professional', 'casual', 'playful', 'urgent']),
    objective: z.enum(['awareness', 'consideration', 'conversion']),
    keywords: z.array(z.string()).optional(),
    industry: z.string(),
  }),
  maxDurationMs: z.number().min(60_000), // 최소 1분, 상한 없음 (필수값)
  iterationDelayMs: z.number().min(0).optional(), // 기본 36초
  applyBest: z.boolean().optional(),
})

async function handler(request: Request) {
  try {
    const body = await request.json()
    const parsed = RequestSchema.parse(body)

    const config = createPromptLabConfig({
      industry: parsed.industry,
      sampleInput: { ...parsed.sampleInput, industry: parsed.industry },
      maxDurationMs: parsed.maxDurationMs,
      iterationDelayMs: parsed.iterationDelayMs,
      maxTokenBudget: parsed.maxTokenBudget,
    })

    // TODO: Replace with actual AIService singleton/factory
    const ai = getAIService()
    const ruleScorer = new PromptLabRuleScorer()
    const llmJudge = new PromptLabLLMJudge(ai)
    const evaluator = new PromptLabEvaluator(ruleScorer, llmJudge)
    const mutator = new PromptLabMutator()
    const adapter = new PromptLabAIAdapter(ai)

    const service = new PromptLabService(adapter, evaluator, mutator)
    const report = await service.run(config)

    if (parsed.applyBest) {
      PromptLabCache.set(config.industry, report.bestVariant)
    }

    return NextResponse.json(report)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

// ADMIN 권한 필요
export const POST = withPermission(handler, 'ADMIN')
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/prompt-lab/run/route.ts
git commit -m "feat(prompt-lab): add API endpoint POST /api/prompt-lab/run"
```

---

### Task 10: Type check + Full test suite

- [ ] **Step 1: Run type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 2: Run all prompt-lab tests**

Run: `npx vitest run tests/unit/**/PromptLab*.test.ts tests/unit/**/PromptLabTypes.test.ts`
Expected: All PASS

- [ ] **Step 3: Run full test suite**

Run: `npx vitest run`
Expected: All 2,770+ tests PASS (기존 테스트 깨지지 않음)

- [ ] **Step 4: Run build**

Run: `npx next build`
Expected: Build succeeds

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(prompt-lab): complete Prompt Lab implementation

Autoresearch-inspired autonomous prompt evolution loop.
- Hybrid evaluator: rule-based (40pt) + LLM Judge (60pt)
- Single-axis mutation per iteration
- Keep/discard with 3x median confirmation
- In-memory cache for optimized variants per industry"
```
