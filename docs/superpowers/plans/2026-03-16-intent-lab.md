# Intent Lab Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Autoresearch-inspired autonomous optimization loop for IntentClassifier — $0 cost, mathematical evaluation (accuracy %), ~36,000 iterations/hour.

**Architecture:** Refactor IntentClassifier to accept config injection, then build eval set + mutator + runner loop that optimizes keyword maps, context maps, and thresholds.

**Tech Stack:** TypeScript, Vitest, no external API calls

**Spec:** `docs/superpowers/specs/2026-03-16-intent-lab-design.md`

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/domain/services/IntentClassifierConfig.ts` | Config type + DEFAULT_CONFIG |
| Modify | `src/domain/services/IntentClassifier.ts` | Config 주입 리팩터링 |
| Create | `src/application/intent-lab/IntentLabEvalSet.ts` | 100개 불변 eval 케이스 + evaluate() |
| Create | `src/application/intent-lab/IntentLabMutator.ts` | Config 변형기 |
| Create | `src/application/intent-lab/IntentLabRunner.ts` | 실험 루프 |
| Create | `scripts/run-intent-lab.ts` | CLI 실행 스크립트 |
| Create | `tests/unit/domain/services/IntentClassifierConfig.test.ts` | Config 테스트 |
| Create | `tests/unit/application/intent-lab/IntentLabEvalSet.test.ts` | Eval set 테스트 |
| Create | `tests/unit/application/intent-lab/IntentLabMutator.test.ts` | Mutator 테스트 |
| Create | `tests/unit/application/intent-lab/IntentLabRunner.test.ts` | Runner 테스트 |

---

## Chunk 1: IntentClassifier Config 주입 리팩터링

### Task 1: IntentClassifierConfig 타입 추출

**Files:**
- Create: `src/domain/services/IntentClassifierConfig.ts`
- Test: `tests/unit/domain/services/IntentClassifierConfig.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/domain/services/IntentClassifierConfig.test.ts
import { describe, it, expect } from 'vitest'
import {
  DEFAULT_INTENT_CLASSIFIER_CONFIG,
  type IntentClassifierConfig,
} from '@domain/services/IntentClassifierConfig'
import { ChatIntent } from '@domain/value-objects/ChatIntent'

