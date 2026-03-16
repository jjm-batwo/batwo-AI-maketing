# Intent Lab: Autoresearch-Inspired Intent Classifier Optimization

> **Status**: Draft
> **Date**: 2026-03-16
> **Inspired by**: [karpathy/autoresearch](https://github.com/karpathy/autoresearch)
> **Predecessor**: Prompt Lab (광고 카피 최적화 — LLM-as-Judge 한계 확인)

## 1. 개요

autoresearch의 자율 실험 루프를 IntentClassifier 최적화에 적용한다. Prompt Lab과 달리 **100% 객관적 평가**(정답 비교)를 사용하며, LLM 호출 없이 **비용 $0, 1회 실행 < 100ms**.

### Prompt Lab과의 차이

| | Prompt Lab (카피) | Intent Lab (분류) |
|---|---|---|
| 평가 | LLM-as-Judge (주관적) | 정답 비교 (객관적) |
| 비용 | ~$0.20/시간 | **$0** |
| 1회 속도 | ~6초 | **< 100ms** |
| 시간당 반복 | ~100회 | **수천 회** |
| 유의미성 | 3.8% 개선 (오차 범위) | **수학적으로 정확** |

### autoresearch 패턴 매핑

| autoresearch | Intent Lab |
|---|---|
| `prepare.py` (불변) | `IntentLabEvalSet` — 100개 테스트 케이스 (절대 수정 안 함) |
| `evaluate_bpb` | `accuracy = 맞은 개수 / 전체 개수` |
| `train.py` (수정 대상) | `KEYWORD_MAP`, `LLM_CONTEXT_MAP`, 임계값 |
| `results.tsv` | 실험 결과 누적 기록 |
| `LOOP FOREVER` | 시간 기반 무한 반복 |
| `val_bpb` lower is better | `accuracy` higher is better (1.0 = 100%) |

---

## 2. 파일 배치

```
domain/services/
  └─ IntentClassifier.ts           ← 기존 파일, config 주입 리팩터링 필요
  └─ IntentClassifierConfig.ts     ← NEW: 키워드맵/패턴맵/임계값 config 타입 + 기본값

application/intent-lab/
  └─ IntentLabEvalSet.ts           ← 불변 평가 세트 (= prepare.py + evaluate_bpb)
  └─ IntentLabMutator.ts           ← config 변형기
  └─ IntentLabRunner.ts            ← 실험 루프 오케스트레이터

scripts/
  └─ run-intent-lab.ts             ← CLI 실행 스크립트
```

### 2.1 IntentClassifier 리팩터링 (전제 조건)

현재 `IntentClassifier`는 private constructor + 모듈 레벨 const로 키워드맵이 고정됨. 실험 루프가 동작하려면 config 주입이 필요:

```typescript
// IntentClassifierConfig.ts
export interface IntentClassifierConfig {
  keywordMap: Record<ChatIntent, string[]>
  contextMap: Record<ChatIntent, string[]>
  ambiguityThreshold: number    // 현재 2.0
  singleMatchConfidence: number // 현재 0.6
  llmConfidenceCoeff: number    // 현재 0.05
}

export const DEFAULT_CONFIG: IntentClassifierConfig = { ... 현재 값 그대로 }

// IntentClassifier.ts 수정
static create(config?: IntentClassifierConfig): IntentClassifier {
  return new IntentClassifier(config ?? DEFAULT_CONFIG)
}
```

기존 호출자(`IntentClassifier.create()`)는 변경 없이 동작.

---

## 3. 불변 평가 세트 (`IntentLabEvalSet`)

autoresearch의 `prepare.py` + `evaluate_bpb`에 해당. **절대 수정 안 함**.

### 3.1 테스트 케이스 구조

```typescript
interface EvalCase {
  input: string           // 사용자 메시지
  expected: ChatIntent    // 정답 인텐트
  difficulty: 'easy' | 'medium' | 'hard'
}
```

### 3.2 테스트 케이스 (100개, 3등급)

#### Easy (~30개) — 직접 키워드 포함

| input | expected |
|-------|----------|
| "캠페인 만들어줘" | CAMPAIGN_CREATION |
| "새 캠페인 시작하고 싶어" | CAMPAIGN_CREATION |
| "create a new campaign" | CAMPAIGN_CREATION |
| "리포트 보여줘" | REPORT_QUERY |
| "주간 보고서 보기" | REPORT_QUERY |
| "ROAS 분석해줘" | KPI_ANALYSIS |
| "CPC가 너무 높아" | KPI_ANALYSIS |
| "전환율 확인" | KPI_ANALYSIS |
| "픽셀 설치 도와줘" | PIXEL_SETUP |
| "페이스북 픽셀 설정" | PIXEL_SETUP |
| "예산 최적화 해줘" | BUDGET_OPTIMIZATION |
| "광고 예산 조정" | BUDGET_OPTIMIZATION |
| "피로도 확인해줘" | CREATIVE_FATIGUE |
| "광고 노출 빈도가 높아" | CREATIVE_FATIGUE |
| "학습단계가 안 끝나" | LEARNING_PHASE |
| "예산이 소진이 안 돼" | LEARNING_PHASE |
| "캠페인 구조 통합하고 싶어" | STRUCTURE_OPTIMIZATION |
| "세트 개수가 너무 많아" | STRUCTURE_OPTIMIZATION |
| "리드 품질이 안 좋아" | LEAD_QUALITY |
| "허수 고객이 많아" | LEAD_QUALITY |
| "CAPI 설정해야해" | TRACKING_HEALTH |
| "전환 추적이 안 돼" | TRACKING_HEALTH |
| "안녕하세요" | GENERAL |
| "오늘 날씨 어때?" | GENERAL |
| "고마워" | GENERAL |
| "뭐 할 수 있어?" | GENERAL |

#### Medium (~35개) — 간접 표현, 키워드 없음

| input | expected |
|-------|----------|
| "매출을 올려야 하는데 뭐부터 해야 해?" | CAMPAIGN_CREATION |
| "새로운 고객을 찾아야 해" | CAMPAIGN_CREATION |
| "광고를 시작하려고" | CAMPAIGN_CREATION |
| "지난 달 데이터 좀 살펴봐줘" | REPORT_QUERY |
| "실적이 어떻게 됐는지 확인해줘" | REPORT_QUERY |
| "이번 주 실적 궁금해" | REPORT_QUERY |
| "광고 효율이 어떤가요?" | KPI_ANALYSIS |
| "지표가 좀 이상해" | KPI_ANALYSIS |
| "대비 효율이 떨어졌어" | KPI_ANALYSIS |
| "광고비가 너무 나가" | BUDGET_OPTIMIZATION |
| "비용 좀 줄여야겠어" | BUDGET_OPTIMIZATION |
| "돈을 아껴야 해" | BUDGET_OPTIMIZATION |
| "같은 광고가 계속 보여" | CREATIVE_FATIGUE |
| "CPM이 급등했어" | CREATIVE_FATIGUE |
| "소재를 교체해야 할까?" | CREATIVE_FATIGUE |
| "광고가 안 나가" | LEARNING_PHASE |
| "돈이 안 써져" | LEARNING_PHASE |
| "노출이 나오질 않아" | LEARNING_PHASE |
| "캠페인이 너무 많아" | STRUCTURE_OPTIMIZATION |
| "광고를 정리하고 싶어" | STRUCTURE_OPTIMIZATION |
| "너무 분산돼 있어" | STRUCTURE_OPTIMIZATION |
| "가짜 고객이 많아" | LEAD_QUALITY |
| "전화해도 연락이 안 돼" | LEAD_QUALITY |
| "양질의 리드가 필요해" | LEAD_QUALITY |
| "전환이 안 잡혀" | TRACKING_HEALTH |
| "이벤트가 누락되는 것 같아" | TRACKING_HEALTH |
| "서버 이벤트가 안 와" | TRACKING_HEALTH |
| "그냥 인사하러 왔어" | GENERAL |
| "잘 모르겠어" | GENERAL |
| "음..." | GENERAL |

#### Hard (~35개) — 모호, 복합, 실제 사용자 표현

| input | expected | 모호 이유 |
|-------|----------|-----------|
| "광고 좀 해줘" | CAMPAIGN_CREATION | "광고"만으론 여러 인텐트 가능 |
| "뭔가 좀 해봐야 할 것 같은데" | GENERAL | 너무 모호 |
| "요즘 반응이 안 좋아" | KPI_ANALYSIS | "반응"이 뭔지 불분명 |
| "전환이 안 나와요 추적 문제인가" | TRACKING_HEALTH | KPI vs TRACKING 모호 |
| "같은 사람한테 자꾸 광고가 떠" | CREATIVE_FATIGUE | 빈도 문제 암시 |
| "돈은 쓰는데 결과가 없어" | KPI_ANALYSIS | 예산 vs 성과 모호 |
| "새로 시작하고 싶은데 어떻게?" | CAMPAIGN_CREATION | "시작"이 캠페인인지 모호 |
| "숫자가 안 맞아" | TRACKING_HEALTH | 추적 불일치 암시 |
| "광고가 멈춰버렸어" | LEARNING_PHASE | 학습 단계 정체 |
| "성과가 갑자기 확 떨어졌어" | KPI_ANALYSIS | 이상치 감지 |
| "다 합쳐버릴까?" | STRUCTURE_OPTIMIZATION | 구조 통합 암시 |
| "진짜 고객인지 모르겠어" | LEAD_QUALITY | 리드 품질 암시 |
| "머신러닝이 아직 안 된 건가" | LEARNING_PHASE | 학습단계 우회 표현 |
| "우리 광고 잘 되고 있어?" | KPI_ANALYSIS | 성과 확인 |
| "광고 끄고 싶어" | GENERAL | 캠페인 중지 의도, 생성 아님 |
| "캠페인을 만들지 마세요" | GENERAL | 부정문 — 캠페인 생성 아님 |
| "비용 대비 효과가 좀..." | KPI_ANALYSIS | 불완전한 문장 |
| "요즘 왜 이래" | GENERAL | 완전히 모호 |
| "데이터 좀 봐줘" | REPORT_QUERY | 데이터=리포트 |
| "엊그제부터 이상해" | KPI_ANALYSIS | 이상치 암시 |
| "소재 좀 바꿔야겠다" | CREATIVE_FATIGUE | 소재 교체 |
| "예산을 더 넣을까 말까" | BUDGET_OPTIMIZATION | 예산 고민 |
| "문의 건이 이상한 게 많아" | LEAD_QUALITY | 허수 리드 |
| "구글 태그매니저에서 이벤트가..." | TRACKING_HEALTH | GTM→추적 |
| "광고 좀 더 해볼까" | CAMPAIGN_CREATION | 확장 의도 |
| "전환이 줄었어" | KPI_ANALYSIS | 성과 하락 |
| "학습이 끝나질 않아" | LEARNING_PHASE | 직접적 |
| "새 소재 넣어야 하나" | CREATIVE_FATIGUE | 소재 교체 암시 |
| "타겟이 너무 좁은 거 아냐?" | STRUCTURE_OPTIMIZATION | 구조 문제 암시 |
| "이거 왜 안 되지?" | GENERAL | 완전히 모호 |

### 3.3 평가 함수

```typescript
function evaluate(classifier: IntentClassifier, evalSet: EvalCase[]): EvalResult {
  let correct = 0
  const failures: { input: string; expected: ChatIntent; got: ChatIntent }[] = []

  for (const { input, expected } of evalSet) {
    const result = classifier.classify(input)
    if (result.intent === expected) {
      correct++
    } else {
      failures.push({ input, expected, got: result.intent })
    }
  }

  return {
    accuracy: correct / evalSet.length,
    correct,
    total: evalSet.length,
    failures,
  }
}
```

autoresearch의 `evaluate_bpb`와 동일:
- 입력: 모델 (classifier)
- 출력: 단일 숫자 (accuracy)
- **불변** — 이 함수와 eval set은 절대 수정하지 않음

### 3.4 과적합 방지: Train/Validation Split

100개 케이스를 80/20으로 분리:
- **Train set (80개)**: 최적화 루프에서 accuracy 측정에 사용
- **Validation set (20개)**: 최적화 중 접근 안 함, 최종 결과 검증용

최종 보고 시 train accuracy와 validation accuracy를 모두 출력.
validation accuracy가 train 대비 10%p 이상 낮으면 과적합 경고.

### 3.5 난이도별 정확도 보고

```
overall: 87% (87/100)
  easy:   96% (29/30)
  medium: 86% (30/35)
  hard:   80% (28/35)
```

난이도별 세분화하여 hard 케이스 개선 여부를 명확히 추적.

---

## 4. 수정 대상 (= train.py)

IntentClassifier.ts에서 수정 가능한 것:

### 4.1 변형 축

| 축 | 현재 값 | 변형 범위 |
|---|---|---|
| KEYWORD_MAP 키워드 추가 | 인텐트당 4~13개 | 키워드 1개 추가 |
| KEYWORD_MAP 키워드 제거 | — | 키워드 1개 제거 (최소 2개 유지) |
| LLM_CONTEXT_MAP 패턴 추가 | 인텐트당 3~4개 | 패턴 1개 추가 |
| LLM_CONTEXT_MAP 패턴 제거 | — | 패턴 1개 제거 (최소 1개 유지) |
| 모호성 임계값 | 2.0 (100%) | 1.5 ~ 3.0 |
| 단일 매치 신뢰도 | 0.6 | 0.4 ~ 0.8 |
| LLM 신뢰도 계수 | 0.05 | 0.03 ~ 0.10 |

### 4.2 변형 전략

autoresearch 원칙: **한 번에 1개만 변형**

- 키워드 추가: eval set의 failure에서 패턴을 추출하여 후보 생성
- 키워드 제거: 매칭에 기여하지 않는 키워드 식별 후 제거
- 임계값 조정: ±0.1 단위

### 4.3 단순함 기준

autoresearch: "동일 성능이면 더 단순한 쪽이 승리"
→ 동일 accuracy면 **키워드/패턴 수가 적은 쪽이 승리**

---

## 5. 실험 루프 (`IntentLabRunner`)

### 5.1 루프 흐름

```
입력: IntentLabConfig {
  maxDurationMs: number         // 사용자 지정
  iterationDelayMs: number      // 기본 0 (비용 $0이므로 delay 불필요)
  maxConsecutiveCrashes: number  // 기본 3
}

1. baseline 실행 (현재 KEYWORD_MAP 그대로)
2. LOOP (시간 소진까지):
   a. IntentLabMutator가 1개 축 변형 → 새 키워드맵/패턴맵/임계값
   b. 변형된 classifier로 eval set 전체 실행
   c. accuracy 측정
   d. accuracy > bestAccuracy → keep (키워드맵 갱신)
   e. accuracy ≤ bestAccuracy → discard
   f. accuracy == bestAccuracy && 더 단순 → keep (단순함 승리)

출력: IntentLabReport {
  bestKeywordMap: Record<ChatIntent, string[]>
  bestContextMap: Record<ChatIntent, string[]>
  bestThresholds: { ambiguity: number; singleMatch: number; llmCoeff: number }
  bestAccuracy: number
  baselineAccuracy: number
  results: IntentLabResult[]
  totalDurationMs: number
  totalIterations: number
  improvementFromBaseline: number  // %
  failures: { input: string; expected: ChatIntent; got: ChatIntent }[]
}
```

### 5.2 실행 특성

| 항목 | 값 |
|------|-----|
| 1회 실행 시간 | < 100ms (eval 100개 × 키워드 매칭) |
| LLM 호출 | 0 |
| 비용 | $0 |
| 5분 실행 시 | ~3,000회 이상 |
| 1시간 실행 시 | ~36,000회 이상 |

---

## 6. 결과 적용

실험 완료 후 최적 KEYWORD_MAP/LLM_CONTEXT_MAP을 **IntentClassifier.ts에 직접 반영**.

```
IntentLabRunner 완료
  → bestKeywordMap, bestContextMap, bestThresholds 출력
  → IntentClassifier.ts 코드 업데이트 (수동 또는 자동)
  → 기존 테스트(429줄) 재실행하여 regression 없음 확인
  → 커밋
```

---

## 7. 안전장치

| 장치 | 동작 |
|------|------|
| baseline 하한선 | accuracy < baseline × 0.95 → 즉시 discard |
| 키워드 최소 개수 | 인텐트당 최소 2개 유지 |
| 패턴 최소 개수 | 인텐트당 최소 1개 유지 |
| 기존 테스트 호환 | 최종 결과는 기존 429줄 테스트도 통과해야 함 |

---

## 8. 비용 예측

| 항목 | 값 |
|------|-----|
| API 비용 | **$0** |
| 5분 실험 | ~3,000회 반복 |
| 1시간 실험 | ~36,000회 반복 |
| 제약 | CPU만 사용 (디스크/네트워크 없음) |
