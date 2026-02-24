# Implementation Plan: Ryze AI 레퍼런스 기반 P0 기능 도입

**Status**: 📋 Planning
**Started**: 2026-02-24
**Last Updated**: 2026-02-25
**Estimated Completion**: 2026-03-10
**Scope**: Large (6 Phase, ~20-25시간)

---

**⚠️ CRITICAL INSTRUCTIONS**: After completing each phase:
1. ✅ Check off completed task checkboxes
2. 🧪 Run all quality gate validation commands
3. ⚠️ Verify ALL quality gate items pass
4. 📅 Update "Last Updated" date above
5. 📝 Document learnings in Notes section
6. ➡️ Only then proceed to next phase

⛔ **DO NOT skip quality gates or proceed with failing checks**

---

## 📋 Overview

### Feature Description
Ryze AI 경쟁 분석에서 도출된 **P0 즉시 도입 우선순위** 3가지 기능을 구현한다:

1. **자동 최적화 실행 (Auto-Fix)** — CPA/ROAS 임계값 초과 시 캠페인 자동 일시중지, 예산 재배치
2. **실시간 감시 + 이상 탐지 강화** — 기존 크론 고도화 + 구체적 절감 금액 표시
3. **무료 계정 감사 (Free Audit)** — 가입 전 Meta 광고 계정 연결 → 즉석 진단 리포트

### 레퍼런스
- Ryze AI 핵심 가치: "AI가 유료 광고 작업의 90%를 자동화"
- Ryze 사용자 후기 핵심: "자동으로 낭비를 찾아 수정" (Trustpilot 5★ 최다 키워드)
- 분석 원문: Ryze AI vs 바투 AI 종합 비교 분석 (2026-02-24)

### Success Criteria
- [ ] 자동 최적화 규칙 CRUD + 규칙 기반 자동 실행이 동작
- [ ] 캠페인 이상 탐지 시 구체적 절감 금액이 알림에 포함
- [ ] 비로그인 사용자가 Meta 계정 연결 → 감사 리포트 확인 가능
- [ ] 전체 테스트 통과 (기존 2,255+ 유지)
- [ ] `npx tsc --noEmit` + `npx next build` 성공

### User Impact
- **커머스 사업자**: "설정만 하면 AI가 알아서" → 이탈 방지, 시간 절감
- **신규 유입**: 무료 감사로 진입 장벽 ↓ → 전환율 ↑
- **기존 사용자**: 절감 금액 시각화 → 유료 플랜 가치 체감 ↑

---

## 🏗️ Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| `OptimizationRule` 도메인 엔티티 신규 | 규칙 기반 + AI 기반 2단계 최적화를 도메인 레벨에서 관리 | 엔티티 추가로 복잡도 증가, 단 기존 Campaign/KPI와 자연스러운 관계 |
| 기존 `BudgetAlert` + `Alert` 확장 | 새 엔티티보다 기존 구조 활용이 마이그레이션 리스크 ↓ | 기존 엔티티 책임 비대화 가능 → 값 객체로 분리 |
| 크론 주기 강화 (1h→15min) | 실시간 감시 근사치, 웹훅 대비 인프라 비용 ↓ | 완전 실시간은 아님 (15분 지연), Meta API Rate Limit 주의 |
| Free Audit을 별도 API Route로 | 인증 없이 접근 가능해야 하므로 기존 auth 미들웨어 우회 | 보안: Rate Limit + reCAPTCHA 필수, Meta OAuth 토큰 임시 저장 |
| `SavingsCalculator` 값 객체 | 절감 금액 계산 로직을 순수 함수로 격리 → 테스트 용이 | 계산 정확도는 추정치 (과거 트렌드 기반 예측) |

---

## 📦 Dependencies

### Required Before Starting
- [x] Campaign 상태 관리 (`PauseCampaignUseCase`, `ResumeCampaignUseCase`) — 이미 구현됨
- [x] KPI 집계 (`GetDashboardKPIUseCase`, `aggregateByCampaignIds`) — 이미 구현됨
- [x] Meta API 클라이언트 (`MetaAdsClient` v25.0) — 이미 구현됨
- [x] 이상 탐지 크론 (`/api/cron/check-anomalies/`) — 이미 구현됨
- [x] BudgetAlert, Alert 도메인 엔티티 — 이미 구현됨
- [ ] Prisma migrate 실행 가능 환경 (새 테이블 추가 필요)

