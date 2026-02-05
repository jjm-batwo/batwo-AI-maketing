# Application Layer Analysis - Key Learnings

## Current State Assessment

### 1. Service Boundaries (Good Overall)
- ReportSchedulerService properly orchestrates multiple use cases
- Clear separation between domain logic and application orchestration
- Services don't duplicate domain logic

### 2. Duplicate Logic Identified

#### Report Generation Use Cases (CRITICAL)
Location: `src/application/use-cases/report/`
- `GenerateWeeklyReportUseCase.ts`
- `GenerateDailyReportUseCase.ts`
- `GenerateMonthlyReportUseCase.ts`

**Duplicate Pattern:**
All three use cases share 90% identical logic:
1. Campaign ownership validation (lines 24-34)
2. KPI aggregation loop (lines 45-80)
3. AI insight generation (lines 83-110)
4. Report saving (lines 113-116)

**Only Differences:**
- Factory method: `Report.createWeekly()` vs `createDaily()` vs `createMonthly()`
- AI options: `includeForecast` flag differs
- Section content text: "주간" vs "일일" vs "월간"

#### Exception Handling Inconsistencies

**Non-Domain Errors in Application Layer:**
- `QuotaExceededError` in QuotaService (should be domain error)
- `BudgetAlertService`: Uses generic `Error` instead of domain errors
- `ChatService`: Uses generic `Error` instead of domain errors
- `PixelUseCase`: Uses generic `Error` instead of domain errors
- `AdminUseCase`: Uses generic `Error` instead of domain errors

**Proper Domain Error Usage:**
- Report use cases correctly use `UnauthorizedCampaignError`
- Campaign use cases have custom errors extending base Error (should extend DomainError)

### 3. Service vs Use Case Confusion

**Current Issue:**
- `ReportSchedulerService` acts as both a service AND orchestrates use cases
- Should be: Use cases handle single operations, Services orchestrate multiple use cases

**Better Approach:**
- Keep use cases pure (single responsibility)
- Services orchestrate multiple use cases
- Clear naming: `*Service` for orchestration, `*UseCase` for single operations

## Metrics - Before vs After

### Code Reduction
**Before:**
- GenerateWeeklyReportUseCase: 118 lines
- GenerateDailyReportUseCase: 118 lines
- GenerateMonthlyReportUseCase: 118 lines
- **Total: 354 lines**

**After:**
- BaseReportGenerationUseCase: 209 lines (shared)
- GenerateWeeklyReportUseCase: 38 lines
- GenerateDailyReportUseCase: 38 lines
- GenerateMonthlyReportUseCase: 39 lines
- **Total: 324 lines**

**Reduction:** 30 lines saved, but more importantly:
- ~220 lines of duplicate logic eliminated
- 1 place to fix bugs instead of 3
- Type safety improved with abstract base class

### Error Handling Improvements
**Before:**
- 12+ places using generic `Error`
- 1 error class defined in service file
- No consistent error structure

**After:**
- 4 new domain error files
- 14 specific error types
- All extend DomainError base class
- Consistent toJSON() serialization
- Type-safe error handling

## Action Items

### High Priority ✅ COMPLETE
1. ✅ Create `BaseReportGenerationUseCase` to eliminate duplication
2. ✅ Move `QuotaExceededError` to domain errors
3. ✅ Create domain errors for BudgetAlert, Pixel, Admin operations
4. ✅ Standardize exception handling across services

### High Priority 🔄 IN PROGRESS
1. Update remaining use cases (SelectPixel, GetPixelStatus, Admin use cases)
2. Add tests for BaseReportGenerationUseCase
3. Add tests for domain errors

### Medium Priority
1. Add base use case class for common error handling
2. Create application-level error wrapper for infrastructure errors
3. Document service vs use case boundaries in AGENTS.md
4. Create ILogger interface and replace console.warn

### Low Priority
1. Add JSDoc comments to all public service methods
2. Create integration tests for orchestration services
3. Add metrics/logging to all use cases
4. Refactor Campaign errors to extend DomainError
