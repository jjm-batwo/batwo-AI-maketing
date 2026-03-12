---
name: verify-di-registration
description: Verifies DI container token definitions and actual registrations are in sync. Detects tokens with no registration, or registrations with no token.
---

# DI Container Registration Sync Verification

## Purpose

Verifies DI (Dependency Injection) container consistency:

1. **Unregistered token** — Token defined in `DI_TOKENS` but not registered in `container.ts`
2. **Undefined token usage** — Token used in `container.ts` but not defined in `DI_TOKENS`
3. **Unregistered repository interface** — Interface exists in `src/domain/repositories/` but has no DI token
4. **Unregistered port interface** — Interface exists in `src/application/ports/` but has no DI token

## When to Run

- After adding new repositories, use cases, or services
- After modifying the DI container
- After adding/deleting repository interfaces or ports

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/di/types.ts` | DI token definitions (`DI_TOKENS` object) |
| `src/lib/di/container.ts` | DI container implementation (module composition + convenience functions) |
| `src/lib/di/modules/campaign.module.ts` | DI module: Campaign domain registration |
| `src/lib/di/modules/report.module.ts` | DI module: Report domain registration |
| `src/lib/di/modules/kpi.module.ts` | DI module: KPI domain registration |
| `src/lib/di/modules/payment.module.ts` | DI module: Payment domain registration |
| `src/lib/di/modules/meta.module.ts` | DI module: Meta API domain registration |
| `src/lib/di/modules/auth.module.ts` | DI module: Auth/permission domain registration |
| `src/lib/di/modules/common.module.ts` | DI module: Common service registration |
| `src/domain/repositories/I*.ts` | Repository interfaces |
| `src/domain/repositories/IPermissionRepository.ts` | Permission repository interface (Phase 3 addition) |
| `src/application/ports/I*.ts` | External service port interfaces |
| `src/application/ports/IAppConfig.ts` | App config port interface (Phase 3 addition) |
| `src/domain/repositories/IOptimizationRuleRepository.ts` | Optimization rule repository interface |
| `src/application/ports/IFallbackResponseService.ts` | Fallback response service port — DI registration target |
| `src/application/ports/IFewShotExampleRegistry.ts` | Few-shot example registry port — DI registration target |
| `src/application/ports/IGuideQuestionService.ts` | Guide question service port — DI registration target |
| `src/application/ports/IPromptTemplateService.ts` | Prompt template service port — DI registration target |
| `src/application/ports/IResilienceService.ts` | Resilience service port — DI registration target |
| `src/application/use-cases/ai/GetFeedbackAnalyticsUseCase.ts` | Feedback analytics use case — DI registration target |
| `src/application/ports/IAuditCache.ts` | Audit cache port interface — uses cache factory pattern |
| `src/application/services/KPIInsightsService.ts` | KPI insights service — DI registration target (KPIInsightsService token) |
| `src/application/ports/IEmbeddingService.ts` | Embedding service port — RAG system, DI registration target |
| `src/application/ports/IKnowledgeBaseRepository.ts` | Vector search repository port — RAG system, DI registration target |
| `src/application/services/KnowledgeIngestionService.ts` | Knowledge ingestion service — RAG system, DI registration target |
| `src/infrastructure/database/repositories/PrismaPermissionRepository.ts` | Permission repository Prisma implementation (Phase 3 addition) |

## Workflow

### Step 1: Extract token list from DI_TOKENS

**File:** `src/lib/di/types.ts`

**Check:** Extract all keys from the `DI_TOKENS` object.

```bash
grep -oP '^\s+(\w+):\s*Symbol' src/lib/di/types.ts | sed 's/:.*//' | sed 's/^\s*//' | sort
```

**Result:** Token name list

### Step 2: Extract registered tokens from container.ts and modules

**Files:** `src/lib/di/container.ts`, `src/lib/di/modules/*.module.ts`

**Check:** Extract the first argument token from `container.register` or `container.registerSingleton` calls across container.ts and module files.

```bash
grep -rP 'container\.(register|registerSingleton)\s*[<(]' src/lib/di/container.ts src/lib/di/modules/*.module.ts | grep -oP 'DI_TOKENS\.(\w+)' | sed 's/DI_TOKENS\.//' | sort -u
```

**Result:** Token name list used in registrations

### Step 3: Compare token definitions vs registrations

**Check:** Compare Step 1 list with Step 2 list.

- Tokens only in `types.ts` = **Registration missing** (error)
- Tokens only used in `container.ts` = **Token undefined** (error)

**PASS criteria:** All tokens exist on both sides
**FAIL criteria:** Tokens exist on only one side

**Fix:**

- Unregistered tokens: Add `container.register` or `container.registerSingleton` call
- Undefined tokens: Add to `DI_TOKENS` in `types.ts`
- Unused tokens: Remove from both sides

### Step 4: Match repository interface files with tokens

**Check:** Match `I*.ts` files in `src/domain/repositories/` with `*Repository` tokens in `DI_TOKENS`.

```bash
# Repository interface file list
ls src/domain/repositories/I*.ts 2>/dev/null | sed 's|.*/I||;s|\.ts||' | sort