### External Dependencies
- 신규 패키지 없음 (기존 스택으로 구현 가능)
- Meta Marketing API v25.0 (기존 연동 활용)

---

## 🧪 Test Strategy

### Testing Approach
**TDD Principle**: 모든 기능은 RED → GREEN → REFACTOR 순서를 따른다.

### Test Pyramid for This Feature
| Test Type | Coverage Target | Purpose |
|-----------|-----------------|---------|
| **Unit Tests** | ≥90% | OptimizationRule, SavingsCalculator, AuditScorer 도메인 로직 |
| **Integration Tests** | Critical paths | UseCase → Repository → Meta API 연동 |
| **E2E Tests** | 1 critical flow | Free Audit 전체 플로우 (Meta OAuth → 리포트) |

### Test File Organization
```
tests/
├── unit/
│   ├── domain/
│   │   ├── OptimizationRule.test.ts
│   │   ├── SavingsCalculator.test.ts
│   │   └── AuditScore.test.ts
│   └── application/
│       ├── AutoOptimizeCampaignUseCase.test.ts
│       ├── EvaluateOptimizationRulesUseCase.test.ts
│       ├── AuditAdAccountUseCase.test.ts
│       └── CalculateSavingsUseCase.test.ts
├── integration/
│   ├── auto-optimize-flow.test.ts
│   └── free-audit-flow.test.ts
└── e2e/
    └── free-audit.spec.ts
```

---

## 🚀 Implementation Phases

---

### Phase 1: 자동 최적화 — 도메인 모델 (Foundation)
**Goal**: `OptimizationRule` 엔티티 + `SavingsCalculator` 값 객체 + Prisma 스키마
**Estimated Time**: 3-4시간
**Status**: ⏳ Pending

#### 설계

```
OptimizationRule (도메인 엔티티)
├── id: string
├── campaignId: string
├── userId: string
├── name: string
├── ruleType: RuleType (CPA_THRESHOLD | ROAS_FLOOR | BUDGET_PACE | CREATIVE_FATIGUE)
├── conditions: RuleCondition[]  — { metric, operator, value }
├── actions: RuleAction[]        — { type, params }
├── isEnabled: boolean
├── lastTriggeredAt: Date | null
├── triggerCount: number
├── cooldownMinutes: number      — 동일 규칙 재실행 방지
├── createdAt / updatedAt
│
├── evaluate(kpi: KPI): boolean                    — 조건 평가
├── canTrigger(): boolean                          — 쿨다운 확인
├── recordTrigger(): OptimizationRule              — 트리거 기록
└── static presets(): OptimizationRule[]            — 기본 프리셋

RuleCondition (값 객체)
├── metric: 'cpa' | 'roas' | 'ctr' | 'cpc' | 'spend_pace'
├── operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq'
└── value: number

RuleAction (값 객체)
├── type: 'PAUSE_CAMPAIGN' | 'REDUCE_BUDGET' | 'ALERT_ONLY'
└── params: { percentage?: number, notifyChannel?: string }

SavingsCalculator (값 객체)
├── static calculateWastedSpend(kpis: KPI[], rules: OptimizationRule[]): Money
├── static calculateProjectedSavings(kpi: KPI, action: RuleAction): Money
└── static calculateMonthlyImpact(dailySavings: Money): Money
```

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 1.1**: `OptimizationRule` 도메인 엔티티 단위 테스트
  - File: `tests/unit/domain/OptimizationRule.test.ts`
  - Expected: FAIL — 엔티티 미존재
  - Test cases:
    - `should_create_rule_with_valid_conditions`
    - `should_evaluate_true_when_cpa_exceeds_threshold`
    - `should_evaluate_false_when_cpa_below_threshold`
    - `should_not_trigger_during_cooldown_period`
    - `should_record_trigger_and_increment_count`
    - `should_provide_default_presets_for_ecommerce`
    - `should_reject_invalid_rule_conditions`

- [ ] **Test 1.2**: `SavingsCalculator` 값 객체 단위 테스트
  - File: `tests/unit/domain/SavingsCalculator.test.ts`
  - Expected: FAIL — 값 객체 미존재
  - Test cases:
    - `should_calculate_wasted_spend_from_underperforming_campaigns`
    - `should_calculate_projected_savings_for_pause_action`
    - `should_calculate_projected_savings_for_budget_reduction`
    - `should_calculate_monthly_impact_from_daily_savings`
    - `should_return_zero_when_no_waste_detected`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 1.3**: `RuleCondition`, `RuleAction` 값 객체 구현
  - File: `src/domain/value-objects/OptimizationRule.ts`
  - Goal: 불변 값 객체, 유효성 검증 포함

