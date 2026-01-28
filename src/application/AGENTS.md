<!-- Parent: ../AGENTS.md -->

# Application Layer - Use Cases & Service Orchestration

## Overview

The **application layer** is the orchestration hub of the clean architecture. It implements all business use cases, manages data transfer between layers, and defines contracts with external services through ports.

**Key Responsibility**: Transform domain logic into executable user workflows while maintaining clean architectural boundaries.

## Purpose

| Domain | Role |
|--------|------|
| **Use Cases** | Implement specific business workflows (CreateCampaign, GenerateReport, SetupPixel, etc.) |
| **DTOs** | Define request/response contracts with minimal knowledge of domain |
| **Ports** | Abstract external service dependencies (Meta Ads, Email, AI, etc.) |
| **Services** | Provide cross-cutting business logic (Budget recommendations, KPI analysis, Quota management) |

## Directory Structure

```
src/application/
├── use-cases/
│   ├── campaign/           # Campaign lifecycle workflows
│   ├── report/             # Report generation workflows
│   ├── kpi/                # KPI & insights synchronization
│   ├── pixel/              # Meta Pixel setup workflows
│   ├── admin/              # Admin/management operations
│   ├── ai-team/            # AI development team command coordination
│   └── index.ts
│
├── dto/                    # Data Transfer Objects
│   ├── campaign/           # Campaign DTOs
│   ├── report/             # Report DTOs
│   ├── kpi/                # KPI DTOs
│   ├── quota/              # Usage quota DTOs
│   ├── pixel/              # Meta Pixel DTOs
│   ├── admin/              # Admin DTOs
│   └── index.ts
│
├── ports/                  # External service contracts
│   ├── IMetaAdsService.ts           # Meta Ads Graph API
│   ├── IMetaPixelService.ts         # Meta Pixel tracking
│   ├── ICAPIService.ts              # Conversions API
│   ├── IPlatformAdapter.ts          # Platform integrations (e.g., Cafe24)
│   ├── IAIService.ts                # OpenAI/Claude API
│   ├── IEmailService.ts             # Email delivery
│   ├── ai-team-port.ts              # AI team coordination
│   └── index.ts
│
├── services/               # Application services
│   ├── BudgetRecommendationService.ts      # Budget allocation logic
│   ├── QuotaService.ts                     # Usage quota enforcement
│   ├── AnomalyDetectionService.ts          # Performance anomalies
│   ├── AnomalyRootCauseService.ts          # Root cause analysis
│   ├── AnomalySegmentAnalysisService.ts    # Segment-level analysis
│   ├── CompetitorBenchmarkService.ts       # Competitive analysis
│   ├── CopyLearningService.ts              # Copy performance learning
│   ├── CampaignAnalyzer.ts                 # Campaign metrics analysis
│   ├── BudgetAlertService.ts               # Budget monitoring alerts
│   ├── ReportSchedulerService.ts           # Scheduled report generation
│   └── index.ts
│
└── index.ts               # Main export barrel
```

## Key Files Table

| File | Purpose | Domain |
|------|---------|--------|
| `use-cases/campaign/*.ts` | Create, read, update, pause, resume campaigns | Campaign lifecycle |
| `use-cases/report/GenerateWeeklyReportUseCase.ts` | Generate AI-powered weekly reports | Reporting |
| `use-cases/kpi/SyncMetaInsightsUseCase.ts` | Sync insights from Meta Ads API | KPI management |
| `use-cases/pixel/SetupPixelUseCase.ts` | Configure Meta Pixel tracking | Pixel setup |
| `use-cases/pixel/SelectPixelUseCase.ts` | User selects/associates pixel | Pixel management |
| `use-cases/admin/*.ts` | User management, payments, refunds | Admin operations |
| `use-cases/ai-team/*` | Command routing, TDD workflows, approval management | AI team coordination |
| `ports/IMetaAdsService.ts` | Contract with Meta Ads Graph API | Meta integration |
| `ports/IMetaPixelService.ts` | Contract with Meta Pixel service | Pixel tracking |
| `ports/IAIService.ts` | Contract with AI service (copy generation, analysis) | AI integration |
| `dto/*` | Request/response DTOs for all domains | Data transfer |
| `services/BudgetRecommendationService.ts` | Industry-based budget recommendations | Budget strategy |
| `services/QuotaService.ts` | MVP usage limit enforcement | Quota management |