# DI_TOKENS Repository token list
grep -oP '(\w+Repository)' src/lib/di/types.ts | sort
```

**PASS criteria:** Every repository interface has a corresponding DI token
**FAIL criteria:** Interface exists but token doesn't

**Fix:**

1. Add token to `src/lib/di/types.ts`
2. Register implementation in `src/lib/di/container.ts`

### Step 5: Match port interfaces with tokens

**Check:** Match `I*.ts` files in `src/application/ports/` with DI tokens.

```bash
ls src/application/ports/I*.ts 2>/dev/null | sed 's|.*/I||;s|\.ts||' | sort
```

### New Pattern: Optimization/Audit UseCase Registration Check

**Context:** With the addition of the optimization rule engine and audit system, new UseCases are registered in DI.

**Check:** Verify these UseCases are registered in DI:

- CreateOptimizationRuleUseCase
- UpdateOptimizationRuleUseCase
- DeleteOptimizationRuleUseCase
- ListOptimizationRulesUseCase
- EvaluateOptimizationRulesUseCase
- AutoOptimizeCampaignUseCase
- CalculateSavingsUseCase
- AuditAdAccountUseCase

```bash
# Optimization usecase registration check
grep -n "OptimizationRuleUseCase\|AuditAdAccountUseCase\|CalculateSavingsUseCase" src/lib/di/container.ts
```

**PASS criteria:** All new UseCases registered via container.register
**FAIL criteria:** Missing registrations

---

### New Pattern: Audit/Optimization Repository Token Check

**Check:** Verify new repository interfaces like IOptimizationRuleRepository have tokens defined

```bash
# Repository interface file list
ls src/domain/repositories/I*.ts 2>/dev/null | sed 's|.*/I||;s|\.ts||' | sort