- [ ] **Task 1.4**: `OptimizationRule` 도메인 엔티티 구현
  - File: `src/domain/entities/OptimizationRule.ts`
  - Goal: Test 1.1 통과, `evaluate()`, `canTrigger()`, `presets()` 구현

- [ ] **Task 1.5**: `SavingsCalculator` 값 객체 구현
  - File: `src/domain/value-objects/SavingsCalculator.ts`
  - Goal: Test 1.2 통과, 순수 함수로 절감 금액 계산

- [ ] **Task 1.6**: Prisma 스키마 추가
  - File: `prisma/schema.prisma`
  - 추가 모델: `OptimizationRule`, `OptimizationLog` (실행 이력)
  - `npx prisma generate` 실행

- [ ] **Task 1.7**: `IOptimizationRuleRepository` 포트 정의
  - File: `src/domain/repositories/IOptimizationRuleRepository.ts`
  - 메서드: `save`, `findById`, `findByCampaignId`, `findByUserId`, `findEnabledRules`, `delete`

**🔵 REFACTOR: Clean Up Code**
- [ ] **Task 1.8**: 도메인 index.ts에 새 엔티티/값 객체 export 추가
- [ ] **Task 1.9**: 코드 정리 (중복 제거, 네이밍 개선)

#### Quality Gate ✋

**TDD Compliance**:
- [ ] RED: 테스트 먼저 작성, 실패 확인
- [ ] GREEN: 최소 구현으로 통과
- [ ] REFACTOR: 테스트 유지하며 정리
- [ ] Coverage: ≥90% (도메인 레이어)

**Validation Commands**:
```bash
npx vitest run tests/unit/domain/OptimizationRule.test.ts
npx vitest run tests/unit/domain/SavingsCalculator.test.ts
npx tsc --noEmit
npx prisma generate
```

---

### Phase 2: 자동 최적화 — 유스케이스 + 인프라
**Goal**: 규칙 평가 → 자동 실행 유스케이스 + Repository 구현 + DI 등록
**Estimated Time**: 4-5시간
**Status**: ⏳ Pending
**Dependencies**: Phase 1 완료

#### 설계

```
유스케이스:
├── CreateOptimizationRuleUseCase     — 규칙 생성 (+ 프리셋 일괄 생성)
├── UpdateOptimizationRuleUseCase     — 규칙 수정
├── DeleteOptimizationRuleUseCase     — 규칙 삭제
├── ListOptimizationRulesUseCase      — 사용자/캠페인별 규칙 목록
├── EvaluateOptimizationRulesUseCase  — 모든 활성 규칙 평가 (크론에서 호출)
└── AutoOptimizeCampaignUseCase       — 규칙 트리거 시 실제 액션 실행
     ├── PAUSE_CAMPAIGN → PauseCampaignUseCase 위임
     ├── REDUCE_BUDGET → MetaAdsService.updateCampaign() 호출
     └── ALERT_ONLY → Alert 생성 + 알림 발송

실행 흐름:
  Cron (15분) → EvaluateOptimizationRulesUseCase
    → 활성 규칙 조회
    → 각 규칙의 캠페인 KPI 조회
    → rule.evaluate(kpi) → true면
    → rule.canTrigger() 쿨다운 확인
    → AutoOptimizeCampaignUseCase.execute(rule, campaign, kpi)
    → OptimizationLog 기록
    → SavingsCalculator.calculateProjectedSavings() 절감 금액 계산
    → Alert 생성 (절감 금액 포함)
```

#### Tasks

**🔴 RED: Write Failing Tests First**
- [ ] **Test 2.1**: `EvaluateOptimizationRulesUseCase` 단위 테스트
  - File: `tests/unit/application/EvaluateOptimizationRulesUseCase.test.ts`
  - Expected: FAIL
  - Test cases:
    - `should_evaluate_all_enabled_rules_for_active_campaigns`
    - `should_skip_rules_in_cooldown_period`
    - `should_trigger_auto_optimize_when_rule_matches`
    - `should_not_trigger_when_no_rules_match`
    - `should_handle_multiple_rules_per_campaign`