## Subdirectories Table

| Directory | Files | Purpose |
|-----------|-------|---------|
| **use-cases/campaign** | 6 files | Campaign CRUD + status management |
| **use-cases/report** | 2 files | Report generation workflows |
| **use-cases/kpi** | 2 files | KPI sync + dashboard queries |
| **use-cases/pixel** | 4 files | Meta Pixel setup & management |
| **use-cases/admin** | 5 files | Admin workflows (users, payments, refunds) |
| **use-cases/ai-team** | 11 files | AI team command coordination & validation |
| **dto/campaign** | 3 files | Campaign create/update/view DTOs |
| **dto/report** | 1 file | Report response DTO |
| **dto/kpi** | 1 file | KPI dashboard DTO |
| **dto/quota** | 1 file | Usage quota status DTO |
| **dto/pixel** | 1 file | Meta Pixel DTO |
| **dto/admin** | 4 files | Admin dashboard, user list, payment DTOs |
| **ports** | 6 files | External service contracts |
| **services** | 10 files | Cross-cutting business logic |

## Use Case Catalog

### Campaign Management
```typescript
// Create campaign with optional Meta sync
CreateCampaignUseCase(campaignRepo, metaAdsService, usageLogRepo)
  → CreateCampaignDTO → CampaignDTO
  → Throws: DuplicateCampaignNameError

// List all campaigns for user
ListCampaignsUseCase(campaignRepo) → CampaignDTO[]

// Get single campaign with full details
GetCampaignUseCase(campaignRepo) → CampaignDTO

// Update campaign properties (name, budget, dates)
UpdateCampaignUseCase(campaignRepo, metaAdsService)
  → UpdateCampaignDTO → CampaignDTO
  → Throws: CampaignNotFoundError, UnauthorizedCampaignAccessError

// Pause active campaign (both local + Meta)
PauseCampaignUseCase(campaignRepo, metaAdsService)
  → Throws: PauseCampaignError

// Resume paused campaign
ResumeCampaignUseCase(campaignRepo, metaAdsService)
  → Throws: ResumeCampaignError
```

### Report Generation
```typescript
// Generate weekly AI-powered report
GenerateWeeklyReportUseCase(campaignRepo, kpiRepo, aiService)
  → GenerateWeeklyReportDTO → ReportDTO
  → Throws: UnauthorizedCampaignError
```

### KPI & Insights Sync
```typescript
// Sync insights from Meta Ads API
SyncMetaInsightsUseCase(campaignRepo, kpiRepo, metaAdsService)
  → Fetches latest metrics and stores

// Get dashboard KPI summary
GetDashboardKPIUseCase(kpiRepo, campaignRepo)
  → DashboardKPIDTO
```

### Meta Pixel Setup
```typescript
// List all Meta Pixels for user
ListUserPixelsUseCase(pixelRepo) → MetaPixelDTO[]

// Select/associate pixel with user
SelectPixelUseCase(pixelRepo) → MetaPixelDTO

// Setup pixel (manual or via platform API)
SetupPixelUseCase(pixelRepo)
  → SetupPixelResultDTO {pixelId, scriptSnippet, platformConnectUrl}
  → Validation: metaPixelId format, setupMode constraints

// Get pixel setup status
GetPixelStatusUseCase(pixelRepo) → PixelStatusDTO
```