# DI_TOKENS Repository token list
grep -oP '(\w+Repository)' src/lib/di/types.ts | sort
```

**Fix on FAIL:**

1. Add OptimizationRuleRepository token to `src/lib/di/types.ts`
2. Register PrismaOptimizationRuleRepository in `src/lib/di/container.ts`

---

### New Pattern: AI Chatbot Service/UseCase Registration Check

**Context:** With AI chatbot enhancement, new services and UseCases are registered in DI.

**Check:** Verify these services/UseCases are registered in DI:

- ResilienceService
- PromptTemplateService
- FallbackResponseService
- FewShotExampleRegistry
- GuideQuestionService
- GetFeedbackAnalyticsUseCase

```bash
# AI chatbot service/usecase registration check
grep -n "ResilienceService\|PromptTemplateService\|FallbackResponseService\|FewShotExampleRegistry\|GuideQuestionService\|GetFeedbackAnalyticsUseCase" src/lib/di/container.ts
```

**PASS criteria:** All new services/UseCases registered via container.register
**FAIL criteria:** Missing registrations

---

### New Pattern: KPI Insights Service Registration Check

**Context:** With AI KPI insights improvement (Phase 1), KPIInsightsService is registered in DI.

**Check:** Verify KPIInsightsService is registered in DI:

```bash
# KPI insights service registration check
grep -n "KPIInsightsService" src/lib/di/container.ts
```

**PASS criteria:** KPIInsightsService registered via container.registerSingleton
**FAIL criteria:** Missing registration

---

### New Pattern: Phase 2 Retention Services Check

**Context:** Phase 2 (retention enhancement) adds auto reports, funnel visualization, bulk operations, and benchmark features.

**Check:** Verify these UseCases are registered in DI:

- SendScheduledReportsUseCase
- ConversionFunnelService
- PerformanceBenchmarkService
- BulkUpdateCampaignsUseCase

```bash
# Phase 2 service registration check
grep -n "SendScheduledReportsUseCase\|ConversionFunnelService\|PerformanceBenchmarkService\|BulkUpdateCampaignsUseCase" src/lib/di/container.ts
```

**PASS criteria:** All new services/UseCases registered via container.register
**FAIL criteria:** Missing registrations

---

### New Pattern: RAG Service Registration Check

**Context:** Hybrid RAG integration adds embedding/vector search/knowledge ingestion services.

**Check:** Verify these services are registered in DI:

- EmbeddingService (OpenAIEmbeddingService implementation)
- KnowledgeBaseRepository (PrismaKnowledgeBaseRepository implementation)

```bash
# RAG service registration check
grep -n "EmbeddingService\|KnowledgeBaseRepository" src/lib/di/container.ts
```

**PASS criteria:** All RAG services registered in container
**FAIL criteria:** Missing registrations

**Fix:**
1. Add `EmbeddingService`, `KnowledgeBaseRepository` tokens to `src/lib/di/types.ts`
2. Register implementations in `src/lib/di/container.ts`

## Output Format

```markdown
### verify-di-registration Results

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Token definition vs registration sync | PASS/FAIL | Unregistered tokens: X, Y |
| 2 | Repository interface coverage | PASS/FAIL | Unregistered: INewRepo |
| 3 | Port interface coverage | PASS/FAIL | Unregistered: INewService |
| 4 | Optimization/Audit UseCase registration | PASS/FAIL | Missing UseCase list |
| 5 | OptimizationRuleRepository token | PASS/FAIL | Missing status |
```

## Exceptions

The following are **NOT violations**:

1. **TeamRoleRepository token** — `DI_TOKENS.TeamRoleRepository` is defined but currently a reserved unused token. Show warning only
2. **Resolve-only tokens** — Tokens referenced as `container.resolve(DI_TOKENS.X)` inside other register calls is normal. What matters is whether the token itself has a register/registerSingleton
3. **Convenience functions (get*)** — `export function get*()` functions at the bottom of `container.ts` are convenience wrappers; their existence is separate from registration
4. **Interface filename vs token name mismatch** — `IPaymentGateway.ts` ↔ `PaymentGateway` token (removing `I` prefix) is normal
5. **IConversationalAgent.ts's IToolRegistry** — Filename and interface name may differ (multiple interfaces in one file)
6. **IAuditCache.ts** — Uses cache factory pattern (`createUpstashAuditCache`) to create instances directly, bypassing DI container. Port interface without DI token is intentional design

## Reserved Token Policy

Tokens intentionally kept unregistered are managed as an allowlist with this format:

| Token | Reason | Owner | Review By |
|-------|--------|-------|-----------|
| `TeamRoleRepository` | Reserved token for future team permission model expansion (no resolve path currently) | Backend | 2026-06-30 |

During verification, allowlisted items are treated as WARN, not FAIL.