- [ ] **Test 2.2**: `AutoOptimizeCampaignUseCase` 단위 테스트
  - File: `tests/unit/application/AutoOptimizeCampaignUseCase.test.ts`
  - Expected: FAIL
  - Test cases:
    - `should_pause_campaign_when_action_is_PAUSE_CAMPAIGN`
    - `should_reduce_budget_by_percentage_when_action_is_REDUCE_BUDGET`
    - `should_create_alert_with_savings_amount`
    - `should_log_optimization_execution`
    - `should_not_execute_on_already_paused_campaign`

- [ ] **Test 2.3**: `CreateOptimizationRuleUseCase` 단위 테스트
  - File: `tests/unit/application/CreateOptimizationRuleUseCase.test.ts`
  - Expected: FAIL
  - Test cases:
    - `should_create_rule_with_valid_input`
    - `should_create_preset_rules_for_ecommerce`
    - `should_reject_duplicate_rule_for_same_campaign_and_type`

**🟢 GREEN: Implement to Make Tests Pass**
- [ ] **Task 2.4**: `PrismaOptimizationRuleRepository` 구현
  - File: `src/infrastructure/database/repositories/PrismaOptimizationRuleRepository.ts`
  - Mapper: `src/infrastructure/database/mappers/OptimizationRuleMapper.ts`

- [ ] **Task 2.5**: `CreateOptimizationRuleUseCase` 구현
  - File: `src/application/use-cases/optimization/CreateOptimizationRuleUseCase.ts`

- [ ] **Task 2.6**: `EvaluateOptimizationRulesUseCase` 구현
  - File: `src/application/use-cases/optimization/EvaluateOptimizationRulesUseCase.ts`
  - 의존성: IOptimizationRuleRepository, IKPIRepository, ICampaignRepository

- [ ] **Task 2.7**: `AutoOptimizeCampaignUseCase` 구현
  - File: `src/application/use-cases/optimization/AutoOptimizeCampaignUseCase.ts`
  - 의존성: PauseCampaignUseCase, IMetaAdsService, IAlertRepository

- [ ] **Task 2.8**: DTO 정의
  - File: `src/application/dto/OptimizationRuleDTO.ts`
  - CreateOptimizationRuleDTO, OptimizationRuleResponseDTO, OptimizationLogDTO

- [ ] **Task 2.9**: DI 등록
  - File: `src/lib/di/container.ts` + `types.ts`
  - 토큰: OptimizationRuleRepository, Create/Update/Delete/List/Evaluate/AutoOptimize UseCase

**🔵 REFACTOR**
- [ ] **Task 2.10**: Mock Repository 작성 + 기존 Mock 패턴 준수
- [ ] **Task 2.11**: 코드 정리

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/unit/application/EvaluateOptimizationRulesUseCase.test.ts
npx vitest run tests/unit/application/AutoOptimizeCampaignUseCase.test.ts
npx vitest run tests/unit/application/CreateOptimizationRuleUseCase.test.ts
npx tsc --noEmit
npx vitest run  # 전체 테스트 회귀 확인
```

---

### Phase 3: 자동 최적화 — API + 크론 강화
**Goal**: REST API 엔드포인트 + 크론 주기 강화 + 실시간 감시 근사
**Estimated Time**: 3-4시간
**Status**: ✅ Complete
**Dependencies**: Phase 2 완료

#### 설계

```
API Routes:
├── GET  /api/optimization-rules              — 사용자 규칙 목록
├── POST /api/optimization-rules              — 규칙 생성
├── GET  /api/optimization-rules/presets       — 프리셋 목록 (이커머스/리드젠)
├── PATCH /api/optimization-rules/[id]        — 규칙 수정
├── DELETE /api/optimization-rules/[id]       — 규칙 삭제
├── GET  /api/optimization-rules/[id]/logs    — 실행 이력
└── GET  /api/optimization/savings            — 절감 금액 대시보드

