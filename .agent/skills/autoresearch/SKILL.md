---
name: autoresearch
description: "Karpathy의 autoresearch 패턴을 프로젝트 내 모든 최적화 문제에 적용하는 자율 실험 루프. 키워드: optimize, autoresearch, 최적화, 실험, 임계값, threshold, tune, eval, 정확도, F1, baseline. 사용: /autoresearch [대상] [시간]"
---

# Autoresearch: 자율 실험 루프 스킬

> Inspired by [karpathy/autoresearch](https://github.com/karpathy/autoresearch)
> "give an AI agent a small but real setup and let it experiment autonomously"

## 핵심 원칙

autoresearch의 3파일 구조를 모든 최적화 문제에 매핑:

```
prepare.py (불변)  → eval set + evaluate() 함수
train.py (수정)    → 튜닝 대상 파라미터/데이터
program.md (지시)  → 이 스킬 자체
```

## 적용 조건 체크리스트

시작 전 반드시 확인:

- [ ] **객관적 메트릭이 있는가?** — 정확도 %, F1, 정답 비교 등 수학적으로 측정 가능해야 함
- [ ] **LLM-as-Judge가 아닌가?** — LLM이 LLM을 평가하면 val_vibes이지 val_bpb가 아님. 비추천.
- [ ] **결정적인가?** — 같은 입력 → 같은 결과. 랜덤 요소는 시드 고정.
- [ ] **비용이 합리적인가?** — $0 (순수 계산) 또는 저비용 API 호출

❌ 하나라도 No면 autoresearch 패턴에 부적합. 다른 접근 사용.

## 실행 프로세스

### Phase 1: 적합성 판단

사용자가 "최적화해줘"라고 하면:

1. **대상 시스템 탐색** — 코드 읽기, 파라미터 식별
2. **메트릭 확인** — 객관적 측정 가능한 수치가 있는지
3. **적합성 판단** — 위 체크리스트 확인
4. **사용자에게 보고** — "이건 autoresearch로 가능/불가능합니다. 이유: ..."

### Phase 2: 3파일 매핑

| autoresearch | 우리 프로젝트 | 설명 |
|---|---|---|
| `prepare.py` | eval set + evaluate() | 불변. 절대 수정 안 함 |
| `train.py` | 튜닝 대상 | 파라미터, 키워드, 문서 내용 등 |
| `results.tsv` | 실험 로그 | status, score, description |
| `evaluate_bpb` | 단일 스칼라 메트릭 | accuracy, F1, Top-1 등 |

### Phase 3: Eval Set 생성

1. **Easy/Medium/Hard 3등급** — 쉬운 것만 있으면 개선 여지 측정 불가
2. **80/20 Train/Validation Split** — 과적합 방지
3. **정답 라벨링** — 사람이 정답을 정해야 함 (이게 prepare.py)
4. **불변 선언** — "이 eval set은 실험 중 절대 수정하지 않습니다"

### Phase 4: Baseline 측정

```
[Baseline] metric=XX.X%
  easy:   YY.Y%
  medium: ZZ.Z%
  hard:   WW.W%
```

baseline 없이 최적화 시작하지 않음. 이게 첫 번째 results.tsv 행.

### Phase 5: 실험 루프

```
LOOP (시간 소진까지):
  1. 현재 best 확인
  2. 1개 축만 변형 (autoresearch: "single file to modify")
  3. eval set 전체 실행
  4. metric 측정
  5. 개선 → keep, 악화 → discard
  6. 동일 metric + 더 단순 → keep (simplicity wins)
  7. 결과 기록
```

**NEVER STOP** — 시간이 남으면 계속. 사용자가 멈출 때까지.

### Phase 6: 결과 보고

```
=== 결과 ===
baseline: XX.X%
최적:     YY.Y% (+Z.Z%)
validation: WW.W% (과적합 체크)

=== 변경 사항 ===
param1: old → new
param2: old → new

=== 실패 케이스 (N개) ===
...
```

### Phase 7: 반영 판단

- validation이 train 대비 10%p 이상 낮으면 → 과적합 경고
- 기존 테스트 깨지면 → discard (regression)
- 개선이 오차 범위면 → 반영 비추천 (Prompt Lab 교훈)

## 성공/실패 사례 (이 프로젝트에서 검증됨)

### ✅ 성공한 케이스

| 대상 | 메트릭 | 결과 | 비용 | 왜 성공? |
|------|--------|------|------|---------|
| IntentClassifier 키워드 | 정확도 | 70→91% | $0 | 정답 비교, 결정적, 순수 계산 |
| RAG 문서 검색 | Top-1 정확도 | 51→91% | $0.002 | 정답 문서 비교, 임베딩 비용 저렴 |
| 이상치 탐지 임계값 | F1 score | 85→93% | $0 | 통계적 메트릭, 합성 데이터 |

### ❌ 실패/한계 케이스

| 대상 | 메트릭 | 결과 | 왜 한계? |
|------|--------|------|---------|
| 광고 카피 프롬프트 | LLM-as-Judge | 3.8% (오차 범위) | 주관적 평가, val_vibes |
| 보고서 품질 | — | 테스트 불가 | 정답 없음, LLM 생성물 |

### 교훈

> **"The metric is val_bpb" — 메트릭이 수학적이지 않으면 autoresearch가 아니다.**

## 변형 전략 가이드

### 파라미터 튜닝 (수치 최적화)

```
적용: 임계값, 가중치, 윈도우 크기 등
방법: ±step 랜덤 변형, grid search
예시: zScore 2.5 → 2.3, IQR 1.5 → 1.6
주의: 범위 제한 필수 (min/max)
```

### 키워드/패턴 최적화 (이산 최적화)

```
적용: IntentClassifier 키워드맵, 정규식 패턴
방법: 추가/제거/교체 (한 번에 1개)
주의: 최소 개수 보장 (키워드 ≥2, 패턴 ≥1)
팁: 실패 케이스에서 후보 추출 → 2배 가중치
```

### 문서 내용 최적화 (자연어 최적화)

```
적용: RAG 문서, 지식 베이스 콘텐츠
방법: 수동 수정 → 재임베딩 → 재측정 (자동화 어려움)
주의: regression 체크 필수 (easy 깨지면 discard)
팁: 실패 케이스의 쿼리 표현을 문서에 포함
```

## 기존 실행 스크립트

```bash
# 인텐트 분류 최적화 ($0, 시간당 ~88만 회)
npx tsx scripts/run-intent-lab.ts [duration_ms]

# RAG 검색 정확도 측정 ($0.002)
npx tsx scripts/eval-rag-baseline.ts

# RAG 문서 재인제스트
npx tsx scripts/ingest-knowledge.ts

# 이상치 임계값 최적화 ($0, 30초 14만 회)
npx tsx scripts/eval-anomaly-baseline.ts [duration_sec]

# 광고 카피 프롬프트 (비추천 — LLM-as-Judge)
npx tsx scripts/run-prompt-lab.ts
```

## 새로운 최적화 대상 추가하기

1. **eval set 만들기** — `scripts/eval-{name}-baseline.ts`
   - 입력/정답 쌍 50~100개
   - 80/20 split
   - evaluate() 함수: 단일 스칼라 반환

2. **mutator 만들기** — 파라미터 1개씩 변형
   - 범위 제한
   - 최소값 보장
   - description 기록

3. **runner 만들기** — baseline → loop → report
   - 시간 기반 종료
   - keep/discard 로직
   - simplicity 기준

4. **baseline 측정 → 최적화 → 기존 테스트 확인 → 반영**

## 적용 불가 영역 (이 프로젝트 기준)

현재 실제 광고 데이터가 없어서 불가:
- 도메인 가중치 (CompositeScore) — 광고 성과 데이터 필요
- 예산 추천 정확도 — 30일 추적 데이터 필요
- 캘린더 영향도 — 시즌별 실측 데이터 필요
- 카피 학습 신뢰도 — A/B 테스트 데이터 필요

**데이터가 쌓이면 동일한 패턴으로 즉시 적용 가능.**