describe('IntentClassifierConfig', () => {
  it('should have keyword entries for all non-GENERAL intents', () => {
    const config = DEFAULT_INTENT_CLASSIFIER_CONFIG
    const intents = Object.values(ChatIntent).filter((i) => i !== ChatIntent.GENERAL)
    for (const intent of intents) {
      expect(config.keywordMap[intent]).toBeDefined()
      expect(config.keywordMap[intent].length).toBeGreaterThanOrEqual(2)
    }
  })

  it('should have context entries for all non-GENERAL intents', () => {
    const config = DEFAULT_INTENT_CLASSIFIER_CONFIG
    const intents = Object.values(ChatIntent).filter((i) => i !== ChatIntent.GENERAL)
    for (const intent of intents) {
      expect(config.contextMap[intent]).toBeDefined()
      expect(config.contextMap[intent].length).toBeGreaterThanOrEqual(1)
    }
  })

  it('should have reasonable threshold defaults', () => {
    const config = DEFAULT_INTENT_CLASSIFIER_CONFIG
    expect(config.ambiguityThreshold).toBe(2.0)
    expect(config.singleMatchConfidence).toBe(0.6)
    expect(config.llmConfidenceCoeff).toBe(0.05)
  })

  it('should be a plain object (not frozen)', () => {
    const config = DEFAULT_INTENT_CLASSIFIER_CONFIG
    expect(typeof config).toBe('object')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/domain/services/IntentClassifierConfig.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

```typescript
// src/domain/services/IntentClassifierConfig.ts
import { ChatIntent } from '../value-objects/ChatIntent'

export interface IntentClassifierConfig {
  keywordMap: Record<Exclude<ChatIntent, ChatIntent.GENERAL>, string[]>
  contextMap: Record<Exclude<ChatIntent, ChatIntent.GENERAL>, string[]>
  negationPatterns: string[]
  ambiguityThreshold: number
  singleMatchConfidence: number
  llmConfidenceCoeff: number
}

export const DEFAULT_INTENT_CLASSIFIER_CONFIG: IntentClassifierConfig = {
  keywordMap: {
    [ChatIntent.CAMPAIGN_CREATION]: ['캠페인', 'campaign', 'create', '만들', '생성', '시작'],
    [ChatIntent.REPORT_QUERY]: ['리포트', 'report', '보고서', '보여줘', '보기', '조회'],
    [ChatIntent.KPI_ANALYSIS]: [
      'roas', 'cpc', '성과', '분석', 'performance', 'analyze', '전환율', '하락', '급증', '급감', '이상', '감지', 'ctr',
    ],
    [ChatIntent.PIXEL_SETUP]: ['픽셀', 'pixel', '설치', 'install'],
    [ChatIntent.BUDGET_OPTIMIZATION]: ['예산', 'budget', '최적화', 'optimize'],
    [ChatIntent.CREATIVE_FATIGUE]: ['피로도', '피로', '반복', '빈도', 'fatigue', '노출 빈도'],
    [ChatIntent.LEARNING_PHASE]: ['학습', '학습단계', '소진', '예산이 안', '노출이 안', 'learning phase'],
    [ChatIntent.STRUCTURE_OPTIMIZATION]: ['구조', '통합', '파편', '세트 개수', '캠페인 수', '단순화'],
    [ChatIntent.LEAD_QUALITY]: ['리드', '허수', '품질', '연락', '부재', 'lead quality'],
    [ChatIntent.TRACKING_HEALTH]: ['capi', 'emq', '추적', '전환 추적', '이벤트', '트래킹'],
  },
  contextMap: {
    [ChatIntent.CAMPAIGN_CREATION]: ['매출', '전략', '광고를 시작', '새로'],
    [ChatIntent.REPORT_QUERY]: ['데이터', '살펴', '확인', '실적'],
    [ChatIntent.KPI_ANALYSIS]: ['효율', '대비', '어떤가', '올리', '지표', '광고 효율'],
    [ChatIntent.PIXEL_SETUP]: ['추적', '트래킹'],
    [ChatIntent.BUDGET_OPTIMIZATION]: ['비용', '절감', '조정'],
    [ChatIntent.CREATIVE_FATIGUE]: ['cpm 급등', '소재 교체', '같은 광고', '지겨'],
    [ChatIntent.LEARNING_PHASE]: ['배달이 안', '돈이 안 써', '학습 중', '초기화'],
    [ChatIntent.STRUCTURE_OPTIMIZATION]: ['너무 많', '합치', '정리', '분산'],
    [ChatIntent.LEAD_QUALITY]: ['허수 고객', '가짜', '전화 안', '양질'],
    [ChatIntent.TRACKING_HEALTH]: ['전환이 안 잡', '매칭', '이벤트 누락', '서버 이벤트'],
  },
  negationPatterns: ['지 마', '지마', '하지', '안 ', '못 ', '없'],
  ambiguityThreshold: 2.0,
  singleMatchConfidence: 0.6,
  llmConfidenceCoeff: 0.05,
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/domain/services/IntentClassifierConfig.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/IntentClassifierConfig.ts tests/unit/domain/services/IntentClassifierConfig.test.ts
git commit -m "feat(intent-lab): extract IntentClassifierConfig type and defaults"
```

---

### Task 2: IntentClassifier config 주입 리팩터링

**Files:**
- Modify: `src/domain/services/IntentClassifier.ts`
- Existing test: `tests/unit/domain/services/IntentClassifier.test.ts` (429줄, 깨지면 안 됨)

- [ ] **Step 1: Refactor IntentClassifier to accept config**

현재 코드:
```typescript
// 모듈 레벨 const
const KEYWORD_MAP = { ... }
const LLM_CONTEXT_MAP = { ... }
const NEGATION_PATTERNS = [...]

export class IntentClassifier {
  private constructor() {}
  static create(): IntentClassifier { return new IntentClassifier() }
  // ... 내부에서 KEYWORD_MAP 직접 참조
}
```

변경 후:
```typescript
import { DEFAULT_INTENT_CLASSIFIER_CONFIG, type IntentClassifierConfig } from './IntentClassifierConfig'

export class IntentClassifier {
  private readonly config: IntentClassifierConfig

  private constructor(config: IntentClassifierConfig) {
    this.config = config
  }

  static create(config?: IntentClassifierConfig): IntentClassifier {
    return new IntentClassifier(config ?? DEFAULT_INTENT_CLASSIFIER_CONFIG)
  }

  getConfig(): IntentClassifierConfig {
    return this.config
  }

  // classifyByKeyword: KEYWORD_MAP → this.config.keywordMap
  // classifyByLLM: LLM_CONTEXT_MAP → this.config.contextMap
  // NEGATION_PATTERNS → this.config.negationPatterns
  // 2.0 → this.config.ambiguityThreshold
  // 0.6 (CONFIDENCE_MEDIUM + 0.1) → this.config.singleMatchConfidence
  // 0.05 → this.config.llmConfidenceCoeff
}
```

핵심: 모듈 레벨 `KEYWORD_MAP`, `LLM_CONTEXT_MAP`, `NEGATION_PATTERNS` 삭제 → `IntentClassifierConfig`에서 가져옴. 하드코딩된 매직넘버 → config 필드 참조.

- [ ] **Step 2: Run existing 429-line tests**

Run: `npx vitest run tests/unit/domain/services/IntentClassifier.test.ts`
Expected: ALL PASS (기존 동작 100% 유지)

- [ ] **Step 3: Add config injection test**

기존 테스트 파일 끝에 추가:
```typescript
describe('config injection', () => {
  it('should use default config when none provided', () => {
    const classifier = IntentClassifier.create()
    const result = classifier.classify('캠페인 만들어줘')
    expect(result.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
  })

  it('should use custom config when provided', () => {
    const customConfig = {
      ...DEFAULT_INTENT_CLASSIFIER_CONFIG,
      keywordMap: {
        ...DEFAULT_INTENT_CLASSIFIER_CONFIG.keywordMap,
        [ChatIntent.CAMPAIGN_CREATION]: ['테스트키워드'],
      },
    }
    const classifier = IntentClassifier.create(customConfig)

    // "캠페인"은 더 이상 CAMPAIGN_CREATION 키워드가 아님
    const result1 = classifier.classify('캠페인 만들어줘')
    expect(result1.intent).not.toBe(ChatIntent.CAMPAIGN_CREATION)

    // "테스트키워드"가 이제 CAMPAIGN_CREATION
    const result2 = classifier.classify('테스트키워드로 해줘')
    expect(result2.intent).toBe(ChatIntent.CAMPAIGN_CREATION)
  })

  it('should expose config via getConfig()', () => {
    const classifier = IntentClassifier.create()
    expect(classifier.getConfig().ambiguityThreshold).toBe(2.0)
  })
})
```

- [ ] **Step 4: Run all tests**

Run: `npx vitest run tests/unit/domain/services/IntentClassifier.test.ts`
Expected: ALL PASS (기존 + 새 테스트)

- [ ] **Step 5: Commit**

```bash
git add src/domain/services/IntentClassifier.ts tests/unit/domain/services/IntentClassifier.test.ts
git commit -m "refactor(intent-lab): inject config into IntentClassifier"
```

---

## Chunk 2: Eval Set (= prepare.py)

### Task 3: IntentLabEvalSet (불변 평가 세트)

**Files:**
- Create: `src/application/intent-lab/IntentLabEvalSet.ts`
- Test: `tests/unit/application/intent-lab/IntentLabEvalSet.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/application/intent-lab/IntentLabEvalSet.test.ts
import { describe, it, expect } from 'vitest'
import {
  TRAIN_EVAL_SET,
  VALIDATION_EVAL_SET,
  FULL_EVAL_SET,
  evaluate,
  type EvalCase,
} from '@application/intent-lab/IntentLabEvalSet'
import { IntentClassifier } from '@domain/services/IntentClassifier'
import { ChatIntent } from '@domain/value-objects/ChatIntent'

describe('IntentLabEvalSet', () => {
  it('should have 80 train cases', () => {
    expect(TRAIN_EVAL_SET.length).toBe(80)
  })

  it('should have 20 validation cases', () => {
    expect(VALIDATION_EVAL_SET.length).toBe(20)
  })

  it('should have 100 total cases', () => {
    expect(FULL_EVAL_SET.length).toBe(100)
  })

  it('should cover all 11 intents', () => {
    const intents = new Set(FULL_EVAL_SET.map((c) => c.expected))
    expect(intents.size).toBe(11) // 10 specific + GENERAL
  })

  it('should have 3 difficulty levels', () => {
    const difficulties = new Set(FULL_EVAL_SET.map((c) => c.difficulty))
    expect(difficulties).toContain('easy')
    expect(difficulties).toContain('medium')
    expect(difficulties).toContain('hard')
  })

  describe('evaluate()', () => {
    it('should return accuracy between 0 and 1', () => {
      const classifier = IntentClassifier.create()
      const result = evaluate(classifier, TRAIN_EVAL_SET)
      expect(result.accuracy).toBeGreaterThanOrEqual(0)
      expect(result.accuracy).toBeLessThanOrEqual(1)
    })

    it('should return correct/total counts', () => {
      const classifier = IntentClassifier.create()
      const result = evaluate(classifier, TRAIN_EVAL_SET)
      expect(result.correct + result.failures.length).toBe(result.total)
    })

    it('should report per-difficulty accuracy', () => {
      const classifier = IntentClassifier.create()
      const result = evaluate(classifier, FULL_EVAL_SET)
      expect(result.byDifficulty.easy).toBeDefined()
      expect(result.byDifficulty.medium).toBeDefined()
      expect(result.byDifficulty.hard).toBeDefined()
    })

    it('should return failure details', () => {
      // Use a crippled config that misclassifies everything
      const classifier = IntentClassifier.create({
        ...require('@domain/services/IntentClassifierConfig').DEFAULT_INTENT_CLASSIFIER_CONFIG,
        keywordMap: {
          [ChatIntent.CAMPAIGN_CREATION]: ['없는키워드'],
          [ChatIntent.REPORT_QUERY]: ['없는키워드2'],
          [ChatIntent.KPI_ANALYSIS]: ['없는키워드3'],
          [ChatIntent.PIXEL_SETUP]: ['없는키워드4'],
          [ChatIntent.BUDGET_OPTIMIZATION]: ['없는키워드5'],
          [ChatIntent.CREATIVE_FATIGUE]: ['없는키워드6'],
          [ChatIntent.LEARNING_PHASE]: ['없는키워드7'],
          [ChatIntent.STRUCTURE_OPTIMIZATION]: ['없는키워드8'],
          [ChatIntent.LEAD_QUALITY]: ['없는키워드9'],
          [ChatIntent.TRACKING_HEALTH]: ['없는키워드10'],
        },
      })
      const result = evaluate(classifier, FULL_EVAL_SET)
      expect(result.failures.length).toBeGreaterThan(0)
      expect(result.failures[0]).toHaveProperty('input')
      expect(result.failures[0]).toHaveProperty('expected')
      expect(result.failures[0]).toHaveProperty('got')
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/application/intent-lab/IntentLabEvalSet.test.ts`
Expected: FAIL

- [ ] **Step 3: Write implementation**

Create `src/application/intent-lab/IntentLabEvalSet.ts` with:
- 100 eval cases from the spec (section 3.2)
- Split into TRAIN_EVAL_SET (80) and VALIDATION_EVAL_SET (20)
- `evaluate()` function that runs classifier against cases and returns accuracy + failures + per-difficulty breakdown

```typescript
// src/application/intent-lab/IntentLabEvalSet.ts
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import type { IntentClassifier } from '@domain/services/IntentClassifier'

export interface EvalCase {
  input: string
  expected: ChatIntent
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface EvalResult {
  accuracy: number
  correct: number
  total: number
  failures: { input: string; expected: ChatIntent; got: ChatIntent }[]
  byDifficulty: Record<'easy' | 'medium' | 'hard', { accuracy: number; correct: number; total: number }>
}

// 100개 eval 케이스 — 스펙의 section 3.2에서 가져옴
// 이 데이터는 절대 수정하지 않음 (= prepare.py)
const ALL_EVAL_CASES: EvalCase[] = [
  // === Easy (~30) ===
  { input: '캠페인 만들어줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
  { input: '새 캠페인 시작하고 싶어', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
  { input: 'create a new campaign', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
  { input: '리포트 보여줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'easy' },
  { input: '주간 보고서 보기', expected: ChatIntent.REPORT_QUERY, difficulty: 'easy' },
  { input: 'ROAS 분석해줘', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy' },
  { input: 'CPC가 너무 높아', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy' },
  { input: '전환율 확인', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy' },
  { input: '픽셀 설치 도와줘', expected: ChatIntent.PIXEL_SETUP, difficulty: 'easy' },
  { input: '페이스북 픽셀 설정', expected: ChatIntent.PIXEL_SETUP, difficulty: 'easy' },
  { input: '예산 최적화 해줘', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'easy' },
  { input: '광고 예산 조정', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'easy' },
  { input: '피로도 확인해줘', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'easy' },
  { input: '광고 노출 빈도가 높아', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'easy' },
  { input: '학습단계가 끝나질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'easy' },
  { input: '예산이 소진이 안 돼', expected: ChatIntent.LEARNING_PHASE, difficulty: 'easy' },
  { input: '캠페인 구조 통합하고 싶어', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'easy' },
  { input: '세트 개수가 너무 많아', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'easy' },
  { input: '리드 품질이 좋지 않아', expected: ChatIntent.LEAD_QUALITY, difficulty: 'easy' },
  { input: '허수 고객이 많아', expected: ChatIntent.LEAD_QUALITY, difficulty: 'easy' },
  { input: 'CAPI 설정해야해', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'easy' },
  { input: '전환 추적 설정해줘', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'easy' },
  { input: '안녕하세요', expected: ChatIntent.GENERAL, difficulty: 'easy' },
  { input: '오늘 날씨 어때?', expected: ChatIntent.GENERAL, difficulty: 'easy' },
  { input: '고마워', expected: ChatIntent.GENERAL, difficulty: 'easy' },
  { input: '뭐 할 수 있어?', expected: ChatIntent.GENERAL, difficulty: 'easy' },
  { input: '캠페인 생성해줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'easy' },
  { input: '성과 분석 부탁해', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'easy' },
  { input: '보고서 조회해줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'easy' },
  { input: 'EMQ 점수 확인해줘', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'easy' },

  // === Medium (~35) ===
  { input: '매출을 올려야 하는데 뭐부터 해야 해?', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'medium' },
  { input: '새로운 고객을 찾아야 해', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'medium' },
  { input: '광고를 시작하려고', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'medium' },
  { input: '지난 달 데이터 좀 살펴봐줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium' },
  { input: '실적이 어떻게 됐는지 확인해줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium' },
  { input: '이번 주 실적 궁금해', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium' },
  { input: '광고 효율이 어떤가요?', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'medium' },
  { input: '지표가 좀 이상해', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'medium' },
  { input: '대비 효율이 떨어졌어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'medium' },
  { input: '광고비가 너무 나가', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium' },
  { input: '비용 좀 줄여야겠어', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium' },
  { input: '돈을 아껴야 해', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium' },
  { input: '같은 광고가 계속 보여', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'medium' },
  { input: 'CPM이 급등했어', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'medium' },
  { input: '소재를 교체해야 할까?', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'medium' },
  { input: '광고가 나가질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'medium' },
  { input: '돈이 써지질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'medium' },
  { input: '노출이 나오질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'medium' },
  { input: '캠페인이 너무 많아', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'medium' },
  { input: '광고를 정리하고 싶어', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'medium' },
  { input: '너무 분산돼 있어', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'medium' },
  { input: '가짜 고객이 많아', expected: ChatIntent.LEAD_QUALITY, difficulty: 'medium' },
  { input: '전화해도 연락이 안 돼', expected: ChatIntent.LEAD_QUALITY, difficulty: 'medium' },
  { input: '양질의 리드가 필요해', expected: ChatIntent.LEAD_QUALITY, difficulty: 'medium' },
  { input: '전환이 잡히질 않아', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium' },
  { input: '이벤트가 누락되는 것 같아', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium' },
  { input: '서버 이벤트가 들어오질 않아', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium' },
  { input: '그냥 인사하러 왔어', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '잘 모르겠어', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '음...', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '반갑습니다', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '도움이 필요해', expected: ChatIntent.GENERAL, difficulty: 'medium' },
  { input: '광고 예산을 늘려볼까', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'medium' },
  { input: '트래킹 코드 심어야 해', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'medium' },
  { input: '이번 달 리포트 만들어줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'medium' },

  // === Hard (~35) ===
  { input: '광고 좀 해줘', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard' },
  { input: '뭔가 좀 해봐야 할 것 같은데', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '요즘 반응이 별로야', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '전환이 안 나와요 추적 문제인가', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard' },
  { input: '같은 사람한테 자꾸 광고가 떠', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'hard' },
  { input: '돈은 쓰는데 결과가 없어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '새로 시작하고 싶은데 어떻게?', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard' },
  { input: '숫자가 맞지 않아', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard' },
  { input: '광고가 멈춰버렸어', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard' },
  { input: '성과가 갑자기 확 떨어졌어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '다 합쳐버릴까?', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'hard' },
  { input: '진짜 고객인지 모르겠어', expected: ChatIntent.LEAD_QUALITY, difficulty: 'hard' },
  { input: '머신러닝이 아직 덜 된 건가', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard' },
  { input: '우리 광고 잘 되고 있어?', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '광고 끄고 싶어', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '캠페인을 만들지 마세요', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '비용 대비 효과가 좀...', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '요즘 왜 이래', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '데이터 좀 봐줘', expected: ChatIntent.REPORT_QUERY, difficulty: 'hard' },
  { input: '엊그제부터 이상해', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '소재 좀 바꿔야겠다', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'hard' },
  { input: '예산을 더 넣을까 말까', expected: ChatIntent.BUDGET_OPTIMIZATION, difficulty: 'hard' },
  { input: '문의 건이 이상한 게 많아', expected: ChatIntent.LEAD_QUALITY, difficulty: 'hard' },
  { input: '구글 태그매니저에서 이벤트가 이상해', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard' },
  { input: '광고 좀 더 해볼까', expected: ChatIntent.CAMPAIGN_CREATION, difficulty: 'hard' },
  { input: '전환이 줄었어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '학습이 끝나질 않아', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard' },
  { input: '새 소재 넣어야 하나', expected: ChatIntent.CREATIVE_FATIGUE, difficulty: 'hard' },
  { input: '타겟이 너무 좁은 거 아냐?', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'hard' },
  { input: '이거 왜 안 되지?', expected: ChatIntent.GENERAL, difficulty: 'hard' },
  { input: '매칭률이 떨어져', expected: ChatIntent.TRACKING_HEALTH, difficulty: 'hard' },
  { input: '클릭은 많은데 구매가 없어', expected: ChatIntent.KPI_ANALYSIS, difficulty: 'hard' },
  { input: '광고 세트를 좀 줄여야겠어', expected: ChatIntent.STRUCTURE_OPTIMIZATION, difficulty: 'hard' },
  { input: '리드가 진짜인지 확인해줘', expected: ChatIntent.LEAD_QUALITY, difficulty: 'hard' },
  { input: '배달이 안 되고 있어', expected: ChatIntent.LEARNING_PHASE, difficulty: 'hard' },
]

// 80/20 split (고정, 셔플 안 함)
export const TRAIN_EVAL_SET: EvalCase[] = ALL_EVAL_CASES.slice(0, 80)
export const VALIDATION_EVAL_SET: EvalCase[] = ALL_EVAL_CASES.slice(80)
export const FULL_EVAL_SET: EvalCase[] = ALL_EVAL_CASES

export function evaluate(classifier: IntentClassifier, evalSet: EvalCase[]): EvalResult {
  let correct = 0
  const failures: EvalResult['failures'] = []
  const byDiff: Record<string, { correct: number; total: number }> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  }

  for (const { input, expected, difficulty } of evalSet) {
    byDiff[difficulty].total++
    const result = classifier.classify(input)
    if (result.intent === expected) {
      correct++
      byDiff[difficulty].correct++
    } else {
      failures.push({ input, expected, got: result.intent })
    }
  }

  return {
    accuracy: evalSet.length > 0 ? correct / evalSet.length : 0,
    correct,
    total: evalSet.length,
    failures,
    byDifficulty: {
      easy: { ...byDiff.easy, accuracy: byDiff.easy.total > 0 ? byDiff.easy.correct / byDiff.easy.total : 0 },
      medium: { ...byDiff.medium, accuracy: byDiff.medium.total > 0 ? byDiff.medium.correct / byDiff.medium.total : 0 },
      hard: { ...byDiff.hard, accuracy: byDiff.hard.total > 0 ? byDiff.hard.correct / byDiff.hard.total : 0 },
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/application/intent-lab/IntentLabEvalSet.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/intent-lab/IntentLabEvalSet.ts tests/unit/application/intent-lab/IntentLabEvalSet.test.ts
git commit -m "feat(intent-lab): add immutable eval set (100 cases, 80/20 split)"
```

---

## Chunk 3: Mutator + Runner

### Task 4: IntentLabMutator (config 변형기)

**Files:**
- Create: `src/application/intent-lab/IntentLabMutator.ts`
- Test: `tests/unit/application/intent-lab/IntentLabMutator.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/application/intent-lab/IntentLabMutator.test.ts
import { describe, it, expect } from 'vitest'
import { IntentLabMutator } from '@application/intent-lab/IntentLabMutator'
import { DEFAULT_INTENT_CLASSIFIER_CONFIG } from '@domain/services/IntentClassifierConfig'

describe('IntentLabMutator', () => {
  const mutator = new IntentLabMutator()

  it('should produce a different config from baseline', () => {
    const mutated = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
    expect(JSON.stringify(mutated.config)).not.toBe(JSON.stringify(DEFAULT_INTENT_CLASSIFIER_CONFIG))
  })

  it('should describe what changed', () => {
    const mutated = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
    expect(mutated.description.length).toBeGreaterThan(0)
  })

  it('should keep minimum 2 keywords per intent', () => {
    for (let i = 0; i < 50; i++) {
      const mutated = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
      for (const keywords of Object.values(mutated.config.keywordMap)) {
        expect(keywords.length).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('should keep minimum 1 context pattern per intent', () => {
    for (let i = 0; i < 50; i++) {
      const mutated = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
      for (const patterns of Object.values(mutated.config.contextMap)) {
        expect(patterns.length).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('should keep ambiguityThreshold in 1.5-3.0 range', () => {
    for (let i = 0; i < 50; i++) {
      const mutated = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
      expect(mutated.config.ambiguityThreshold).toBeGreaterThanOrEqual(1.5)
      expect(mutated.config.ambiguityThreshold).toBeLessThanOrEqual(3.0)
    }
  })

  it('should generate diverse mutations', () => {
    const descriptions = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const mutated = mutator.mutate(DEFAULT_INTENT_CLASSIFIER_CONFIG)
      descriptions.add(mutated.description)
    }
    expect(descriptions.size).toBeGreaterThan(3)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Write implementation**

IntentLabMutator가 수행하는 변형 축 (한 번에 1개만):
1. **키워드 추가**: 한국어 마케팅 관련 후보 풀에서 랜덤 키워드를 랜덤 인텐트에 추가
2. **키워드 제거**: 랜덤 인텐트에서 키워드 1개 제거 (최소 2개 유지)
3. **컨텍스트 패턴 추가**: 후보 풀에서 패턴 추가
4. **컨텍스트 패턴 제거**: 패턴 1개 제거 (최소 1개 유지)
5. **ambiguityThreshold 조정**: ±0.1~0.3
6. **singleMatchConfidence 조정**: ±0.05~0.1
7. **llmConfidenceCoeff 조정**: ±0.01~0.02

후보 키워드 풀: eval set의 failure 케이스에서 추출한 단어들 + 마케팅 도메인 관련 한국어 단어들.

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/application/intent-lab/IntentLabMutator.ts tests/unit/application/intent-lab/IntentLabMutator.test.ts
git commit -m "feat(intent-lab): add config mutator (7 mutation axes)"
```

---

### Task 5: IntentLabRunner (실험 루프)

**Files:**
- Create: `src/application/intent-lab/IntentLabRunner.ts`
- Test: `tests/unit/application/intent-lab/IntentLabRunner.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// tests/unit/application/intent-lab/IntentLabRunner.test.ts
import { describe, it, expect } from 'vitest'
import { IntentLabRunner } from '@application/intent-lab/IntentLabRunner'

describe('IntentLabRunner', () => {
  it('should run baseline and return report', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 100, iterationDelayMs: 0 })

    expect(report.baselineAccuracy).toBeGreaterThan(0)
    expect(report.bestAccuracy).toBeGreaterThanOrEqual(report.baselineAccuracy)
    expect(report.results.length).toBeGreaterThanOrEqual(1)
    expect(report.totalIterations).toBeGreaterThanOrEqual(0)
  })

  it('should improve or maintain accuracy over iterations', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 500, iterationDelayMs: 0 })

    expect(report.bestAccuracy).toBeGreaterThanOrEqual(report.baselineAccuracy)
  })

  it('should stop when time runs out', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 200, iterationDelayMs: 0 })

    expect(report.totalDurationMs).toBeLessThan(1000)
  })

  it('should report validation accuracy separately', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 100, iterationDelayMs: 0 })

    expect(report.validationAccuracy).toBeDefined()
    expect(report.validationAccuracy).toBeGreaterThanOrEqual(0)
    expect(report.validationAccuracy).toBeLessThanOrEqual(1)
  })

  it('should report per-difficulty breakdown', async () => {
    const runner = new IntentLabRunner()
    const report = await runner.run({ maxDurationMs: 100, iterationDelayMs: 0 })

    expect(report.byDifficulty.easy).toBeDefined()
    expect(report.byDifficulty.medium).toBeDefined()
    expect(report.byDifficulty.hard).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Write implementation**

```typescript
// src/application/intent-lab/IntentLabRunner.ts
import { IntentClassifier } from '@domain/services/IntentClassifier'
import { DEFAULT_INTENT_CLASSIFIER_CONFIG, type IntentClassifierConfig } from '@domain/services/IntentClassifierConfig'
import { TRAIN_EVAL_SET, VALIDATION_EVAL_SET, evaluate, type EvalResult } from './IntentLabEvalSet'
import { IntentLabMutator } from './IntentLabMutator'

export interface IntentLabConfig {
  maxDurationMs: number
  iterationDelayMs: number
}

export interface IntentLabResult {
  config: IntentClassifierConfig
  trainAccuracy: number
  description: string
  status: 'keep' | 'discard'
}

export interface IntentLabReport {
  bestConfig: IntentClassifierConfig
  bestAccuracy: number
  baselineAccuracy: number
  validationAccuracy: number
  results: IntentLabResult[]
  totalDurationMs: number
  totalIterations: number
  improvementFromBaseline: number
  byDifficulty: EvalResult['byDifficulty']
  failures: EvalResult['failures']
}

const BASELINE_FLOOR_RATIO = 0.95

export class IntentLabRunner {
  private mutator = new IntentLabMutator()

  async run(config: IntentLabConfig): Promise<IntentLabReport> {
    const results: IntentLabResult[] = []

    // 1. Baseline
    const baselineClassifier = IntentClassifier.create()
    const baselineEval = evaluate(baselineClassifier, TRAIN_EVAL_SET)
    let bestConfig = DEFAULT_INTENT_CLASSIFIER_CONFIG
    let bestAccuracy = baselineEval.accuracy
    const baselineAccuracy = baselineEval.accuracy

    console.log(`[IntentLab] baseline: ${(baselineAccuracy * 100).toFixed(1)}%`)

    // 2. LOOP
    const startTime = Date.now()
    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

    while (true) {
      if (Date.now() - startTime >= config.maxDurationMs) break

      const mutation = this.mutator.mutate(bestConfig)
      const classifier = IntentClassifier.create(mutation.config)
      const evalResult = evaluate(classifier, TRAIN_EVAL_SET)

      const status: 'keep' | 'discard' =
        evalResult.accuracy > bestAccuracy ||
        (evalResult.accuracy === bestAccuracy && this.isSimpler(mutation.config, bestConfig))
          ? 'keep'
          : 'discard'

      // 품질 하한선
      if (evalResult.accuracy < baselineAccuracy * BASELINE_FLOOR_RATIO) {
        results.push({ config: mutation.config, trainAccuracy: evalResult.accuracy, description: mutation.description, status: 'discard' })
        if (config.iterationDelayMs > 0) await delay(config.iterationDelayMs)
        continue
      }

      if (status === 'keep') {
        bestConfig = mutation.config
        bestAccuracy = evalResult.accuracy
        console.log(`[IntentLab] #${results.length + 1} KEEP ${mutation.description} → ${(evalResult.accuracy * 100).toFixed(1)}%`)
      }

      results.push({ config: mutation.config, trainAccuracy: evalResult.accuracy, description: mutation.description, status })

      if (config.iterationDelayMs > 0) await delay(config.iterationDelayMs)
    }

    // 3. Validation
    const finalClassifier = IntentClassifier.create(bestConfig)
    const validationEval = evaluate(finalClassifier, VALIDATION_EVAL_SET)
    const finalFullEval = evaluate(finalClassifier, [...TRAIN_EVAL_SET, ...VALIDATION_EVAL_SET])

    return {
      bestConfig,
      bestAccuracy,
      baselineAccuracy,
      validationAccuracy: validationEval.accuracy,
      results,
      totalDurationMs: Date.now() - startTime,
      totalIterations: results.length,
      improvementFromBaseline: baselineAccuracy > 0 ? ((bestAccuracy - baselineAccuracy) / baselineAccuracy) * 100 : 0,
      byDifficulty: finalFullEval.byDifficulty,
      failures: finalFullEval.failures,
    }
  }

  private isSimpler(a: IntentClassifierConfig, b: IntentClassifierConfig): boolean {
    const countKeywords = (config: IntentClassifierConfig) =>
      Object.values(config.keywordMap).reduce((sum, kw) => sum + kw.length, 0)
    return countKeywords(a) < countKeywords(b)
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add src/application/intent-lab/IntentLabRunner.ts tests/unit/application/intent-lab/IntentLabRunner.test.ts
git commit -m "feat(intent-lab): add experiment loop runner"
```

---

## Chunk 4: CLI + Final Verification

### Task 6: CLI 실행 스크립트

**Files:**
- Create: `scripts/run-intent-lab.ts`

- [ ] **Step 1: Write script**

```typescript
// scripts/run-intent-lab.ts
import { IntentLabRunner } from '../src/application/intent-lab/IntentLabRunner'

const DURATION_MS = Number(process.argv[2]) || 300_000 // 기본 5분

async function main() {
  console.log('=== Intent Lab 시작 ===')
  console.log(`실행 시간: ${DURATION_MS / 60_000}분`)
  console.log(`비용: $0 (LLM 호출 없음)`)
  console.log('')

  const runner = new IntentLabRunner()
  const report = await runner.run({ maxDurationMs: DURATION_MS, iterationDelayMs: 0 })

  console.log('')
  console.log('=== Intent Lab 결과 ===')
  console.log(`총 반복: ${report.totalIterations}회`)
  console.log(`총 시간: ${(report.totalDurationMs / 1000).toFixed(1)}초`)
  console.log('')
  console.log(`baseline 정확도: ${(report.baselineAccuracy * 100).toFixed(1)}%`)
  console.log(`최고 정확도 (train): ${(report.bestAccuracy * 100).toFixed(1)}%`)
  console.log(`검증 정확도 (validation): ${(report.validationAccuracy * 100).toFixed(1)}%`)
  console.log(`개선율: ${report.improvementFromBaseline.toFixed(1)}%`)
  console.log('')
  console.log('=== 난이도별 정확도 ===')
  console.log(`easy:   ${(report.byDifficulty.easy.accuracy * 100).toFixed(1)}% (${report.byDifficulty.easy.correct}/${report.byDifficulty.easy.total})`)
  console.log(`medium: ${(report.byDifficulty.medium.accuracy * 100).toFixed(1)}% (${report.byDifficulty.medium.correct}/${report.byDifficulty.medium.total})`)
  console.log(`hard:   ${(report.byDifficulty.hard.accuracy * 100).toFixed(1)}% (${report.byDifficulty.hard.correct}/${report.byDifficulty.hard.total})`)
  console.log('')

  if (report.failures.length > 0) {
    console.log(`=== 실패 케이스 (${report.failures.length}개) ===`)
    for (const f of report.failures) {
      console.log(`  "${f.input}" → expected: ${f.expected}, got: ${f.got}`)
    }
  }

  console.log('')
  console.log('=== 최적 config 변경 사항 ===')
  console.log('results.tsv 스타일:')
  console.log('status\taccuracy\tdescription')
  for (const r of report.results.filter((r) => r.status === 'keep')) {
    console.log(`${r.status}\t${(r.trainAccuracy * 100).toFixed(1)}%\t${r.description}`)
  }

  // JSON 저장
  const fs = await import('fs')
  fs.mkdirSync('data/intent-lab', { recursive: true })
  const outputPath = `data/intent-lab/result-${new Date().toISOString().slice(0, 10)}.json`
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2))
  console.log(`\n결과 저장: ${outputPath}`)
}

main()
```

- [ ] **Step 2: Commit**

```bash
git add scripts/run-intent-lab.ts
git commit -m "feat(intent-lab): add CLI runner script"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run all intent-lab tests**

Run: `npx vitest run tests/unit/application/intent-lab/ tests/unit/domain/services/IntentClassifier*.test.ts`
Expected: ALL PASS

- [ ] **Step 2: Run existing full test suite**

Run: `npx vitest run`
Expected: ALL PASS (기존 테스트 깨지지 않음)

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Build**

Run: `npx next build`
Expected: Success

- [ ] **Step 5: Quick smoke test (5분)**

Run: `npx tsx scripts/run-intent-lab.ts 300000`
Expected: baseline 정확도 출력, 반복 실행, 결과 출력

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(intent-lab): complete Intent Lab implementation

Autoresearch-inspired IntentClassifier optimization.
- 100 eval cases (80 train / 20 validation)
- 7 mutation axes (keywords, patterns, thresholds)
- $0 cost, <100ms per iteration
- Mathematical accuracy evaluation (no LLM-as-Judge)"
```