### Admin Operations
```typescript
// Get admin dashboard stats
GetAdminDashboardStatsUseCase(userRepo, paymentRepo)
  → AdminDashboardDTO

// List all users (admin only)
ListUsersForAdminUseCase(userRepo) → UserListDTO[]

// Update user role (admin only)
UpdateUserRoleUseCase(userRepo)
  → Throws: UnauthorizedError

// Get payment statistics
GetPaymentStatsUseCase(paymentRepo) → PaymentStatsDTO

// List all payments
ListPaymentsUseCase(paymentRepo) → PaymentDTO[]

// Process refund request
ProcessRefundUseCase(paymentRepo) → { success, message }
```

### AI Team Coordination
```typescript
// Classify user command intent (Korean support)
IntentClassifier
  → Detects: /기능요청, /버그신고, /검증, /배포, etc.
  → Returns: CommandType + parameters

// Process Korean commands to English
ProcessKoreanCommandUseCase
  → Translates Korean directives to system commands

// Route commands to appropriate agents
PMAgentCoordinator
  → Maps CommandType → AgentType + Action
  → Determines: Approval required, TDD enabled, Architecture validation

// Execute TDD workflow (RED → GREEN → REFACTOR)
TDDWorkflowRunner
  → Orchestrates test-driven development cycle
  → Validates test coverage

// Validate clean architecture compliance
ArchitectureValidator
  → Checks: Dependency rules, layer isolation
  → Prevents: Circular dependencies, layer violations

// Run quality gates (tests, lint, security)
QualityGateRunner
  → Sequential: Compile → Lint → Tests → Security

// Generate session report
ReportGenerator
  → Creates: Daily summary, weekly insights, blockers

// Manage GitHub issues (if integrated)
GitHubIssueManager
  → CRUD operations on issues + comments

// Manage approval workflows
ApprovalWorkflow
  → Track: Pending approvals, approval history
  → Enforce: Business rules for specific action types

// Manage security checks
SecurityAgent
  → Scans: Dependencies, env vars, auth patterns
  → Reports: Vulnerabilities, recommendations
```

## Port (Interface) Definitions

### External Service Contracts

```typescript
// Meta Ads Graph API
IMetaAdsService {
  createCampaign(accessToken, adAccountId, input) → MetaCampaignData
  getCampaign(accessToken, campaignId) → MetaCampaignData | null
  getCampaignInsights(accessToken, campaignId, datePreset?) → MetaInsightsData
  updateCampaignStatus(accessToken, campaignId, status) → MetaCampaignData
  updateCampaign(accessToken, campaignId, input) → MetaCampaignData
  deleteCampaign(accessToken, campaignId) → void
}

// Meta Pixel Tracking
IMetaPixelService {
  initializePixel(pixelId, accessToken) → void
  trackEvent(pixelId, event, data) → void
  validatePixelId(pixelId) → boolean
}

// Conversions API (Server-side tracking)
ICAPIService {
  sendEvent(accessToken, pixelId, event, userData) → void
  validateEvent(event) → boolean
}

// Platform Integration (e.g., Cafe24, Shopify)
IPlatformAdapter {
  authenticate(code) → accessToken
  getOrders(accessToken, dateRange) → Order[]
  trackConversion(accessToken, orderId, value) → void
}

// AI Service (Copy generation, analysis)
IAIService {
  generateCampaignCopy(campaignBrief) → string
  analyzePerformance(metrics, insights) → Analysis
  generateReportInsights(kpiData) → string[]
}

// Email Service
IEmailService {
  sendEmail(to, subject, html, text) → void
  sendBatch(recipients, template, data) → void
}

// AI Team Coordination
AITeamPort {
  getSystemStatus() → SystemStatus
  createFeatureRequest(description) → FeatureRequest
  reportBug(description) → BugReport
  runQualityGates() → QualityGateResult
  requestDeployment() → {success, message}
  generateReport(type) → ReportData
}
```

## Application Services

