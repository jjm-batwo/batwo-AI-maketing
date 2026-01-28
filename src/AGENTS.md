<!-- Parent: ../AGENTS.md -->

# Source Code Layer - AI Agents Guide

**Location:** `src/`
**Purpose:** Main application source code organized by Clean Architecture layers + framework integration

---

## Quick Overview

The `src/` directory contains the complete application implementation following **Clean Architecture** principles with strict layer separation:

```
Domain (Pure business logic)
  ↑
Application (Use cases & orchestration)
  ↑
Infrastructure (Adapters) + Presentation (React UI)
  ↑
App Router + API Routes (Framework integration)
```

**Key Principle:** Dependencies flow inward only. Domain has no external dependencies. Application depends only on domain. Infrastructure/Presentation depend on application and domain.

---

## Directory Structure & Purposes

| Directory | Purpose | Type | Scope |
|-----------|---------|------|-------|
| **domain/** | Core business logic (pure, no external deps) | Foundation | ~400 lines/file, ≥95% test coverage |
| **application/** | Use cases, DTOs, service contracts | Logic | Orchestrates domain + external services |
| **infrastructure/** | Database, APIs, auth, adapters | Concrete | Implements application ports |
| **presentation/** | React components, hooks, stores | UI | User-facing interface |
| **app/** | Next.js App Router, API routes | Framework | HTTP/REST layer |
| **lib/** | Utilities, DI container, middleware | Support | Shared helpers |
| **components/ui/** | shadcn/ui primitives | Design System | Reusable UI components |
| **generated/** | Prisma types | Generated | Auto-generated, DO NOT EDIT |
| **types/** | TypeScript types & interfaces | Types | Shared type definitions |

---

## Detailed Subdirectories

### src/domain/ - Core Business Logic

**Files:** 12 entities, 7 value objects, 5 error types, 12 repository interfaces

**Purpose:** Pure business logic without external dependencies. Entities encapsulate domain concepts with state machines and invariants.

**Key Files:**
- `entities/Campaign.ts` - Campaign lifecycle with status transitions
- `entities/Report.ts` - Report aggregation and metrics
- `entities/KPI.ts` - Performance metrics with calculations
- `entities/MetaPixel.ts` - Pixel tracking configuration
- `value-objects/Money.ts` - Multi-currency value with safe arithmetic
- `value-objects/CampaignStatus.ts` - Status state machine
- `errors/DomainError.ts` - Base error class for domain
- `repositories/*.ts` - Port interfaces for persistence

**Development Rules:**
- Private constructors + static factories (`create()`, `restore()`)
- Immutable properties (all `readonly`)
- Validation in factory methods, throw domain errors
- Test-Driven Development mandatory (≥95% coverage)
- NO imports from infrastructure/application/presentation
- NO side effects, pure functions only

**See:** `src/domain/AGENTS.md` for detailed guidance

---

### src/application/ - Use Cases & Orchestration

**Files:** 20+ use cases, 15+ DTOs, 7 port interfaces, 10+ application services

**Purpose:** Business workflow orchestration. Implements all user-facing features by combining domain logic with external services through ports.

**Key Subdirectories:**
- `use-cases/campaign/` - Campaign CRUD + status management (CreateCampaignUseCase, UpdateCampaignUseCase, etc.)
- `use-cases/report/` - Report generation workflows (GenerateWeeklyReportUseCase)
- `use-cases/kpi/` - KPI sync from Meta Ads API (SyncMetaInsightsUseCase)
- `use-cases/pixel/` - Meta Pixel setup workflows (SetupPixelUseCase, SelectPixelUseCase)
- `use-cases/admin/` - Admin operations (user management, payments, refunds)
- `use-cases/ai-team/` - AI development team coordination (IntentClassifier, PMAgentCoordinator, etc.)
- `dto/` - Data Transfer Objects for all domains (CreateCampaignDTO, ReportDTO, etc.)
- `ports/` - External service contracts (IMetaAdsService, IAIService, IEmailService)
- `services/` - Cross-cutting logic (BudgetRecommendationService, QuotaService, AnomalyDetectionService)

**Use Case Pattern:**
```typescript
export class SomeUseCase {
  constructor(
    private repo: ISomeRepository,
    private service: ISomeService
  ) {}

  async execute(dto: InputDTO): Promise<OutputDTO> {
    // 1. Validate input
    // 2. Fetch domain entities
    // 3. Execute domain logic
    // 4. Persist via repository
    // 5. Return DTO
  }
}
```

**Development Rules:**
- Inject all dependencies via constructor
- Use DTOs for all input/output
- Throw domain errors for business violations
- Never return domain entities (wrap in DTOs)
- All external calls go through port interfaces
- Single responsibility per use case

**See:** `src/application/AGENTS.md` for detailed guidance

---

### src/infrastructure/ - Adapters & Persistence

**Files:** 30+ repository implementations, 15+ external service clients, auth configuration, error handling

**Purpose:** Concrete implementations of application ports. Adapts external APIs (Meta, OpenAI, Café24) and database (Prisma) to domain models.

**Key Subdirectories:**
- `database/repositories/` - Prisma repository implementations (PrismaCampaignRepository, etc.)
- `database/mappers/` - Entity ↔ Prisma model converters (CampaignMapper, ReportMapper, etc.)
- `external/meta-ads/` - Meta Ads Graph API client
- `external/meta-pixel/` - Meta Pixel & Conversions API client
- `external/openai/` - OpenAI service for copy generation & analysis
- `external/platforms/cafe24/` - Café24 OAuth & API adapter
- `external/errors/` - Unified error handling from external APIs
- `auth/` - NextAuth.js configuration (Google, Kakao, Facebook providers)
- `email/` - Email delivery via Resend API
- `pdf/` - PDF generation for reports

**Key Patterns:**
```typescript
// Repository implementation
export class PrismaCampaignRepository implements ICampaignRepository {
  constructor(private prisma: PrismaClient) {}

  async save(campaign: Campaign): Promise<Campaign> {
    const raw = CampaignMapper.toPersistence(campaign)
    await this.prisma.campaign.upsert({...})
    return campaign
  }
}

// Mapper (Domain ↔ Prisma)
export class CampaignMapper {
  static toDomain(raw: PrismaCampaign): Campaign {
    return Campaign.restore({...})
  }

  static toPersistence(entity: Campaign): Prisma.CampaignCreateInput {
    return {...}
  }
}
```

**Development Rules:**
- Implement port interfaces ONLY
- Use mappers for entity conversion
- NO business logic in repositories
- Handle external API errors gracefully
- Add retry logic for flaky APIs (Meta, OpenAI)
- Log all external service calls

**See:** `src/infrastructure/AGENTS.md` for detailed guidance

---

### src/presentation/ - React UI Layer

**Files:** 50+ components, 15+ custom hooks, 5+ Zustand stores

**Purpose:** User interface using React 19 + shadcn/ui + Tailwind CSS 4. Implements landing page, dashboard, and feature interfaces.

**Key Subdirectories:**
- `components/landing/` - Public landing page (HeroSection, FeaturesSection, PricingSection, etc.)
- `components/dashboard/` - KPI dashboard and analytics (KPICard, CampaignSummaryTable, etc.)
- `components/campaign/` - Campaign management (CampaignCard, CampaignCreateForm with 4 steps)
- `components/report/` - Report display (ReportList, ReportDetail, ReportDownload)
- `components/pixel/` - Pixel setup UI (PixelSelector, PixelStatus, UniversalScriptCopy)
- `components/quota/` - MVP quota management (QuotaExceededDialog)
- `components/onboarding/` - Onboarding wizard (4 steps: welcome, meta connect, pixel, done)
- `components/admin/` - Admin dashboard (UserManagement, PaymentDashboard, etc.)
- `components/ui/` - Reusable UI primitives (Card, Input, Dialog, Table, etc.)
- `hooks/` - Custom React hooks (useCampaigns, useReports, useDashboardKPI, useQuota)
- `stores/` - Zustand state stores (campaignStore, uiStore, quotaStore)

**Component Pattern:**
```typescript
'use client'

interface SomeComponentProps {
  entity: SomeDTO
  onAction?: () => void
  className?: string
}

export function SomeComponent({
  entity,
  onAction,
  className
}: SomeComponentProps) {
  return (
    <Card className={cn('hover:shadow-lg', className)}>
      {/* Use shadcn/ui components */}
    </Card>
  )
}
```

**Hook Pattern (TanStack Query):**
```typescript
export function useSomeData() {
  return useQuery({
    queryKey: ['some-data'],
    queryFn: async () => {
      const res = await fetch('/api/some')
      if (!res.ok) throw new Error('Failed')
      return res.json() as Promise<SomeDTO[]>
    },
    staleTime: 5 * 60 * 1000
  })
}
```

**Store Pattern (Zustand):**
```typescript
interface SomeStore {
  selected: SomeDTO | null
  filter: string
  setSelected: (item: SomeDTO | null) => void
  setFilter: (filter: string) => void
}

