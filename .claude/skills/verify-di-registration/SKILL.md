---
name: verify-di-registration
description: DI 컨테이너의 토큰 정의와 실제 등록이 동기화되어 있는지 검증합니다. 토큰만 있고 등록이 없거나, 등록만 있고 토큰이 없는 경우를 탐지합니다.
---

# DI 컨테이너 등록 동기화 검증

## Purpose

DI(Dependency Injection) 컨테이너의 일관성을 검증합니다:

1. **토큰 미등록** — `DI_TOKENS`에 정의된 토큰이 `container.ts`에 등록되지 않은 경우
2. **미정의 토큰 사용** — `container.ts`에서 `DI_TOKENS`에 없는 토큰을 사용하는 경우
3. **리포지토리 인터페이스 미등록** — `src/domain/repositories/`에 인터페이스가 있지만 DI 토큰이 없는 경우
4. **포트 인터페이스 미등록** — `src/application/ports/`에 인터페이스가 있지만 DI 토큰이 없는 경우

## When to Run

- 새로운 리포지토리, 유스케이스, 서비스를 추가한 후
- DI 컨테이너를 수정한 후
- 리포지토리 인터페이스나 포트를 추가/삭제한 후

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/di/types.ts` | DI 토큰 정의 (`DI_TOKENS` 객체) |
| `src/lib/di/container.ts` | DI 컨테이너 구현 (토큰별 팩토리 등록) |
| `src/domain/repositories/I*.ts` | 리포지토리 인터페이스 |
| `src/application/ports/I*.ts` | 외부 서비스 포트 인터페이스 |
| `src/domain/repositories/IOptimizationRuleRepository.ts` | 최적화 규칙 리포지토리 인터페이스 |
| `src/application/ports/IFallbackResponseService.ts` | 폴백 응답 서비스 포트 — DI 등록 대상 |
| `src/application/ports/IFewShotExampleRegistry.ts` | 퓨샷 예시 레지스트리 포트 — DI 등록 대상 |
| `src/application/ports/IGuideQuestionService.ts` | 가이드 질문 서비스 포트 — DI 등록 대상 |
| `src/application/ports/IPromptTemplateService.ts` | 프롬프트 템플릿 서비스 포트 — DI 등록 대상 |
| `src/application/ports/IResilienceService.ts` | 복원력 서비스 포트 — DI 등록 대상 |
| `src/application/use-cases/ai/GetFeedbackAnalyticsUseCase.ts` | 피드백 분석 유스케이스 — DI 등록 대상 |
| `src/application/ports/IAuditCache.ts` | 감사 캐시 포트 인터페이스 — 캐시 팩토리 패턴 사용 |
| `src/application/services/KPIInsightsService.ts` | KPI 인사이트 서비스 — DI 등록 대상 (KPIInsightsService 토큰) |

## Workflow

### Step 1: DI_TOKENS에 정의된 토큰 목록 추출

**파일:** `src/lib/di/types.ts`

**검사:** `DI_TOKENS` 객체의 모든 키를 추출합니다.

```bash
grep -oP '^\s+(\w+):\s*Symbol' src/lib/di/types.ts | sed 's/:.*//' | sed 's/^\s*//' | sort
```

**결과:** 토큰 이름 목록

### Step 2: container.ts에서 등록된 토큰 목록 추출

**파일:** `src/lib/di/container.ts`

**검사:** `container.register` 또는 `container.registerSingleton` 호출의 첫 인자 토큰을 추출합니다.

```bash
grep -P 'container\.(register|registerSingleton)\s*[<(]' src/lib/di/container.ts | grep -oP 'DI_TOKENS\.(\w+)' | sed 's/DI_TOKENS\.//' | sort -u
```

**결과:** 등록에 사용된 토큰 이름 목록

### Step 3: 토큰 정의 vs 등록 비교

**검사:** Step 1의 목록과 Step 2의 목록을 비교합니다.

- `types.ts`에만 있는 토큰 = **등록 누락** (에러)
- `container.ts`에서만 사용되는 토큰 = **토큰 미정의** (에러)

**PASS 기준:** 모든 토큰이 양쪽에 존재
**FAIL 기준:** 한쪽에만 존재하는 토큰이 있음

**수정 방법:**
- 미등록 토큰: `container.register` 또는 `container.registerSingleton` 호출 추가
- 미정의 토큰: `types.ts`의 `DI_TOKENS`에 추가
- 사용하지 않는 토큰: 양쪽에서 제거

### Step 4: 리포지토리 인터페이스 파일과 토큰 대조

**검사:** `src/domain/repositories/` 디렉토리의 `I*.ts` 파일 목록과 `DI_TOKENS`의 `*Repository` 토큰을 대조합니다.

```bash
# 리포지토리 인터페이스 파일 목록
ls src/domain/repositories/I*.ts 2>/dev/null | sed 's|.*/I||;s|\.ts||' | sort

