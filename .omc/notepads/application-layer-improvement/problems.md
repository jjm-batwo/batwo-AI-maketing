# Current Blockers and Challenges

## High Priority Blockers

### 1. Type Safety for Admin Use Cases (PARTIALLY FIXED)
**Status:** In Progress
**Problem:** Admin use cases still need updates to use new domain errors
**Files affected:**
- src/application/use-cases/admin/UpdateUserRoleUseCase.ts
- src/application/use-cases/admin/ProcessRefundUseCase.ts

**Next steps:**
1. Read each file
2. Replace generic Error with new AdminError types
3. Verify type safety

### 2. Pixel Use Case Updates Needed (PARTIALLY FIXED)
**Status:** In Progress
**Problem:** Some pixel use cases not yet updated
**Files affected:**
- src/application/use-cases/pixel/SelectPixelUseCase.ts
- src/application/use-cases/pixel/GetPixelStatusUseCase.ts

**Next steps:**
1. Read each file
2. Replace generic Error with PixelError types
3. Test error handling

## Medium Priority Challenges

### 3. No Logging Interface
**Status:** Not Started
**Problem:** BaseReportGenerationUseCase uses console.warn
**Impact:** No monitoring in production

**Solution needed:**
1. Create ILogger port in application/ports/
2. Inject logger into use cases
3. Use structured logging format
4. Add log levels (error, warn, info, debug)

**Example:**
```typescript
interface ILogger {
  error(message: string, context?: unknown): void
  warn(message: string, context?: unknown): void
  info(message: string, context?: unknown): void
  debug(message: string, context?: unknown): void
}
```

### 4. Campaign Error Hierarchy Inconsistent
**Status:** Not Started
**Problem:** Campaign-related errors extend Error directly, not DomainError
**Files:**
- src/application/use-cases/campaign/UpdateCampaignUseCase.ts
- src/application/use-cases/campaign/PauseCampaignUseCase.ts
- src/application/use-cases/campaign/ResumeCampaignUseCase.ts
- src/application/use-cases/campaign/CreateCampaignUseCase.ts

**Impact:** Inconsistent error handling across domain

**Solution:**
1. Create CampaignError extends DomainError
2. Refactor existing errors to extend CampaignError
3. Move to domain/errors/ directory

## Low Priority Challenges

### 5. Test Coverage Gaps
**Status:** Not Started
**Tests needed:**
1. BaseReportGenerationUseCase unit tests
2. Integration tests for report generation
3. Error handling edge cases
4. Domain error serialization tests

### 6. Documentation Needs Update
**Status:** Not Started
**Files to update:**
- src/application/AGENTS.md (error handling guidelines)
- CLAUDE.md (update with new patterns)
- docs/plans/PLAN_batwo-ai-marketing.md

### 7. AI Service Error Wrapping
**Status:** Not Started
**Problem:** AI service failures caught but not properly logged/monitored
**Solution:**
1. Create AIServiceError domain error
2. Wrap AI failures with context
3. Add retry logic for transient failures
4. Add circuit breaker pattern

## Technical Debt

### TD-1: ReportSchedulerService Instantiates Use Cases
**Severity:** Low
**Description:** Service creates use case instances directly instead of DI
**Impact:** Harder to mock in tests
**Decision:** Acceptable pattern for stateless use cases (documented)

### TD-2: No Application-Level Error Wrapper
**Severity:** Medium
**Description:** Infrastructure errors not wrapped consistently
**Impact:** Leaky abstraction - domain layer shouldn't know about DB errors
**Solution:** Create ApplicationError for wrapping infrastructure failures

### TD-3: Inconsistent DTO Validation
**Severity:** Medium
**Description:** Some DTOs validated in use case, some in domain entity
**Impact:** Unclear where validation should happen
**Solution:** Standardize validation at use case input boundary

## Questions for Architect Review

1. Should we create ILogger interface or use third-party (winston, pino)?
2. Should CampaignError move to domain/errors or stay in use-case files?
3. Should we add Application-level error wrapper for all use cases?
4. Should DTOs have their own validation layer (class-validator)?
5. Should we add @throws JSDoc tags to document error types?
