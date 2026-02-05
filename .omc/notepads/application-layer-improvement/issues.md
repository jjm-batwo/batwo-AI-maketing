# Known Issues and Problems

## Before Refactoring

### 1. Massive Code Duplication
- **Files:** GenerateWeeklyReportUseCase, GenerateDailyReportUseCase, GenerateMonthlyReportUseCase
- **Lines duplicated:** ~220 lines across 3 files
- **Impact:** Bug fixes needed to be applied 3 times
- **Solution:** Created BaseReportGenerationUseCase with Template Method pattern

### 2. Inconsistent Error Handling
- **Problem:** Mix of domain errors, generic Error, and custom inline errors
- **Examples:**
  - QuotaExceededError defined in service file (should be domain)
  - BudgetAlertService throws generic Error strings
  - Pixel use cases throw generic Error strings
  - Admin use cases throw generic Error strings
- **Impact:**
  - No type safety for error handling
  - Inconsistent error response format
  - Difficult to distinguish error types in API layer
- **Solution:** Created proper domain error hierarchy

### 3. Silent AI Failures
- **Problem:** Try-catch around AI service with console.warn only
- **Impact:** No monitoring or alerting when AI fails
- **Solution:** Need to add structured logging (TODO)

### 4. Incomplete Type Safety
- **Problem:** Some services use `any` or broad types
- **Impact:** Runtime errors not caught at compile time
- **Solution:** Ongoing - need full type audit

## After Refactoring

### Remaining Issues

1. **Logging Infrastructure Missing**
   - BaseReportGenerationUseCase still uses console.warn
   - Need injectable logger interface
   - Need structured logging format

2. **Campaign Use Case Errors**
   - CampaignNotFoundError, UnauthorizedCampaignAccessError extend Error directly
   - Should extend DomainError for consistency
   - TODO: Refactor in next iteration

3. **ChatService Error Handling**
   - Still uses generic Error
   - Need ChatError domain errors
   - TODO: Create domain errors for chat operations

4. **CreativeTestRecommendationService**
   - Throws generic Error
   - Need proper domain errors
   - TODO: Create RecommendationError hierarchy

5. **No Integration Tests for Refactored Code**
   - BaseReportGenerationUseCase needs tests
   - New domain errors need tests
   - TODO: Add test coverage

## Migration Notes

### Breaking Changes
None - all changes are internal refactoring. External APIs unchanged.

### Dependencies Updated
- QuotaService now imports from @domain/errors
- BudgetAlertService now imports from @domain/errors
- Pixel use cases now import from @domain/errors

### Files Modified
- src/application/use-cases/report/BaseReportGenerationUseCase.ts (NEW)
- src/application/use-cases/report/GenerateWeeklyReportUseCase.ts (REFACTORED)
- src/application/use-cases/report/GenerateDailyReportUseCase.ts (REFACTORED)
- src/application/use-cases/report/GenerateMonthlyReportUseCase.ts (REFACTORED)
- src/domain/errors/QuotaExceededError.ts (NEW)
- src/domain/errors/BudgetAlertError.ts (NEW)
- src/domain/errors/PixelError.ts (NEW)
- src/domain/errors/AdminError.ts (NEW)
- src/domain/errors/index.ts (UPDATED)
- src/application/services/QuotaService.ts (UPDATED)
- src/application/services/BudgetAlertService.ts (UPDATED)
- src/application/use-cases/pixel/SetupPixelUseCase.ts (UPDATED)