export const useSomeStore = create<SomeStore>(set => ({
  selected: null,
  filter: '',
  setSelected: item => set({ selected: item }),
  setFilter: filter => set({ filter })
}))
```

**Development Rules:**
- Use shadcn/ui components + Tailwind CSS 4
- State via TanStack Query (server) + Zustand (client)
- Props fully typed with TypeScript interfaces
- Use `cn()` utility for conditional Tailwind classes
- Add `'use client'` directive at top of client components
- Test coverage ≥80% for critical components

**See:** `src/presentation/AGENTS.md` for detailed guidance

---

### src/app/ - Next.js Framework Integration

**Purpose:** Next.js App Router pages and API routes. HTTP layer that connects to application logic.

**Structure:**
```
app/
├── (auth)/               # Authentication routes (login, signup)
├── (dashboard)/          # Protected dashboard routes (requires auth)
│   ├── campaigns/
│   ├── reports/
│   ├── pixel/
│   └── admin/           # Admin pages
├── (legal)/              # Legal pages (terms, privacy)
├── api/                  # RESTful API routes
│   ├── campaigns/
│   ├── reports/
│   ├── pixel/            # Meta Pixel endpoints
│   ├── meta/             # Meta Ads integration
│   ├── admin/
│   ├── cron/             # Scheduled jobs
│   ├── internal/         # Internal endpoints
│   ├── webhooks/         # Webhook handlers
│   └── ...
├── layout.tsx            # Root layout
├── page.tsx              # Landing page
├── sitemap.ts            # SEO sitemap
├── robots.ts             # robots.txt
├── not-found.tsx
└── global-error.tsx
```

**API Route Pattern:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { CreateCampaignDTO, createCampaignDTOSchema } from '@/application/dto'
import { CreateCampaignUseCase } from '@/application/use-cases'
import { DI } from '@/lib/di'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = createCampaignDTOSchema.parse(body)

    const useCase = DI.get(CreateCampaignUseCase)
    const result = await useCase.execute(input)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof DomainError) {
      return NextResponse.json(
        { message: error.message },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Development Rules:**
- Validate all input with Zod schemas
- Get use cases from DI container
- Map domain errors → HTTP 422
- Map validation errors → HTTP 400
- Return typed JSON responses
- Use proper HTTP status codes
- Middleware for auth, quota checks

---

### src/lib/ - Utilities & Infrastructure

**Purpose:** Shared utilities, dependency injection, middleware, helpers

**Key Files:**
- `auth.ts` - NextAuth.js configuration
- `prisma.ts` - Prisma client singleton
- `utils.ts` - Common utilities (cn, formatters, etc.)
- `di/` - Dependency injection container
- `middleware/` - Auth, quota, logging middleware
- `utils/retry.ts` - Retry logic for APIs

---

### src/components/ui/ - shadcn/ui Primitives

**Purpose:** Design system components from shadcn/ui

**DO NOT EDIT** - These are scaffolded from shadcn/ui. Modify via:
```bash
npx shadcn-ui@latest add [component]
npx shadcn-ui@latest update [component]
```

**Available Components:** Card, Input, Dialog, Table, Label, Form, Select, Tabs, Separator, Button, Badge, etc.

---

### src/generated/ - Prisma Types

**DO NOT EDIT** - Auto-generated by Prisma

Regenerate with:
```bash
npx prisma generate
```

---

### src/types/ - TypeScript Types

**Purpose:** Shared TypeScript types and interfaces used across layers

---

## Dependency Graph & Flow

### Inbound Dependencies (Allowed)
```
domain/
  ↑
