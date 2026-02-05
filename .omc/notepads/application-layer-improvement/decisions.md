# Architectural Decisions

## Decision 1: Extract BaseReportGenerationUseCase

**Context:**
Three report generation use cases share 90% identical code, differing only in:
- Report type (daily/weekly/monthly)
- AI insight options
- Content text labels

**Decision:**
Create abstract `BaseReportGenerationUseCase` with template method pattern.

**Rationale:**
- DRY principle: Single source of truth for report generation logic
- Maintainability: Bug fixes apply to all report types
- Testability: Test common logic once
- Extensibility: Easy to add quarterly/yearly reports

**Trade-offs:**
- Slight increase in abstraction complexity
- But eliminates 200+ lines of duplicate code

## Decision 2: Standardize Application Error Hierarchy

**Context:**
Application layer has inconsistent error handling:
- Some use domain errors (correct)
- Some use generic Error (incorrect)
- Some define custom errors in use case files (incorrect)

**Decision:**
Create clear error hierarchy:
```
DomainError (abstract)
├── InvalidCampaignError
├── UnauthorizedCampaignError
├── QuotaExceededError (NEW - move from QuotaService)
├── BudgetAlertError (NEW)
├── PixelSetupError (NEW)
└── ...

ApplicationError (NEW - abstract)
├── UseCaseExecutionError
└── ServiceOrchestrationError
```

**Rationale:**
- Business rule violations = DomainError
- Orchestration failures = ApplicationError
- Infrastructure failures = Wrapped in ApplicationError
- Clear error boundaries for each layer

## Decision 3: Keep ReportSchedulerService as Orchestrator

**Context:**
ReportSchedulerService instantiates use cases directly, which could be seen as violation of dependency inversion.

**Decision:**
Keep current approach but document it clearly as "orchestration service pattern".

**Rationale:**
- Use cases are pure functions (no state)
- Instantiating them is cheap and clear
- Alternative (DI all use cases) would create massive constructor
- This pattern is acceptable for application services

**Constraint:**
Document this pattern in AGENTS.md for consistency.

## Decision 4: Date Range Calculation in Service vs Use Case

**Context:**
ReportSchedulerService calculates date ranges (lines 88-104), then passes to use cases.

**Decision:**
Keep date calculation in service layer.

**Rationale:**
- Scheduling logic (what period to report on) is service concern
- Use cases accept date ranges as input (flexible)
- Service can schedule "last 7 days" or "last Monday-Sunday"
- Separation of concerns maintained

## Decision 5: AI Failure Handling Strategy

**Context:**
All report use cases have try-catch around AI service with console.warn fallback.

**Decision:**
Keep silent failure pattern for AI insights but add structured logging.

**Rationale:**
- Reports should generate even if AI unavailable
- AI insights are enhancement, not requirement
- But need observability for debugging
- Change from console.warn to proper logger

**Implementation:**
Add optional logger injection to use cases.