# DI_TOKENS의 Repository 토큰 목록
grep -oP '(\w+Repository)' src/lib/di/types.ts | sort
```

**PASS 기준:** 모든 리포지토리 인터페이스에 대응하는 DI 토큰이 존재
**FAIL 기준:** 인터페이스는 있지만 토큰이 없는 경우

**수정 방법:**
1. `src/lib/di/types.ts`에 토큰 추가
2. `src/lib/di/container.ts`에 구현체 등록

### Step 5: 포트 인터페이스와 토큰 대조

**검사:** `src/application/ports/` 디렉토리의 `I*.ts` 파일과 DI 토큰을 대조합니다.

```bash
ls src/application/ports/I*.ts 2>/dev/null | sed 's|.*/I||;s|\.ts||' | sort
```

### New Pattern: Optimization/Audit UseCase Registration Check

**Context:** 최적화 규칙 엔진과 감사 시스템이 추가되면서 새로운 UseCase들이 DI에 등록됨.

**검사:** 다음 UseCase들이 DI에 등록되었는지 확인합니다:
- CreateOptimizationRuleUseCase
- UpdateOptimizationRuleUseCase
- DeleteOptimizationRuleUseCase
- ListOptimizationRulesUseCase
- EvaluateOptimizationRulesUseCase
- AutoOptimizeCampaignUseCase
- CalculateSavingsUseCase
- AuditAdAccountUseCase

```bash
# optimization usecase 등록 확인
grep -n "OptimizationRuleUseCase\|AuditAdAccountUseCase\|CalculateSavingsUseCase" src/lib/di/container.ts
```

**PASS 기준:** 모든 신규 UseCase가 container.register로 등록됨
**FAIL 기준:** 누락된 등록이 있음

---

### New Pattern: Audit/Optimization Repository Token Check

**검사:** IOptimizationRuleRepository 등 신규 리포지토리 인터페이스에 토큰이 정의되었는지 확인

```bash
# 리포지토리 인터페이스 파일 목록
ls src/domain/repositories/I*.ts 2>/dev/null | sed 's|.*/I||;s|\.ts||' | sort

# DI_TOKENS의 Repository 토큰 목록
grep -oP '(\w+Repository)' src/lib/di/types.ts | sort
```

**FAIL 시 수정:**
1. `src/lib/di/types.ts`에 OptimizationRuleRepository 토큰 추가 확인
2. `src/lib/di/container.ts`에 PrismaOptimizationRuleRepository 등록 확인

---

### New Pattern: AI Chatbot Service/UseCase Registration Check

**Context:** AI 챗봇 강화 기능이 추가되면서 새로운 서비스와 UseCase들이 DI에 등록됨.

**검사:** 다음 서비스/UseCase들이 DI에 등록되었는지 확인합니다:
- ResilienceService
- PromptTemplateService
- FallbackResponseService
- FewShotExampleRegistry
- GuideQuestionService
- GetFeedbackAnalyticsUseCase

```bash
# AI chatbot service/usecase 등록 확인
grep -n "ResilienceService\|PromptTemplateService\|FallbackResponseService\|FewShotExampleRegistry\|GuideQuestionService\|GetFeedbackAnalyticsUseCase" src/lib/di/container.ts
```

**PASS 기준:** 모든 신규 서비스/UseCase가 container.register로 등록됨
**FAIL 기준:** 누락된 등록이 있음

---

### New Pattern: KPI Insights Service Registration Check

**Context:** AI KPI 인사이트 개선 (Phase 1)으로 KPIInsightsService가 DI에 등록됨.

**검사:** KPIInsightsService가 DI에 등록되었는지 확인합니다:
- KPIInsightsService

```bash
# KPI insights service 등록 확인
grep -n "KPIInsightsService" src/lib/di/container.ts
```

**PASS 기준:** KPIInsightsService가 container.registerSingleton으로 등록됨
**FAIL 기준:** 누락된 등록이 있음


## Output Format

```markdown
### verify-di-registration 결과

| # | 검사 | 상태 | 상세 |
|---|------|------|------|
| 1 | 토큰 정의 vs 등록 동기화 | PASS/FAIL | 미등록 토큰: X, Y |
| 2 | 리포지토리 인터페이스 커버리지 | PASS/FAIL | 미등록: INewRepo |
| 3 | 포트 인터페이스 커버리지 | PASS/FAIL | 미등록: INewService |
| 4 | Optimization/Audit UseCase 등록 | PASS/FAIL | 미등록 UseCase 목록 |
| 5 | OptimizationRuleRepository 토큰 | PASS/FAIL | 누락 여부 |
| 2 | 리포지토리 인터페이스 커버리지 | PASS/FAIL | 미등록: INewRepo |
| 3 | 포트 인터페이스 커버리지 | PASS/FAIL | 미등록: INewService |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **TeamRoleRepository 토큰** — `DI_TOKENS.TeamRoleRepository`는 정의되어 있지만 현재 미사용 예약 토큰. 경고만 표시
2. **resolve만 하는 토큰** — 다른 register 내부에서 `container.resolve(DI_TOKENS.X)` 형태로 참조되는 것은 정상. 중요한 것은 해당 토큰 자체의 register/registerSingleton 존재 여부
3. **편의 함수 (get*)** — `container.ts` 하단의 `export function get*()` 함수들은 편의 래퍼이며, 존재 여부와 등록 여부는 별개
4. **인터페이스 파일명과 토큰명 불일치** — `IPaymentGateway.ts` ↔ `PaymentGateway` 토큰처럼 `I` 접두사 제거 형태는 정상
5. **IConversationalAgent.ts의 IToolRegistry** — 파일명과 인터페이스명이 다를 수 있음 (하나의 파일에 여러 인터페이스 정의)
6. **IAuditCache.ts** — 캐시 팩토리 패턴(`createUpstashAuditCache`)으로 인스턴스를 직접 생성하며, DI 컨테이너를 통하지 않음. 포트 인터페이스이지만 DI 토큰 미등록은 의도적 설계