application/
  ↑
infrastructure/ ← implements application ports
  ↑
app/ ← uses infrastructure + application

presentation/ ← uses application DTOs + calls /api/*
  ↑
app/ ← serves presentation components
```

### Prohibited Dependencies
```
❌ domain ← application/infrastructure/presentation
❌ application ← infrastructure (except for DI at app startup)
❌ presentation ← domain/application (except DTOs)
```

---

## Development Workflow

### 1. Starting a New Feature

**For Domain Features (Entities, Value Objects):**
1. Create test in `tests/unit/domain/` first (RED)
2. Implement entity/value object in `src/domain/`
3. Tests pass (GREEN)
4. Refactor (REFACTOR)
5. Create repository interface in `src/domain/repositories/`

**For Use Cases:**
1. Create test in `tests/unit/application/` first (RED)
2. Implement use case in `src/application/use-cases/`
3. Create DTOs in `src/application/dto/`
4. Tests pass (GREEN)
5. Refactor (REFACTOR)

**For API Endpoints:**
1. Create integration test in `tests/integration/` first (RED)
2. Create route in `src/app/api/`
3. Use case from DI container
4. Validate input, execute, return response
5. Tests pass (GREEN)

**For React Components:**
1. Create test in `tests/unit/presentation/` (unit test)
2. Implement component in `src/presentation/components/`
3. Use shadcn/ui + Tailwind CSS 4
4. Export hook from `src/presentation/hooks/` if needed
5. Use in page or component

### 2. Before Every Commit

```bash
# Type check
npm run type-check

# Lint
npm run lint
npm run lint:fix

# Tests
npm test                 # Unit tests
npm run test:int        # Integration tests
npm run test:coverage   # Coverage report

# Build
npm run build

# Format
npm run format
```

### 3. Making Changes

**Domain Changes:**
- Update domain entity/value object
- Update repository interface if needed
- Update tests (≥95% coverage required)
- Update related application DTOs if needed

**Application Changes:**
- Update use case
- Update or create DTOs
- Update or create ports if needed
- Update or create services
- Update tests (≥90% coverage required)

**Infrastructure Changes:**
- Update repository implementation
- Update mapper if needed
- Update error handling
- Update external service client if needed
- Update tests (≥85% coverage required)

**Presentation Changes:**
- Update component
- Update hook if needed
- Update store if needed
- Update or create tests (≥80% for critical components)

**API Route Changes:**
- Update route handler
- Update input validation (Zod schema)
- Update DI usage
- Update error handling
- Create integration test

---

## Testing Structure

```
tests/
├── unit/
│   ├── domain/
│   │   ├── entities/              # ≥95% coverage
│   │   ├── value-objects/         # ≥95% coverage
│   │   └── errors/                # ≥85% coverage
│   ├── application/
│   │   ├── use-cases/             # ≥90% coverage
│   │   └── services/              # ≥90% coverage
│   └── presentation/
│       └── components/            # ≥80% coverage (critical)
├── integration/
│   └── repositories/              # ≥85% coverage
└── e2e/
    └── *.spec.ts                  # Critical user journeys
```

---

## Key Patterns Used

### 1. Repository Pattern (Infrastructure)
Domain entities are persisted through repository interfaces. Infrastructure implements with Prisma + mappers.

### 2. Dependency Injection (App Router)
DI container in `src/lib/di/` provides use cases and services with all dependencies pre-wired.

### 3. Data Transfer Objects (Application)
All API requests/responses use DTOs. Never expose domain entities over HTTP.

### 4. Mapper Pattern (Infrastructure)
Mappers convert between domain entities and Prisma models. Bidirectional: `toDomain()` and `toPersistence()`.

### 5. State Machines (Domain)
Status enums with transition rules prevent invalid state changes (e.g., CampaignStatus).

### 6. Value Objects (Domain)
Immutable objects for domain concepts (Money, DateRange, CampaignStatus). Include validation and operations.

### 7. Port/Adapter (Application/Infrastructure)
External services (Meta, OpenAI) have port interfaces in application/, concrete implementations in infrastructure/.

### 8. TanStack Query + Zustand (Presentation)
Server state via TanStack Query, client state via Zustand. Never mix or duplicate.

---

## Common Tasks

### Adding a New Domain Entity

1. Create `src/domain/entities/NewEntity.ts`
2. Define interfaces: `CreateProps`, `Props`
3. Implement class with:
   - Private constructor
   - Static `create()` with validation
   - Static `restore()` for deserialization
   - Getters with defensive copying
   - Commands (immutable)
   - `toJSON()` serialization
4. Create tests in `tests/unit/domain/entities/NewEntity.test.ts` (≥95% coverage)
5. Create repository interface in `src/domain/repositories/INewEntityRepository.ts`
6. Export from `src/domain/index.ts`

### Adding a New Use Case

1. Create `src/application/use-cases/domain/NewUseCase.ts`
2. Define `InputDTO` and `OutputDTO` in `src/application/dto/`
3. Create tests in `tests/unit/application/use-cases/` (≥90% coverage)
4. Inject repositories and services via constructor
5. Follow pattern: validate → execute → persist → return DTO
6. Export from `src/application/use-cases/index.ts`

### Adding an API Endpoint

1. Create `src/app/api/path/route.ts`
2. Implement POST/GET/PATCH/DELETE handler
3. Validate input with Zod schema
4. Get use case from DI container
5. Execute and return response or error
6. Create integration test in `tests/integration/`
7. Add to API documentation

### Adding a React Component

1. Create `src/presentation/components/domain/ComponentName.tsx`
2. Define props interface (fully typed)
3. Use shadcn/ui components + Tailwind CSS 4
4. Create tests in `tests/unit/presentation/components/`
5. Export from index if in subdirectory
6. Use in pages or other components

---

## Error Handling Strategy

### Domain Errors
```typescript
// Create domain-specific error
export class InvalidCampaignError extends DomainError {
  readonly code = 'INVALID_CAMPAIGN'
  static nameTooLong(max: number): InvalidCampaignError {
    return new InvalidCampaignError(`Name cannot exceed ${max} characters`)
  }
}

// Throw in domain entity
throw InvalidCampaignError.nameTooLong(255)
```

### Validation Errors (Zod)
```typescript
// API route catches ZodError
const input = createCampaignDTOSchema.parse(body)
// Returns 400 if invalid

// HTTP 400: Bad request
return NextResponse.json(
  { message: 'Validation failed', errors: error.errors },
  { status: 400 }
)
```

### Domain Violations (HTTP 422)
```typescript
// When domain error is thrown
if (error instanceof DomainError) {
  return NextResponse.json(
    { message: error.message },
    { status: 422 }
  )
}
```

### Server Errors (HTTP 500)
```typescript
// Unexpected error
return NextResponse.json(
  { message: 'Internal server error' },
  { status: 500 }
)
```

---

## Performance Considerations

### Database
- Use Prisma's `select` to fetch only needed fields
- Add indexes on frequently queried fields
- Batch operations when possible
- Use pagination for large result sets

### API
- Cache responses with appropriate TTL
- Implement retry logic for flaky external APIs (Meta, OpenAI)
- Use background jobs for long-running operations

### UI
- Use TanStack Query staleTime to minimize API calls
- Implement pagination in tables/lists
- Lazy-load images and components
- Debounce search/filter inputs

---

## References

| File | Purpose |
|------|---------|
| `/CLAUDE.md` | Project guidelines (Korean) + team conventions |
| `/AGENTS.md` | Root architecture guide |
| `src/domain/AGENTS.md` | Domain layer detailed guide |
| `src/application/AGENTS.md` | Application layer detailed guide |
| `src/infrastructure/AGENTS.md` | Infrastructure layer detailed guide |
| `src/presentation/AGENTS.md` | Presentation layer detailed guide |
| `prisma/schema.prisma` | Database schema definition |
| `docs/deployment/README.md` | Deployment guide |
| `docs/ai-team/user-guide-ko.md` | AI team Korean guide |

---

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm test                 # Run tests watch mode
npm run test:int        # Integration tests
npm run type-check      # TypeScript check
npm run lint            # ESLint
npm run build           # Production build

# Database
npx prisma migrate dev  # Create migration
npx prisma db seed      # Seed database
npx prisma studio      # Prisma UI

# Code Generation
npx prisma generate    # Generate Prisma types
npx shadcn-ui add [component]  # Add UI component
```

---

## Layer Responsibilities Summary

| Layer | Responsibility | Owner | Test Coverage |
|-------|-----------------|-------|----------------|
| **Domain** | Pure business logic, invariants, state machines | Business Logic Owner | ≥95% |
| **Application** | Use cases, orchestration, DTOs | Feature Developers | ≥90% |
| **Infrastructure** | Database, APIs, adapters | Backend Engineers | ≥85% |
| **Presentation** | UI components, user interactions | Frontend Engineers | ≥80% (critical) |
| **App Router** | HTTP routing, middleware | Full Stack | Integration tests |

---

**Document Version:** 2.0
**Last Updated:** 2026-01-23
**Scope:** Complete source code organization guide
**Status:** Active