### Business Logic Services

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **BudgetRecommendationService** | Industry-based budget strategies | `generateRecommendation()`, `validateBudget()`, `getIndustryDefaultAOV()` |
| **QuotaService** | MVP usage limit enforcement | `checkQuota()`, `enforceQuota()`, `getFullQuotaStatus()`, `isInTrialPeriod()` |
| **AnomalyDetectionService** | Detect performance anomalies | `detectAnomalies()`, `scoreAnomaly()` |
| **AnomalyRootCauseService** | Analyze root causes | `analyzeRootCause()` |
| **AnomalySegmentAnalysisService** | Segment-level analysis | `analyzeBySegment()` |
| **CompetitorBenchmarkService** | Competitive comparison | `getBenchmarks()`, `comparePerformance()` |
| **CopyLearningService** | Copy performance insights | `analyzeCopyPerformance()`, `generateInsights()` |
| **CampaignAnalyzer** | Campaign metrics analysis | `analyzeCampaign()`, `calculateMetrics()` |
| **BudgetAlertService** | Budget monitoring & alerts | `checkBudgetStatus()`, `sendAlert()` |
| **ReportSchedulerService** | Schedule report generation | `scheduleReport()`, `generateScheduledReport()` |

## Dependency Injections & Flow

### Campaign Creation Flow
```
CreateCampaignUseCase
  ├── ICampaignRepository (from domain)
  ├── IMetaAdsService (external)
  └── IUsageLogRepository (from domain)

Domain Entity: Campaign.create()
  ├── Money value object validation
  └── Campaign invariants check

Meta Sync (if enabled):
  └── IMetaAdsService.createCampaign()

Repository:
  └── ICampaignRepository.save()

Usage Logging:
  └── IUsageLogRepository.log('CAMPAIGN_CREATE')
```

### Report Generation Flow
```
GenerateWeeklyReportUseCase
  ├── ICampaignRepository (from domain)
  ├── IKPIRepository (from domain)
  └── IAIService (external)

Fetch Data:
  ├── Campaign details
  ├── KPI metrics
  └── Anomalies

AI Generation:
  └── IAIService.generateReportInsights()

Format & Return:
  └── ReportDTO
```

### Pixel Setup Flow
```
SetupPixelUseCase
  └── IMetaPixelRepository (from domain)

Validation:
  ├── Meta Pixel ID format (15-16 digits)
  ├── Setup mode validation
  └── Platform specification (for PLATFORM_API mode)

Create/Update:
  └── MetaPixel entity

Generate Result:
  ├── MANUAL mode: Return script snippet
  └── PLATFORM_API mode: Return platform auth URL
```

## Data Transfer Objects (DTOs)

### Campaign DTOs
- **CreateCampaignDTO**: Request to create campaign
- **UpdateCampaignDTO**: Request to update campaign properties
- **CampaignDTO**: Response with campaign details

### Report DTOs
- **ReportDTO**: Weekly report with insights and metrics

### KPI DTOs
- **DashboardKPIDTO**: KPI summary for dashboard

### Quota DTOs
- **QuotaStatusDTO**: Usage and remaining quota per type
- **FullQuotaStatusDTO**: Quota + trial status

### Pixel DTOs
- **MetaPixelDTO**: Pixel details
- **SetupPixelResultDTO**: Setup result with script/URL

### Admin DTOs
- **AdminDashboardDTO**: Admin statistics
- **UserListDTO**: List of users
- **PaymentDTO**: Payment details
- **RefundRequestDTO**: Refund request

## AI Team Workflow Integration

### Command Processing Pipeline
```
User Input (Korean/English)
    ↓
IntentClassifier
    ├── Detect command type (/기능요청, /버그신고, etc.)
    └── Extract parameters
    ↓
ProcessKoreanCommandUseCase (if needed)
    ├── Translate to English
    └── Normalize format
    ↓
PMAgentCoordinator
    ├── Route to agent type
    ├── Determine approval requirement
    └── Setup TDD/Architecture validation flags
    ↓
Agent Execution (Design, QA, Development)
    ├── TDDWorkflowRunner (RED → GREEN → REFACTOR)
    ├── ArchitectureValidator (Clean arch checks)
    └── QualityGateRunner (Tests, lint, security)
    ↓
ApprovalWorkflow (if required)
    ├── Track approval state
    └── Enforce business rules
    ↓
ReportGenerator
    └── Create session summary
```

