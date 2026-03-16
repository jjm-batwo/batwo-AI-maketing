# Prompt Lab: Autoresearch-Inspired Prompt Evolution Loop

> **Status**: Approved
> **Date**: 2026-03-16
> **Inspired by**: [karpathy/autoresearch](https://github.com/karpathy/autoresearch)

## 1. 개요

autoresearch의 자율 실험 루프(가설 → 실험 → 평가 → keep/discard → 반복)를 프롬프트 최적화에 적용한다. 광고비 없이 LLM API 호출만으로 산업별 최적 프롬프트 설정을 자동 탐색한다.

### autoresearch 패턴 매핑

| autoresearch | Prompt Lab | 역할 |
|---|---|---|
| `prepare.py` (불변) | `PromptLabEvaluator` | 불변 평가 함수 (하이브리드 스코어러) |
| `train.py` (수정 대상) | `PromptVariant` | 수정 대상 — 프롬프트 변형 |
| `program.md` (에이전트 지시) | `PromptLabConfig` | 루프 설정 |
| `results.tsv` | `PromptLabResult[]` | 실험 결과 누적 기록 |
| 실험 루프 | `PromptLabService` | LOOP: 변형 → 실행 → 평가 → keep/discard |

---

## 2. 파일 배치 (헥사고날 아키텍처)

```
application/services/
  └─ PromptLabService.ts           ← 실험 루프 오케스트레이터
  └─ PromptLabRuleScorer.ts        ← 규칙 기반 채점 (40점, 도메인 로직)

domain/value-objects/
  └─ PromptLabTypes.ts             ← PromptVariant, PromptLabResult, PromptLabConfig

infrastructure/prompt-lab/
  └─ PromptLabLLMJudge.ts          ← LLM Judge 어댑터 (60점, 외부 API 호출)
  └─ PromptLabEvaluator.ts         ← 하이브리드 스코어러 (RuleScorer + LLMJudge 조합)
  └─ PromptLabMutator.ts           ← 프롬프트 변형 생성기
  └─ PromptLabCache.ts             ← bestVariant 산업별 캐시 (메모리 기반)

presentation/
  └─ app/api/prompt-lab/run/route.ts  ← API 엔드포인트
  └─ application/tools/mutations/runPromptLab.tool.ts  ← 챗봇 도구
```

> **아키텍처 노트**: 규칙 기반 채점(40점)은 도메인 로직이므로 `application/services/`에 배치.
> LLM Judge(60점)는 외부 API 호출이므로 `infrastructure/`에 배치. `PromptLabEvaluator`는 둘을 조합하는 파사드.

---

## 3. 불변 평가 함수 (`PromptLabEvaluator`)

autoresearch의 `evaluate_bpb`에 해당. **절대 수정하지 않는 고정 평가 기준**.

### 3.1 규칙 기반 (40점 만점)

| 항목 | 배점 | 측정 방식 |
|------|------|----------|
| Meta 스펙 준수 | 10점 | headline ≤40자(5점), primaryText ≤125자(3점), description ≤30자(2점) |
| CTA 존재 | 5점 | callToAction 필드 비어있지 않으면 5점 |
| 키워드 반영율 | 10점 | 입력 키워드 중 카피에 포함된 비율 × 10 |
| Hook 존재 | 5점 | 생성된 카피에서 식별 가능한 hook 패턴이 존재하는지 (urgency: 시간/한정 표현, social_proof: 숫자/후기 표현, benefit: 이점 표현 등). hook 종류 무관, 패턴 존재 시 5점 |
| 변형 다양성 | 10점 | 생성된 카피 변형들 간의 Jaccard similarity 평균. baseline은 자기 자신만 있으므로 10점 고정. 이후 변형은 bestVariant의 카피와 비교: < 0.3 → 10점, 0.3~0.6 → 5점, > 0.6 → 0점 |

### 3.2 LLM Judge (60점 만점)

5개 차원 × 12점씩:

| 차원 | 설명 |
|------|------|
| 주의 끌기 (Attention) | 스크롤을 멈추게 하는 힘 |
| 행동 유도 (Action) | 클릭/구매로 이어지는 힘 |
| 타겟 적합도 (Relevance) | 타겟 오디언스와의 부합도 |
| 감정 호소 (Emotion) | 감정적 반응을 유발하는 힘 |
| 명확성 (Clarity) | 메시지가 즉시 이해되는 정도 |

**설정**:
- model: `gpt-4o-mini`
- temperature: `0` (재현 가능)
- 앵커 캘리브레이션: 12점/6점/2점 예시 각 1개씩 프롬프트에 포함
- 평가 호출 흐름: 매 반복마다 1회 평가 → score가 bestScore 초과 시 추가 2회 호출 → 3회 중앙값으로 최종 keep/discard 결정
- LLM Judge 토큰도 총 토큰 예산에 포함

### 3.3 최종 점수

```
total_score = rule_score(0~40) + llm_score(0~60) = 0~100
```

점수가 높을수록 좋음. keep/discard 기준은 현재 bestScore 대비 개선 여부.

---

## 4. 프롬프트 변형 생성기 (`PromptLabMutator`)

### 4.1 변형 축 (Mutation Axes)

| 축 | 변형 범위 | 예시 |
|---|---|---|
| Science Context 조합 | 9개 도메인 중 3~9개 선택 (최소 3개, `MIN_REQUIRED_DOMAINS` 제약) | `[neuromarketing, copywriting_psychology, meta_best_practices]` |
| Few-shot 예시 전략 | `industry` / `hook` / `topPerformer` | hook별 예시로 교체 |
| Temperature | 0.3 ~ 1.0 (0.1 단위) | 0.8 → 0.6 |
| 시스템 프롬프트 역할 | 전문 마케터 / 소비자 심리 전문가 / 데이터 분석가 | 역할 지시 변경 |
| 지시 강도 | `strict` / `moderate` / `loose` | "반드시 숫자를 포함" vs "자연스럽게 작성" |

### 4.2 변형 전략

- **한 번에 1개 축만 변형** (동시 2개 이상 변경 금지)
- 변형 이유를 `description`에 기록
- 동일 점수면 더 단순한 쪽이 승리 (단순함 = baseline 대비 변경된 축의 수가 적은 쪽, autoresearch 원칙)

### 4.3 PromptVariant 타입

```typescript
interface PromptVariant {
  id: string
  scienceDomains: KnowledgeDomain[]
  temperature: number
  fewShotStrategy: 'industry' | 'hook' | 'topPerformer'
  systemRole: string
  instructionStyle: 'strict' | 'moderate' | 'loose'
  description: string
}
```

---

## 5. 실험 루프 (`PromptLabService`)

### 5.1 루프 흐름

```
입력: PromptLabConfig {
  industry: Industry
  maxDurationMs: number        // 사용자가 직접 지정 (제한 없음), autoresearch의 TIME_BUDGET에 해당
  maxTokenBudget: number       // 기본 500_000 (1시간 기준 ~600회 × ~800토큰)
  maxConsecutiveCrashes: number // 기본 3
  sampleInput: GenerateAdCopyInput & { industry: Industry }
  // NOTE: 기존 EnhancedAdCopyInput(adCopyGeneration.ts)에 industry 필드 있음.
  // PromptLabConfig.industry와 sampleInput.industry는 동일해야 함.
}

1. baseline 실행 (현재 기본 프롬프트 그대로)
2. LOOP (시간이 남는 동안 계속, autoresearch의 LOOP FOREVER와 동일):
   a. 현재 bestVariant 확인
   b. PromptLabMutator가 1개 축 변형 → 새 PromptVariant
   c. 변형된 프롬프트로 AIService.generateAdCopy() 실행
   d. PromptLabEvaluator로 결과 채점
   e. results에 기록
   f. score > bestScore → keep (best 갱신)
   g. score ≤ bestScore → discard (이전 best 유지)

출력: PromptLabReport {
  bestVariant: PromptVariant
  bestScore: number
  baselineScore: number
  results: PromptLabResult[]
  totalTokensUsed: number
  improvementFromBaseline: number  // %
}
```

### 5.2 autoresearch 1:1 매핑

| autoresearch | PromptLabService |
|---|---|
| `TIME_BUDGET = 300` (5분) | `maxDurationMs = 3_600_000` (1시간) |
| `LOOP FOREVER` (시간 소진까지) | `while (elapsed < maxDurationMs)` |
| `git commit` | `PromptVariant` 객체 생성 |
| `uv run train.py > run.log` | `AIService.generateAdCopy(variant)` |
| `grep "^val_bpb:" run.log` | `PromptLabEvaluator.evaluate(result)` |
| `results.tsv`에 기록 | `results[]`에 push |
| val_bpb 개선 → branch 유지 | score 개선 → bestVariant 갱신 |
| val_bpb 악화 → git reset | score 악화 → discard |
| 첫 실행은 항상 baseline | 첫 실행은 기본 프롬프트 그대로 |

### 5.3 토큰 사용량 추적

OpenAI API 응답의 `usage.total_tokens` 필드로 측정. `AIService.chatCompletion()`의 반환값에 `tokenUsage?: number`를 추가하거나, 별도 래퍼에서 추출. LLM Judge 호출 토큰도 합산하여 `maxTokenBudget` 대비 체크.

> 토큰 추적이 불가능한 경우 (mock 등): 프롬프트 길이 + maxTokens 설정값으로 보수적 추정.

### 5.4 크래시 처리

- LLM 응답 파싱 실패 → `status: 'crash'`, score: 0 기록, 다음 변형 시도
- API 에러 → 1초 대기 후 1회 재시도, 실패 시 crash 기록 후 계속

---

## 6. 결과 저장 및 활용

### 6.1 결과 기록 구조

```typescript
interface PromptLabResult {
  id: string
  variantId: string
  industry: Industry
  score: number          // 0-100
  ruleScore: number      // 0-40
  llmScore: number       // 0-60
  status: 'keep' | 'discard' | 'crash'
  description: string
  generatedCopy: AdCopyVariant[]
  tokenUsage: number
  createdAt: Date
}
```

### 6.2 저장 방식

- 단기: 메모리 내 (실험 세션 동안)
- 장기: Vercel KV (key: `prompt-lab:{industry}:{date}`, value: JSON)
  - Vercel은 read-only 파일시스템이므로 로컬 파일 저장 불가
  - 개발 환경: `Map<string, PromptLabResult[]>` 인메모리 폴백
  - KV 미설정 시에도 실험 자체는 동작 (결과만 메모리에 유지, 세션 종료 시 소실)
- DB 테이블 없음 (가치 입증 후 승격)

### 6.3 최적 결과 활용

```
실험 완료 → bestVariant를 PromptLabCache에 저장
  → ScienceAIService.enrichAdCopyInput() 호출 시
    → PromptLabCache에서 industry별 bestVariant 조회
    → 있으면 해당 설정 적용, 없으면 기존 기본값

적용 조건: 관리자가 명시적으로 "적용" (자동 적용 아님)
```

### 6.4 기존 코드 수정 범위

`ScienceAIService.enrichAdCopyInput()` **한 곳만** 수정. 나머지는 전부 새 파일.

---

## 7. 안전장치

### 7.1 비용 안전장치

| 장치 | 기본값 | 동작 |
|------|--------|------|
| 시간 상한 | 사용자 지정 (제한 없음) | 시간 소진 시 즉시 중단, 현재 best 반환 |
| 토큰 상한 | 없음 (시간 기반 제어) | 시간만으로 제어 |
| 연속 실패 제한 | 3 | 3연속 crash → 루프 중단 |

### 7.2 품질 안전장치

| 장치 | 기준 | 동작 |
|------|------|------|
| 변형 품질 하한선 | 개별 변형의 score < baseline × 0.8 | 해당 변형 즉시 discard (bestScore와 무관하게 품질이 너무 낮은 변형 차단) |
| 규칙 최소 통과 | ruleScore < 20 | LLM 평가 스킵, crash 처리 |

### 7.3 서비스 격리

- 실험 중에도 일반 카피 생성은 기존 설정으로 정상 동작
- bestVariant 반영은 실험 완료 + 관리자 명시적 적용 후에만

---

## 8. 호출 방식

```
1. API: POST /api/prompt-lab/run
   Body: { industry, maxIterations?, maxTokenBudget?, sampleInput }
   Response: PromptLabReport

2. 챗봇 도구: runPromptLab.tool.ts
   에이전트가 "이커머스 프롬프트 최적화 돌려줘"로 호출

3. 관리자 대시보드: 산업 선택 → 실행 버튼
```

---

## 9. 비용 예측

| 항목 | 산업당 1시간 기준 |
|------|------------------|
| 예상 반복 | ~100회 (36초/회, 의도적 간격) |
| 반복당 토큰 | ~800 (생성 ~500 + 평가 ~300) |
| 3회 중앙값 추가 (keep 시) | ~100 × 추정 keep 비율 20% × 추가 2회 × 300 = ~12K |
| **합계** | **~92K 토큰** |
| **비용 (gpt-4o-mini 기준)** | **~$0.20/시간** |

8시간 수면 중 돌리면: ~800회, ~$1.60 (~2,100원).