Cron 강화:
├── /api/cron/evaluate-rules   — 15분마다 (신규)
└── /api/cron/check-anomalies  — 기존 강화 (절감 금액 포함)
```

#### Tasks

**🔴 RED**
- [x] **Test 3.1**: API Route 통합 테스트
  - File: `tests/integration/auto-optimize-flow.test.ts`
  - 9개 테스트 케이스: CRUD 조합, 프리셋 플로우, 평가 플로우

**🟢 GREEN**
- [x] **Task 3.2**: API Route 구현
  - Files: `src/app/api/optimization-rules/route.ts`, `[id]/route.ts`, `presets/route.ts`

- [x] **Task 3.3**: 크론 엔드포인트 구현
  - File: `src/app/api/cron/evaluate-rules/route.ts`
  - Vercel cron: `vercel.json`에 15분 스케줄 추가 완료

- [ ] **Task 3.4**: 기존 `check-anomalies` 크론 강화 (Phase 6에서 통합 처리)
  - File: `src/app/api/cron/check-anomalies/route.ts`
  - 변경: 절감 금액 계산 추가, Alert에 `estimatedSavings` 필드 포함

- [x] **Task 3.5**: Zod 스키마 + 입력 검증
  - File: `src/lib/validations/optimization.ts`

**🔵 REFACTOR**
- [x] **Task 3.6**: API 에러 핸들링 통일, ISR 태그 설정 (`optimization-rules`)

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/integration/auto-optimize-flow.test.ts
npx tsc --noEmit
npx next build
```

**보안 검토** (API 경로 변경):
- [x] 인증 확인: 모든 규칙 API는 로그인 필수 (`getAuthenticatedUser`)
- [x] 권한 확인: 자기 캠페인의 규칙만 접근 가능 (`userId` 필터 + 소유권 검증)
- [x] Rate Limit: 크론 엔드포인트 CRON_SECRET 검증 (`validateCronAuth`)

---

### Phase 4: 무료 계정 감사 (Free Audit) — 도메인 + 유스케이스
**Goal**: 비로그인 사용자가 Meta 계정 연결 → 즉석 감사 리포트 생성
**Estimated Time**: 4-5시간
**Status**: ✅ Complete

#### 설계

```
AuditScore (값 객체)
├── overall: number (0-100)
├── categories: AuditCategory[]
│   ├── { name: '예산 효율성', score, findings[], recommendations[] }
│   ├── { name: '타겟팅 정확도', score, findings[], recommendations[] }
│   ├── { name: '크리에이티브 성과', score, findings[], recommendations[] }
│   └── { name: '전환 추적', score, findings[], recommendations[] }
├── estimatedWaste: Money       — "월 ₩X만원 낭비 추정"
├── estimatedImprovement: Money — "최적화 시 월 ₩X만원 추가 수익 가능"
└── grade: 'A' | 'B' | 'C' | 'D' | 'F'

AuditAdAccountUseCase
├── Input: accessToken, adAccountId
├── Process:
│   1. MetaAdsClient.listCampaigns() — 전체 캠페인 조회
│   2. MetaAdsClient.getCampaignInsights() — KPI 수집 (최근 30일)
│   3. AuditScorer.evaluate() — 항목별 점수 계산
│   4. SavingsCalculator.calculateWastedSpend() — 낭비 금액 추정
│   5. AI 요약 생성 (선택)
├── Output: AuditReport (점수 + 발견사항 + 추천)
└── 제약: 읽기 전용 (수정/삭제 불가), 임시 토큰만 사용

플로우:
  1. 랜딩 페이지 "무료 광고 진단" CTA 클릭
  2. Meta OAuth 팝업 (ads_read 권한만)
  3. 임시 토큰으로 API 호출 (DB 저장 안 함)
  4. 감사 리포트 렌더링
  5. "더 자세한 분석은 회원가입 후" CTA
```

#### Tasks

**🔴 RED**
- [x] **Test 4.1**: `AuditScore` 값 객체 단위 테스트 (14개)
  - File: `tests/unit/domain/AuditScore.test.ts`

- [x] **Test 4.2**: `AuditAdAccountUseCase` 단위 테스트 (6개)
  - File: `tests/unit/application/audit/AuditAdAccountUseCase.test.ts`

**🟢 GREEN**
- [x] **Task 4.3**: `AuditScore` 값 객체 구현
  - File: `src/domain/value-objects/AuditScore.ts`
  - 4개 카테고리 평가, 점수 클램핑(0-100), 불변 객체

- [x] **Task 4.4**: `AuditAdAccountUseCase` 구현
  - File: `src/application/use-cases/audit/AuditAdAccountUseCase.ts`
  - 의존성: IMetaAdsService (읽기 전용 호출만)

- [x] **Task 4.5**: DTO 정의
  - File: `src/application/dto/audit/AuditDTO.ts`
  - AuditRequestDTO, AuditReportDTO, AuditCategoryDTO

