---
name: verify-domain-analyzers
description: MarketingScience에 선언된 지식 도메인들이 각각의 분석기(Analyzer) 클래스를 가지고 있으며 KnowledgeBaseService 레지스트리에 빠짐없이 의존성 주입이 되어 있는지, 도메인 가중치의 합이 1.0인지 검증합니다.
---

# 도메인 분석기 검증

## 목적

1. `MarketingScience.ts`의 `KnowledgeDomain`에 추가된 도메인들이 각각 적합한 분석기(Analyzer)를 보유하는지 확인합니다
2. `DEFAULT_DOMAIN_WEIGHTS` 맵에 정의된 가중치들의 종합 합산이 정확히 `1.0`인지 검사하여 통계 에러 방지합니다
3. `KnowledgeBaseService.ts` 에 모든 도메인의 분석기가 오케스트레이션(레지스트리)로 등록(new) 되었는지 확인합니다

## 언제 실행하는가 (When to Run)

- `MarketingScience.ts`의 코어나 벤치마크 모델을 변경한 경우 (새로운 비즈니스 로직 추가)
- 도메인 분석기 클래스를 생성/이동한 경우
- 가중치를 재조정한 경우

## Related Files

| 파일 경로 | 파일 목적 |
|-----------------------------------------------|--------------------------------------------------|
| `src/domain/value-objects/MarketingScience.ts` | 도메인 Enum, 가중치 (Weights), 점수 관련 핵심 로직 |
| `src/infrastructure/knowledge/analyzers/**` | 지식 도메인 기반 전문 분석기 컴포넌트들 |
| `src/infrastructure/knowledge/KnowledgeBaseService.ts` | 분석기 오케스트레이션 메인 컨트롤러 |

## Workflow

### Step 1: KnowledgeDomain 목록 추출
**도구:** `read_file` (또는 로컬 스크립트 기반)
**경로:** `src/domain/value-objects/MarketingScience.ts`
**조건:** `export type KnowledgeDomain = ...` 블록 혹은 `ALL_KNOWLEDGE_DOMAINS` 배열 내의 모든 도메인(e.g., `creative_diversity`, `campaign_structure`) 추출.

### Step 2: Analyzer 구현체 존재 여부 검증
**경로:** `src/infrastructure/knowledge/analyzers/*.ts`
**검사:**
- 추출한 각 도메인 이름 중 매칭되는 기능을 하는 Analyzer 클래스 구현 파일이 존재하는지 검증 (예: `creative_diversity` -> `CreativeDiversityAnalyzer.ts`)
**통과 기준:** 각각의 도메인이 자신만의 분석기를 가짐.

### Step 3: KnowledgeBaseService 레지스트리 등록 검증
**경로:** `src/infrastructure/knowledge/KnowledgeBaseService.ts`
**검사:**
- `KnowledgeBaseService` 클래스 생성자나 `analyzers` Map 등록 과정에서, Step 1의 모든 도메인 키가 `this.analyzers.set()` 등에 선언되어 있는지 확인.
**통과 기준:** 누락된 도메인/분석기 세트가 없어야 함.

### Step 4: 가중치(Weights) 1.0 합산 검증
**경로:** `src/domain/value-objects/MarketingScience.ts`
**검사:**
- `DEFAULT_DOMAIN_WEIGHTS` 객체의 값들을 Float으로 추출하여 정밀도 문제 없이(0.0001 이내) 합이 1.0인지 검증.
**통과 기준:** 합산 오류(예: 1.2 등)가 없어야 함.

## Output Format

| 검증 항목 | 대상 | 결과 (통과 여부) | 문제 / 확인된 갭 |
|---------------------|--------------------------------|------------------|-----------------------|
| 1. Analyzer 존재성 | `src/infrastructure/knowledge/analyzers/` | PASS / FAIL | - |
| 2. Orchestration 등록 | `KnowledgeBaseService.ts` | PASS / FAIL | `tracking_health` 등록 누락 |
| 3. Weights Validation | `MarketingScience.ts` | PASS / FAIL | 1.0을 초과함 (1.15) |

## Exceptions

다음 조건에서는 FAIL로 간주하지 않습니다:
- **실험용/기능 닫힘 도메인:** 분석기 구현을 일시 중단하고 빈 분석기(EmptyAnalyzer) 등을 더미로 엮어놓은 경우 (단, 의도적이라는 주석과 가중치 0.0 필수).