### Approval Workflow States
```typescript
interface ApprovalState {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  actionType: 'feature_request' | 'deploy' | 'rollback'
  description: string
  requestedBy: string
  approvedBy?: string
  approvalReason?: string
  createdAt: Date
  approvedAt?: Date
}
```

## Key Patterns

### Use Case Pattern
```typescript
export class SomeUseCase {
  constructor(
    private readonly someRepo: ISomeRepository,
    private readonly someService: ISomeService
  ) {}

  async execute(dto: InputDTO): Promise<OutputDTO> {
    // 1. Validate input
    // 2. Fetch domain entities
    // 3. Execute domain logic
    // 4. Call external services if needed
    // 5. Persist changes
    // 6. Return DTO
  }
}
```

### Service Pattern
```typescript
export class SomeService {
  // Pure application logic (no entity loading)
  // May depend on value objects and ports
  // Stateless or minimal state

  calculateSomething(inputs): result
  validateSomething(input): boolean
  generateSomething(data): output
}
```

### Error Handling
```typescript
export class CustomError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CustomError'
  }
}

// Throw domain-specific errors, not generic errors
throw new DuplicateCampaignNameError(campaignName)
throw new QuotaExceededError(type, limit, period)
```

## Architectural Constraints

### Dependency Flow
```
Domain (entities, value objects, repositories)
    ↑
Application (use cases, services, DTOs, ports)
    ↑
Infrastructure (implementations) & Presentation (UI)
```

**Rule**: Application MUST NOT depend on Infrastructure/Presentation. Only the inverse.

### Repository Abstraction
- Use `IXxxRepository` interfaces (defined in domain/)
- Implementation lives in infrastructure/
- Application depends only on interface

### Port Abstraction
- Define service contracts in ports/
- Implementation lives in infrastructure/
- Enables testing with mock implementations

### DTO Boundaries
- Use DTOs for all requests/responses
- DTOs transform domain objects to safe transfer objects
- Hide internal domain structure

## Testing Considerations

| Layer | Test Type | What to Test |
|-------|-----------|--------------|
| **Use Cases** | Unit + Integration | Business flow, error handling, repository interactions |
| **Services** | Unit | Algorithm correctness, edge cases |
| **DTOs** | Integration | Proper transformation of domain → DTO |
| **Ports** | Mock/Stub | Contract verification, error handling |

### Mocking Strategy
```typescript
// Create mocks for all dependencies
const mockCampaignRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  existsByNameAndUserId: jest.fn(),
}

const mockMetaAdsService = {
  createCampaign: jest.fn(),
  updateCampaignStatus: jest.fn(),
}

const useCase = new CreateCampaignUseCase(
  mockCampaignRepo,
  mockMetaAdsService,
  mockUsageLogRepo
)
```

## Performance Considerations

### Quota Checking
- Cache quota limits (rarely change)
- Use database counts efficiently
- Consider time-based caching for period calculations

### Meta Insights Sync
- Batch API calls to Meta
- Store insights in local cache
- Implement retry logic for API failures

### Report Generation
- Parallelize data fetching
- Cache industry benchmarks
- Consider background job for large reports

## Future Extensions

| Feature | Impact | Complexity |
|---------|--------|-----------|
| **Multi-account support** | Campaign, KPI, Pixel repos | Medium |
| **Automation rules** | New use cases, TDD workflow | High |
| **Custom integrations** | More platform adapters | Medium |
| **Advanced analytics** | More services, ML models | High |
| **Webhook handlers** | New use cases, async workflows | Medium |

## Summary

The application layer is the **use case orchestrator**. It:
- ✓ Defines all business workflows (use cases)
- ✓ Abstracts external services (ports)
- ✓ Manages data transfer (DTOs)
- ✓ Provides cross-cutting logic (services)
- ✓ Enforces clean architecture principles
- ✓ Enables testing through dependency injection

Changes here affect: API routes, domain logic flow, external integrations.