- [x] **Task 4.6**: DI 등록
  - File: `src/lib/di/container.ts` + `types.ts`

**🔵 REFACTOR**
- [x] **Task 4.7**: 점수 클램핑 버그 수정 (Math.min(100, ...) 추가)

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/unit/domain/AuditScore.test.ts
npx vitest run tests/unit/application/AuditAdAccountUseCase.test.ts
npx tsc --noEmit
```

---

### Phase 5: 무료 계정 감사 — API + 랜딩 페이지 연동
**Goal**: 공개 API 엔드포인트 + 랜딩 페이지에 "무료 광고 진단" CTA + 리포트 UI
**Estimated Time**: 4-5시간
**Status**: ✅ Complete
**Dependencies**: Phase 4 완료
**Completed**: 2026-02-24

#### 설계

```
API Routes (인증 불필요):
├── GET  /api/audit/auth-url       — Meta OAuth URL 생성 (ads_read 권한)
├── GET  /api/audit/callback       — OAuth 콜백 → 임시 토큰 수신
├── POST /api/audit/analyze        — 감사 실행 (임시 토큰 사용)
└── 보안: Rate Limit (IP당 3회/일) + reCAPTCHA 검증

UI Components:
├── FreeAuditCTA.tsx              — 랜딩 페이지 CTA 섹션 (HeroSection 또는 별도)
├── AuditCallbackPage.tsx         — /audit/callback 페이지 (로딩 → 분석 → 리포트)
├── AuditReportCard.tsx           — 감사 결과 카드 (점수, 등급, 절감 금액)
├── AuditCategoryBreakdown.tsx    — 카테고리별 세부 결과
└── AuditConversionCTA.tsx        — "회원가입으로 더 많은 기능" CTA
```

#### Tasks

**🔴 RED**
- [x] **Test 5.1**: API Route 통합 테스트 (17개 테스트)
  - File: `tests/integration/free-audit-flow.test.ts`
  - auditTokenCache 동작 7개, Rate Limit 설정 4개, Zod 스키마 6개

**🟢 GREEN**
- [x] **Task 5.2**: API Route 구현
  - Files: `src/app/api/audit/auth-url/route.ts`, `callback/route.ts`, `analyze/route.ts`
  - 보안: IP Rate Limit (audit: 3회/일), 임시 토큰 15분 만료 (auditTokenCache)

- [x] **Task 5.3**: `/audit/callback` 페이지 구현
  - File: `src/app/audit/callback/page.tsx`
  - Suspense 래퍼 + analyzedRef 중복 호출 방지 + 로딩/에러/성공 상태

- [x] **Task 5.4**: Audit UI 컴포넌트 구현
  - Files: `src/presentation/components/audit/AuditReportCard.tsx`, `AuditCategoryBreakdown.tsx`, `AuditConversionCTA.tsx`
  - SVG 원형 게이지, 등급별 색상(A=emerald/B=blue/C=amber/D=orange/F=red), Accordion 카테고리

- [x] **Task 5.5**: 랜딩 페이지에 "무료 광고 진단" CTA 추가
  - File: `src/presentation/components/landing/HeroSection/FreeAuditButton.tsx` (별도 클라이언트 컴포넌트)
  - HeroContent CTAButtons 하단에 배치

- [x] **Task 5.6**: 리포트 → 회원가입 전환 CTA
  - File: `src/presentation/components/audit/AuditConversionCTA.tsx`
  - 절감 금액 강조 + "14일 무료 체험" 회원가입 버튼

**🔵 REFACTOR**
- [x] **Task 5.7**: 컴포넌트 접근성 검증 (aria-label, role 적용 완료)

#### Quality Gate ✋

**Validation Commands**:
```bash
npx vitest run tests/integration/free-audit-flow.test.ts  # ✅ 17 tests PASS
npx tsc --noEmit                                          # ✅ PASS
npx next build                                            # ✅ PASS (/audit/callback ƒ Dynamic)
```

**보안 검토** (공개 API):
- [x] Rate Limit 작동 확인 (audit: 3 tokens / 24h)
- [x] 임시 토큰 만료 후 재사용 불가 (15분 TTL + 1회용 삭제)
- [x] ads_read 권한만 요청 (수정 권한 없음)
- [x] 사용자 데이터 DB 미저장 확인 (in-memory auditTokenCache만 사용)

**Manual Test Checklist**:
- [ ] 비로그인 상태에서 "무료 광고 진단" 클릭 → Meta OAuth 팝업
- [ ] OAuth 완료 → 감사 리포트 정상 표시
- [ ] 등급, 절감 금액, 카테고리별 세부 결과 확인
- [ ] "회원가입" CTA 클릭 → /register 이동
- [ ] 모바일(md)/태블릿(lg)/데스크톱(xl) 반응형 확인

---

### Phase 6: 절감 금액 대시보드 + 통합 마무리
**Goal**: 기존 대시보드에 "AI가 절감한 금액" 위젯 추가 + 전체 통합 테스트
**Estimated Time**: 3-4시간
**Status**: ⏳ Pending
**Dependencies**: Phase 3, Phase 5 완료

#### 설계

```
대시보드 확장:
├── SavingsWidget.tsx            — "이번 달 AI가 절감한 광고비: ₩X만원"
├── OptimizationTimeline.tsx     — 최근 자동 최적화 실행 이력 타임라인
└── API: GET /api/optimization/savings (Phase 3에서 구현)

표시 항목:
├── 이번 달 총 절감 금액 (₩)
├── 자동 최적화 실행 횟수
├── 가장 큰 절감 이벤트 (캠페인명 + 금액)
└── 트렌드 차트 (일별 절감 금액)
```

#### Tasks

**🔴 RED**
- [ ] **Test 6.1**: `CalculateSavingsUseCase` 단위 테스트
  - File: `tests/unit/application/CalculateSavingsUseCase.test.ts`
  - Test cases:
    - `should_aggregate_monthly_savings_from_optimization_logs`
    - `should_return_zero_when_no_optimizations_performed`
    - `should_calculate_top_saving_event`

**🟢 GREEN**
- [ ] **Task 6.2**: `CalculateSavingsUseCase` 구현
  - File: `src/application/use-cases/optimization/CalculateSavingsUseCase.ts`

- [ ] **Task 6.3**: SavingsWidget UI 컴포넌트
  - File: `src/presentation/components/dashboard/SavingsWidget.tsx`
  - Ryze 참고: "+₩X만원/월" 강조, 녹색 계열 표시

- [ ] **Task 6.4**: OptimizationTimeline UI 컴포넌트
  - File: `src/presentation/components/dashboard/OptimizationTimeline.tsx`
  - 최근 10건의 자동 최적화 실행 이력

- [ ] **Task 6.5**: 대시보드 페이지에 위젯 통합
  - File: `src/app/(dashboard)/dashboard/page.tsx`

**🔵 REFACTOR + 통합 마무리**
- [ ] **Task 6.6**: 전체 테스트 실행 + 회귀 확인
- [ ] **Task 6.7**: verify-implementation 스킬 실행 (아키텍처 검증)
- [ ] **Task 6.8**: verify-di-registration 스킬 실행 (DI 동기화 검증)

#### Quality Gate ✋ (최종)

**Validation Commands**:
```bash
npx tsc --noEmit          # 타입 체크
npx vitest run            # 전체 테스트 (2,255+ 유지 확인)
npx next build            # 빌드 성공
```

**Manual Test Checklist**:
- [ ] 대시보드에 절감 금액 위젯 표시
- [ ] 자동 최적화 이력 타임라인 표시
- [ ] 최적화 규칙 생성 → 15분 후 자동 실행 확인
- [ ] 무료 감사 전체 플로우 확인

---

## ⚠️ Risk Assessment

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Meta API Rate Limit (15분 크론) | Medium | High | 배치 호출 최적화, 캠페인 수 제한 (Free: 5개, Pro: 50개) |
| 자동 일시중지 오작동 | Low | High | 쿨다운 기본 60분, 일 최대 3회 트리거 제한, ALERT_ONLY 기본값 |
| Free Audit 남용 (봇 등) | Medium | Medium | IP Rate Limit 3회/일 + reCAPTCHA v3 |
| 절감 금액 추정 오차 | Medium | Low | "추정" 문구 명시, 과거 데이터 기반 보수적 계산 |
| Prisma migrate 충돌 | Low | Medium | 별도 브랜치에서 마이그레이션 → main 머지 |
| 기존 이상 탐지 크론 회귀 | Low | High | check-anomalies 기존 테스트 유지, 추가분만 테스트 |

---

## 🔄 Rollback Strategy

### Phase 1-2 실패 시
- `git stash` 또는 새 엔티티/유스케이스 파일 삭제
- Prisma 스키마 되돌리기 (`git checkout prisma/schema.prisma`)
- DI 등록 제거

### Phase 3 실패 시
- API 라우트 디렉토리 삭제 (`src/app/api/optimization-rules/`)
- 크론 변경 되돌리기
- Phase 2 상태로 복원

### Phase 4-5 실패 시 (Free Audit)
- 독립 기능이므로 해당 파일만 삭제
- 랜딩 페이지 CTA 제거
- 다른 Phase에 영향 없음

### Phase 6 실패 시
- 대시보드 위젯 제거
- Phase 3까지의 기능은 그대로 유지 가능

---

## 📊 Progress Tracking

### Completion Status
- **Phase 1**: ✅ 100% (54 테스트 통과)
- **Phase 2**: ✅ 100% (16 테스트 통과)
- **Phase 3**: ✅ 95% (9 통합 테스트, Task 3.4 크론 강화는 Phase 6 통합)
- **Phase 4**: ✅ 100% (20 테스트 통과)
- **Phase 5**: ⏳ 0%
- **Phase 6**: ⏳ 0%

**Overall Progress**: 50% complete

### Time Tracking
| Phase | Estimated | Actual | Variance |
|-------|-----------|--------|----------|
| Phase 1: 도메인 모델 | 3-4h | - | - |
| Phase 2: 유스케이스 | 4-5h | - | - |
| Phase 3: API + 크론 | 3-4h | - | - |
| Phase 4: Audit 도메인 | 4-5h | - | - |
| Phase 5: Audit API + UI | 4-5h | - | - |
| Phase 6: 대시보드 + 통합 | 3-4h | - | - |
| **Total** | **21-27h** | - | - |

---

## 📝 Notes & Learnings

### Ryze AI 참고 포인트 (구현 시 참조)
- **Auto-Fix 후 알림 메시지**: "CPA ₩X → ₩Y로 개선, 예상 월 절감 ₩Z만원" (구체적 금액 필수)
- **프리셋 규칙**: 이커머스 사업자용 기본 규칙 3개 자동 생성 (CPA 상한, ROAS 하한, 예산 페이싱)
- **Free Audit 전환 카피**: Ryze의 "Free ad account audit" → "내 광고 계정, 몇 점일까?" 한국형 변환
- **신뢰 메시지**: "이번 달 AI가 ₩X만원을 절약했어요" (대시보드 상단 고정)

---

## 📚 References

### 분석 원문
- Ryze AI vs 바투 AI 종합 비교 분석 (2026-02-24, 대화 내)
- [Ryze AI 공식](https://www.get-ryze.ai/)
- [Ryze AI Trustpilot](https://www.trustpilot.com/review/get-ryze.ai)

### 기존 코드 참조
- Campaign 상태 관리: `src/domain/value-objects/CampaignStatus.ts`
- KPI 엔티티: `src/domain/entities/KPI.ts`
- BudgetAlert: `src/domain/entities/BudgetAlert.ts`
- Alert: `src/domain/entities/Alert.ts`
- 이상 탐지 크론: `src/app/api/cron/check-anomalies/route.ts`
- DI 컨테이너: `src/lib/di/container.ts` (130 토큰)
- Meta Ads Client: `src/infrastructure/external/meta-ads/MetaAdsClient.ts`

---

## ✅ Final Checklist

**Before marking plan as COMPLETE**:
- [ ] All 6 phases completed with quality gates passed
- [ ] `npx tsc --noEmit` — 타입 체크 통과
- [ ] `npx vitest run` — 전체 테스트 통과 (기존 2,255+ 유지)
- [ ] `npx next build` — 빌드 성공
- [ ] `/verify-implementation` 스킬 실행 — 아키텍처 검증 통과
- [ ] 보안 검토: 공개 API Rate Limit + OAuth 토큰 관리
- [ ] 반응형 UI 검증 (md/lg/xl)
- [ ] 성능: 크론 15분 주기 Meta API Rate Limit 이내
- [ ] Plan document archived

---

**Plan Status**: 🚧 In Progress — Phase 1~3 완료, Phase 4 대기
**Next Action**: Phase 5 (무료 계정 감사 — API + 랜딩 페이지 연동) TDD 시작
**Blocked By**: None
