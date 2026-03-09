# AGENTS.md - 바투 AI 마케팅 솔루션 (Batwo)

**Project**: Meta Ads Campaign Automation for E-commerce
**Last Updated**: 2026-01-23
**Repository**: `/Users/jm/batwo-maketting service-saas`

---

## Purpose

This document provides comprehensive guidance for AI agents working on the Batwo project. It defines the project architecture, file structure, development patterns, testing requirements, and key patterns for maintaining code quality and consistency.

**Key Responsibilities:**
- Maintain clean architecture layers (domain → application → infrastructure → presentation)
- Follow TDD strictly: RED → GREEN → REFACTOR
- Adhere to the Korean project conventions
- Ensure TypeScript type safety and Prisma consistency
- Write E2E tests with Playwright for critical flows
- Document all changes for the project team

---

## Project Overview

**Stack**: Next.js 16.1 + React 19.2 + TypeScript 5.x + PostgreSQL + Prisma 7.x + NextAuth.js v5
**Pattern**: Clean Architecture with strict layer separation
**Language**: Primary: TypeScript | Docs: Korean & English

**Key Features**:
- Meta Ads campaign automation and KPI tracking
- Weekly AI-generated performance reports
- Real-time dashboard with Meta Insights sync
- Meta pixel installation (one-click setup)
- Platform integrations (Cafe24 planned)
- Multi-language landing page with conversion optimization

---

## Key Files Reference

| File | Purpose | Owner |
|------|---------|-------|
| `AGENTS.md` | Project guidelines and architecture reference | 개발팀 |
| `package.json` | Dependencies, scripts, Prisma seed config | DevOps |
| `tsconfig.json` | TypeScript paths, compiler options | DevOps |
| `next.config.ts` | Next.js configuration (Turbopack, compression) | DevOps |
| `vitest.config.ts` | Unit test configuration | QA |
| `vitest.config.integration.ts` | Integration test configuration | QA |
| `prisma/schema.prisma` | Database schema (PostgreSQL) | DBA |
| `prisma/seed.ts` | Database seeding script | DevOps |
| `.env.example` | Environment template (Meta API, Auth, DB) | DevOps |
| `playwright.config.ts` | E2E test configuration | QA |

---

## Directory Structure

### Root Level

```
batwo/
├── AGENTS.md                 # Project guidelines (MUST READ)
├── AGENTS.md                 # This file
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── next.config.ts            # Next.js config
├── vitest.config.ts          # Unit test config
├── vitest.config.integration.ts
├── playwright.config.ts      # E2E test config
├── prisma/                   # Database
├── src/                      # Source code (Clean Architecture)
├── tests/                    # Test files
├── docs/                     # Documentation
├── scripts/                  # Utility scripts
├── public/                   # Static assets
└── .opencode/                # OpenCode local config
```

### `/src` - Clean Architecture Layers

| Directory | Purpose | Dependencies | Type |
|-----------|---------|--------------|------|
| `src/domain/` | Core business logic, no external deps | None | **Foundation** |
| `src/application/` | Use cases, DTOs, business rules | domain | **Logic** |
| `src/infrastructure/` | Adapters: DB, Auth, APIs | domain, application | **Concrete** |
| `src/presentation/` | React components, hooks, stores | all layers | **UI** |
| `src/app/` | Next.js App Router & API routes | all layers | **Framework** |
| `src/lib/` | Utilities, middleware, DI container | varies | **Support** |
| `src/components/ui/` | shadcn/ui primitives | React | **Design System** |

#### Domain Layer (`src/domain/`)

```
domain/
├── entities/              # Core business objects
│   ├── Campaign.ts        # Campaign aggregate
│   ├── Report.ts          # Report generation
│   ├── KPI.ts             # Performance metrics
│   ├── MetaPixel.ts       # Pixel configuration
│   ├── User.ts            # User aggregate
│   └── ...
├── value-objects/         # Immutable value types
│   ├── Money.ts           # Currency + amount
│   ├── DateRange.ts       # Period management
│   ├── Percentage.ts      # Percentage calculations
│   ├── CampaignStatus.ts  # Status enum
│   ├── CampaignObjective.ts
│   └── ...
├── repositories/          # Repository interfaces (ports)
│   ├── ICampaignRepository.ts
│   ├── IReportRepository.ts
│   ├── IUsageLogRepository.ts
│   └── ...
├── errors/                # Domain-specific exceptions
│   ├── DomainError.ts     # Base class
│   ├── InvalidCampaignError.ts
│   ├── BudgetExceededError.ts
│   └── ...
└── index.ts               # Public exports
```

**Rules**:
- NO external dependencies (no Prisma, NextAuth, etc.)
- NO React imports
- Pure TypeScript/business logic only
- Test coverage: ≥95%

#### Application Layer (`src/application/`)

```
application/
├── use-cases/             # Business workflows
│   ├── campaign/
│   │   ├── CreateCampaignUseCase.ts
│   │   ├── GetCampaignUseCase.ts
│   │   └── index.ts
│   ├── report/
│   │   ├── GenerateWeeklyReportUseCase.ts
│   │   └── index.ts
│   ├── kpi/
│   │   ├── SyncMetaInsightsUseCase.ts
│   │   └── index.ts
│   └── ...
├── dto/                   # Data Transfer Objects
│   ├── campaign/
│   │   ├── CreateCampaignDTO.ts
│   │   ├── CampaignDTO.ts
│   │   └── index.ts
│   ├── report/
│   ├── kpi/
│   ├── quota/
│   └── ...
├── ports/                 # External service interfaces
│   ├── IMetaAdsService.ts
│   ├── IEmailService.ts
│   ├── IOpenAIService.ts
│   └── ...
└── index.ts
```

**Rules**:
- Orchestrates domain objects + external services
- Implements business rules using ports/interfaces
- Throws domain errors for error handling
- Test coverage: ≥90%

#### Infrastructure Layer (`src/infrastructure/`)

```
infrastructure/
├── database/
│   ├── repositories/      # Prisma implementations
│   │   ├── PrismaCampaignRepository.ts
│   │   ├── PrismaReportRepository.ts
│   │   ├── PrismaUsageLogRepository.ts
│   │   └── ...
│   ├── mappers/           # Entity ↔ Prisma model mappers
│   │   ├── CampaignMapper.ts
│   │   ├── ReportMapper.ts
│   │   └── ...
│   └── index.ts
├── external/
│   ├── meta-ads/          # Meta Ads API wrapper
│   │   ├── MetaAdsClient.ts
│   │   ├── types.ts
│   │   └── index.ts
│   ├── openai/            # OpenAI API wrapper
│   │   ├── OpenAIClient.ts
│   │   └── index.ts
│   ├── email/             # Email service (Resend)
│   ├── errors/            # API error handling
│   └── index.ts
├── auth/
│   ├── providers/         # NextAuth providers config
│   ├── callbacks/         # NextAuth callbacks
│   └── ...
└── index.ts
```

**Rules**:
- Implements repository interfaces (ICampaignRepository, etc.)
- Adapts external APIs to domain models via mappers
- Handles infrastructure-specific errors
- Test coverage: ≥85%

#### Presentation Layer (`src/presentation/`)

```
presentation/
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── landing/           # Landing page sections
│   │   ├── LandingHeader.tsx
│   │   ├── HeroSection.tsx
│   │   ├── FeaturesSection.tsx
│   │   ├── PixelSetupStep.tsx (onboarding)
│   │   └── ...
│   ├── campaign/
│   │   ├── CampaignList.tsx
│   │   ├── CampaignCreateForm/
│   │   │   ├── index.tsx
│   │   │   ├── Step1BusinessInfo.tsx
│   │   │   ├── Step2TargetAudience.tsx
│   │   │   └── Step4Review.tsx
│   │   └── ...
│   ├── report/
│   │   ├── ReportList.tsx
│   │   ├── ReportDetail.tsx
│   │   └── ...
│   ├── dashboard/
│   │   ├── AIInsights.tsx
│   │   └── ...
│   ├── pixel/             # Meta Pixel components
│   │   ├── PixelSelector.tsx
│   │   ├── PixelStatus.tsx
│   │   └── UniversalScriptCopy.tsx
│   ├── quota/
│   │   └── QuotaExceededDialog.tsx
│   └── index.ts
├── hooks/                 # React hooks (TanStack Query)
│   ├── useCampaigns.ts
│   ├── useReports.ts
│   ├── useDashboardKPI.ts
│   ├── useQuota.ts
│   └── ...
├── stores/                # Zustand state management
│   ├── campaignStore.ts
│   ├── uiStore.ts
│   ├── quotaStore.ts
│   └── ...
└── index.ts
```

**Rules**:
- React components use shadcn/ui + Tailwind CSS 4
- State via TanStack Query (server) + Zustand (client)
- Props are typed with TypeScript interfaces
- Test coverage: ≥80% for critical components

#### App Router & API (`src/app/`)

```
app/
├── (auth)/                # Auth routes
├── (dashboard)/           # Dashboard routes (protected)
│   ├── layout.tsx
│   ├── campaigns/
│   │   ├── new/page.tsx   # Campaign creation wizard
│   │   └── ...
│   ├── reports/
│   │   └── [id]/page.tsx
│   └── ...
├── (legal)/               # Legal routes
│   ├── terms/page.tsx
│   └── privacy/page.tsx
├── api/                   # API routes
│   ├── auth/[...nextauth]/route.ts
│   ├── campaigns/route.ts
│   ├── reports/[id]/route.ts
│   ├── quota/route.ts
│   ├── meta/
│   │   └── accounts/route.ts
│   ├── pixel/             # Pixel API endpoints
│   │   ├── route.ts       # GET/POST /api/pixel
│   │   ├── [id]/route.ts
│   │   └── [id]/event/route.ts
│   ├── platform/
│   │   └── cafe24/        # Platform integrations
│   │       ├── auth/route.ts
│   │       └── callback/route.ts
│   ├── webhooks/
│   │   └── cafe24/route.ts
│   └── ...
├── layout.tsx             # Root layout
├── page.tsx               # Landing page
├── sitemap.ts
├── robots.ts
├── not-found.tsx
├── global-error.tsx
└── ...
```

**Rules**:
- API routes follow REST conventions
- Request/response validation via Zod DTOs
- Proper HTTP status codes and error responses
- Middleware for auth, quota checks

#### Lib & Utilities (`src/lib/`)

```
lib/
├── auth.ts                # NextAuth.js v5 configuration
├── prisma.ts              # Prisma client singleton
├── utils.ts               # Common utilities (cn, etc.)
├── di/
│   └── index.ts           # Dependency injection setup
├── middleware/
│   ├── withQuotaCheck.ts  # Rate limiting middleware
│   └── index.ts
└── utils/
    ├── retry.ts           # Retry logic for APIs
    └── index.ts
```

---

### `/tests` - Testing Structure

```
tests/
├── unit/                  # Unit tests (domain, application)
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Campaign.test.ts
│   │   │   └── ...
│   │   └── value-objects/
│   │       ├── Money.test.ts
│   │       └── ...
│   ├── application/
│   │   └── use-cases/
│   │       ├── CreateCampaignUseCase.test.ts
│   │       └── ...
│   └── lib/
│       └── utils.test.ts
├── integration/          # Integration tests (repositories)
│   └── repositories/
│       ├── PrismaCampaignRepository.test.ts
│       └── ...
└── e2e/                  # End-to-end tests (Playwright)
    ├── auth.spec.ts      # Auth flow
    ├── campaign.spec.ts  # Campaign creation
    ├── reporting.spec.ts # Report generation
    └── pixel.spec.ts     # Pixel installation
```

**Test Coverage Targets**:
- Domain: ≥95%
- Application: ≥90%
- Infrastructure: ≥85%
- E2E: Critical user journeys (100%)

---

### `/docs` - Documentation

```
docs/
├── plans/
│   ├── PLAN_batwo-ai-marketing.md
│   ├── PLAN_mvp-completion.md
│   ├── PLAN_production-deployment.md
│   ├── PLAN_phase1_dashboard_chart_data.md
│   └── ...
├── deployment/
│   ├── README.md
│   ├── VERCEL_ENV_SETUP.md
│   ├── BRANCH_STRATEGY.md
│   ├── DATABASE_MIGRATION.md
│   ├── PRODUCTION_CHECKLIST.md
│   └── ROLLBACK_STRATEGY.md
├── ai-team/
│   ├── user-guide-ko.md  # Korean guide for AI team
│   └── tcrei-templates.md
├── ux-reports/
│   └── audit-2026-01-13.md
└── meta-app-review-plan.md  # (삭제됨 - App Review 통과 완료)
```

---

### `/prisma` - Database Configuration

```
prisma/
├── schema.prisma         # PostgreSQL schema
├── seed.ts               # Database seed script
├── migrations/           # Database migrations (auto-generated)
└── ...
```

**Database Models**:
- User (Global roles: USER, ADMIN, SUPER_ADMIN)
- Account, Session (NextAuth.js v5)
- Campaign, Report, KPI (Core entities)
- MetaAdAccount, MetaPixel (Meta integration)
- Subscription (Billing)
- UsageLog (Rate limiting)

---

### `/scripts` - Utility Scripts

```
scripts/
├── meta-warmup.ts        # Keeps Meta token fresh (periodic calls)
├── exchange-token.ts     # Manual token exchange/debugging
└── ...
```

---

### `/public` - Static Assets

```
public/
├── images/
├── icons/
└── ...
```

---

## Development Workflow

### 1. Start Development

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env.local

# Run development server
npm run dev

# In another terminal: database migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### 2. Feature Development (TDD)

**Mandatory Process**:

```
RED   → Write failing test first
GREEN → Implement minimum code to pass
REFACTOR → Clean code while tests pass
```

**Steps**:

```bash
# 1. Write test
# tests/unit/domain/entities/Campaign.test.ts
describe('Campaign', () => {
  it('should create campaign with valid budget', () => {
    const campaign = new Campaign({
      name: 'Test',
      budget: Money.from(100_000, 'KRW')
    });
    expect(campaign.budget.amount).toBe(100_000);
  });
});

# 2. Run tests (watch mode)
npm test

# 3. Implement domain entity
# src/domain/entities/Campaign.ts
export class Campaign {
  constructor(props: CampaignProps) {
    this.budget = props.budget;
  }
}

# 4. Tests pass - refactor if needed
npm test

# 5. Add integration tests if needed
npm run test:integration
```

### 3. Code Review Checklist

Before committing:

```bash
# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format

# Unit tests
npm test

# Coverage report
npm run test:coverage

# Build
npm run build
```

### 4. Commit Guidelines

**Format**: `[type]: [description]`

```
feat: add Campaign entity
fix: handle database unavailability gracefully
refactor: simplify Money value object
test: add Campaign creation tests
docs: update AGENTS.md
```

See project conventions for team-specific commit guidelines.

---

## Common Development Patterns

### 1. Creating a New Domain Entity

**Location**: `src/domain/entities/`

```typescript
// NewEntity.ts
export class NewEntity {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly status: EntityStatus,
    readonly createdAt: Date
  ) {}

  static create(props: CreateProps): NewEntity {
    // Validation
    if (!props.name || props.name.trim().length === 0) {
      throw new InvalidEntityError('Name is required');
    }

    return new NewEntity(
      generateId(),
      props.name,
      EntityStatus.ACTIVE,
      new Date()
    );
  }

  updateName(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new InvalidEntityError('Name is required');
    }
    (this as any).name = newName;
  }
}

// Test: src/tests/unit/domain/entities/NewEntity.test.ts
describe('NewEntity', () => {
  it('should create entity with valid props', () => {
    const entity = NewEntity.create({ name: 'Test' });
    expect(entity.name).toBe('Test');
    expect(entity.status).toBe(EntityStatus.ACTIVE);
  });

  it('should throw error with empty name', () => {
    expect(() => NewEntity.create({ name: '' }))
      .toThrow(InvalidEntityError);
  });
});
```

**Rules**:
- Private constructor + factory method (create)
- Immutable properties (readonly)
- Self-validating (throw domain errors)
- No external dependencies

### 2. Creating a Use Case

**Location**: `src/application/use-cases/`

```typescript
// CreateNewEntityUseCase.ts
export class CreateNewEntityUseCase {
  constructor(
    private repository: INewEntityRepository,
    private logger: ILogger
  ) {}

  async execute(input: CreateNewEntityDTO): Promise<NewEntityDTO> {
    // Validate input
    if (!input.name) throw new InvalidInputError('Name required');

    // Create domain entity
    const entity = NewEntity.create({ name: input.name });

    // Persist via repository (port)
    await this.repository.save(entity);

    this.logger.info(`Entity created: ${entity.id}`);

    // Return DTO
    return NewEntityMapper.toPersistence(entity);
  }
}

// Test: src/tests/unit/application/use-cases/CreateNewEntityUseCase.test.ts
describe('CreateNewEntityUseCase', () => {
  let useCase: CreateNewEntityUseCase;
  let mockRepository: Mock<INewEntityRepository>;
  let mockLogger: Mock<ILogger>;

  beforeEach(() => {
    mockRepository = {
      save: vi.fn().mockResolvedValue(undefined)
    };
    mockLogger = { info: vi.fn() };
    useCase = new CreateNewEntityUseCase(mockRepository, mockLogger);
  });

  it('should create and persist entity', async () => {
    const result = await useCase.execute({ name: 'Test' });

    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.name).toBe('Test');
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should throw error with empty name', async () => {
    await expect(useCase.execute({ name: '' }))
      .rejects.toThrow(InvalidInputError);
  });
});
```

**Rules**:
- Inject dependencies via constructor
- Single responsibility
- Throw domain/application errors for failure cases
- Return DTOs (not domain entities)
- All external calls are via ports (interfaces)

### 3. Creating a Repository Implementation

**Location**: `src/infrastructure/database/repositories/`

```typescript
// PrismaNewEntityRepository.ts
export class PrismaNewEntityRepository implements INewEntityRepository {
  constructor(private prisma: PrismaClient) {}

  async save(entity: NewEntity): Promise<void> {
    const raw = NewEntityMapper.toPersistence(entity);

    await this.prisma.newEntity.upsert({
      where: { id: entity.id },
      update: raw,
      create: raw
    });
  }

  async findById(id: string): Promise<NewEntity | null> {
    const raw = await this.prisma.newEntity.findUnique({
      where: { id }
    });

    return raw ? NewEntityMapper.toDomain(raw) : null;
  }
}

// Mapper: src/infrastructure/database/mappers/NewEntityMapper.ts
export class NewEntityMapper {
  static toDomain(raw: PrismaNewEntity): NewEntity {
    // Map Prisma model back to domain entity
    return new NewEntity(
      raw.id,
      raw.name,
      raw.status as EntityStatus,
      raw.createdAt
    );
  }

  static toPersistence(entity: NewEntity): PrismaNewEntityCreateInput {
    // Map domain entity to Prisma input
    return {
      id: entity.id,
      name: entity.name,
      status: entity.status,
      createdAt: entity.createdAt
    };
  }
}

// Test: src/tests/integration/repositories/PrismaNewEntityRepository.test.ts
describe('PrismaNewEntityRepository', () => {
  let repository: PrismaNewEntityRepository;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    repository = new PrismaNewEntityRepository(prisma);
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should save and retrieve entity', async () => {
    const entity = NewEntity.create({ name: 'Test' });
    await repository.save(entity);

    const retrieved = await repository.findById(entity.id);
    expect(retrieved?.name).toBe('Test');
  });
});
```

**Rules**:
- Implement repository interface (port)
- Use mappers to convert between domain and persistence models
- Handle database errors gracefully
- Test with real database (integration tests)

### 4. Creating an API Endpoint

**Location**: `src/app/api/`

```typescript
// src/app/api/new-entities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CreateNewEntityDTO, createNewEntityDTOSchema } from '@application/dto';
import { CreateNewEntityUseCase } from '@application/use-cases';
import { DI } from '@lib/di';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const input = createNewEntityDTOSchema.parse(body);

    // Get use case from DI container
    const useCase = DI.get(CreateNewEntityUseCase);

    // Execute
    const result = await useCase.execute(input);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Validation failed', errors: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof DomainError) {
      return NextResponse.json(
        { message: error.message },
        { status: 422 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Rules**:
- Validate input with Zod schemas
- Get use cases from DI container
- Handle domain errors → HTTP 422
- Handle validation errors → HTTP 400
- Log errors appropriately

### 5. Creating React Components

**Location**: `src/presentation/components/`

```typescript
// src/presentation/components/NewEntityCard.tsx
'use client';

import { NewEntityDTO } from '@application/dto';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface NewEntityCardProps {
  entity: NewEntityDTO;
  onClick?: () => void;
  className?: string;
}

export function NewEntityCard({
  entity,
  onClick,
  className
}: NewEntityCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn('cursor-pointer hover:shadow-lg transition', className)}
    >
      <CardHeader>
        <CardTitle>{entity.name}</CardTitle>
      </CardHeader>
      <div className="px-6 pb-4">
        <p className="text-sm text-gray-600">{entity.status}</p>
        <p className="text-xs text-gray-400 mt-2">
          Created: {new Date(entity.createdAt).toLocaleDateString()}
        </p>
      </div>
    </Card>
  );
}

// Test: src/tests/unit/presentation/components/NewEntityCard.test.tsx
describe('NewEntityCard', () => {
  it('should render entity name', () => {
    const entity = { name: 'Test', status: 'ACTIVE', createdAt: new Date() };
    const { getByText } = render(<NewEntityCard entity={entity} />);

    expect(getByText('Test')).toBeInTheDocument();
  });

  it('should call onClick handler', () => {
    const entity = { name: 'Test', status: 'ACTIVE', createdAt: new Date() };
    const onClick = vi.fn();
    const { getByRole } = render(
      <NewEntityCard entity={entity} onClick={onClick} />
    );

    userEvent.click(getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

**Rules**:
- Use shadcn/ui components
- Tailwind CSS 4 for styling
- Props are fully typed
- Use `cn()` utility for conditional classes
- Export for preview in Storybook if applicable

### 6. Using TanStack Query Hooks

**Location**: `src/presentation/hooks/`

```typescript
// src/presentation/hooks/useNewEntities.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { NewEntityDTO } from '@application/dto';

export function useNewEntities() {
  return useQuery({
    queryKey: ['new-entities'],
    queryFn: async () => {
      const res = await fetch('/api/new-entities');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<NewEntityDTO[]>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
}

export function useCreateNewEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateNewEntityDTO) => {
      const res = await fetch('/api/new-entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      return res.json() as Promise<NewEntityDTO>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-entities'] });
    }
  });
}
```

**Rules**:
- Use query key arrays for automatic invalidation
- Set appropriate `staleTime` based on data freshness
- Implement error handling in `mutationFn`
- Invalidate related queries on mutations
- Export separate hooks for queries and mutations

### 7. Using Zustand Stores

**Location**: `src/presentation/stores/`

```typescript
// src/presentation/stores/newEntityStore.ts
import { create } from 'zustand';
import { NewEntityDTO } from '@application/dto';

interface NewEntityStore {
  selectedEntity: NewEntityDTO | null;
  filter: string;
  setSelectedEntity: (entity: NewEntityDTO | null) => void;
  setFilter: (filter: string) => void;
  reset: () => void;
}

export const useNewEntityStore = create<NewEntityStore>((set) => ({
  selectedEntity: null,
  filter: '',

  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  setFilter: (filter) => set({ filter }),
  reset: () => set({ selectedEntity: null, filter: '' })
}));
```

**Rules**:
- Use Zustand for client-side UI state only
- Server state via TanStack Query
- Keep stores small and focused
- Export custom hooks with `use*` prefix

### 8. RAG System & Knowledge Base Architecture

**Location**: `src/application/tools/queries/`, `src/infrastructure/knowledge/`, `prisma/seeds/marketing-knowledge/`

The **Retrieval-Augmented Generation (RAG)** system enhances the AI agent with specific 2026 Meta Ads algorithm logic (Lattice, GEM, Andromeda, Entity ID, etc.) and diagnostic resolutions.

**Core Components:**
1. **Knowledge Ingestion (`KnowledgeIngestionService.ts`)**: Parses markdown files, chunks text, generates embeddings via `fetch`-based `OpenAIEmbeddingService`, and upserts to PostgreSQL `pgvector`.
2. **Knowledge Base Repository (`PrismaKnowledgeBaseRepository.ts`)**: Performs cosine distance vector searches using `pgvector` operators (`<=>`).
3. **Agent Search Tool (`searchKnowledgeBase.tool.ts`)**: 18th Tool available to the `ConversationalAgentService` which allows the AI to query context based on the user's intent classified as `KNOWLEDGE_QUERY`.
4. **Seed Files (`prisma/seeds/marketing-knowledge/*.md`)**: Source of truth for marketing guidelines. Must conform to the `00-topic.md` filename and `# Title` H1 standard (Verified by `verify-knowledge-documents` skill).

**Workflow**:
```bash
# Seed the knowledge base into the database
npm run seed:knowledge
```

---

## Testing Guide

### Unit Tests (Vitest)

```bash
npm test                    # Watch mode
npm run test:run           # Run once
npm run test:coverage      # With coverage
npm run test:unit          # Unit tests only
```

**File Structure**:
```
tests/unit/
├── domain/
│   ├── entities/
│   │   ├── Campaign.test.ts
│   │   ├── Report.test.ts
│   │   └── ...
│   └── value-objects/
│       ├── Money.test.ts
│       └── ...
└── application/
    └── use-cases/
        ├── CreateCampaignUseCase.test.ts
        └── ...
```

**Example**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Campaign } from '@domain/entities';
import { InvalidCampaignError } from '@domain/errors';

describe('Campaign', () => {
  it('should create valid campaign', () => {
    const campaign = Campaign.create({
      name: 'Test Campaign',
      budget: 100_000,
      objective: 'SALES'
    });

    expect(campaign.name).toBe('Test Campaign');
    expect(campaign.budget).toBe(100_000);
  });

  it('should throw error for invalid name', () => {
    expect(() =>
      Campaign.create({
        name: '',
        budget: 100_000,
        objective: 'SALES'
      })
    ).toThrow(InvalidCampaignError);
  });
});
```

### Integration Tests

```bash
npm run test:integration
```

**Location**: `tests/integration/`

**Focus**: Repository implementations, database mappers

```typescript
describe('PrismaCampaignRepository', () => {
  let repo: PrismaCampaignRepository;
  let prisma: PrismaClient;

  beforeEach(async () => {
    prisma = new PrismaClient();
    repo = new PrismaCampaignRepository(prisma);

    // Clean database
    await prisma.campaign.deleteMany({});
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  it('should save and retrieve campaign', async () => {
    const campaign = Campaign.create({ /* ... */ });
    await repo.save(campaign);

    const retrieved = await repo.findById(campaign.id);
    expect(retrieved?.name).toBe(campaign.name);
  });
});
```

### E2E Tests (Playwright)

```bash
npm run test:e2e           # Run E2E tests
npm run test:e2e:ui        # Interactive mode
npm run record:meta        # Record interactions
```

**Location**: `tests/e2e/`

**Focus**: Critical user journeys

```typescript
import { test, expect } from '@playwright/test';

test.describe('Campaign Creation Flow', () => {
  test('should create campaign from start to finish', async ({ page }) => {
    // Navigate to app
    await page.goto('http://localhost:3000/campaigns/new');

    // Fill campaign details
    await page.fill('input[name="name"]', 'Test Campaign');
    await page.fill('input[name="budget"]', '100000');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Campaign created')).toBeVisible();
  });
});
```

---

## Key Dependencies & Versions

| Dependency | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.1 | Framework |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Prisma | 7.2.0 | ORM |
| NextAuth.js | 5.0.0-beta.30 | Authentication |
| TanStack Query | 5.90.12 | Server state |
| Zustand | 5.0.9 | Client state |
| shadcn/ui | Latest | UI components |
| Tailwind CSS | 4 | Styling |
| Vitest | 4.0.16 | Unit tests |
| Playwright | 1.57.0 | E2E tests |
| Zod | 4.2.1 | Schema validation |

---

## Environment Variables

**File**: `.env.example` / `.env.local`

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/batwo
DIRECT_URL=postgresql://user:pass@localhost:5432/batwo  # Direct for migrations

# NextAuth.js v5
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret

# Meta Ads API
META_APP_ID=your-meta-app-id
META_APP_SECRET=your-meta-app-secret
META_ACCESS_TOKEN=your-access-token

# OpenAI
OPENAI_API_KEY=your-api-key

# Email (Resend)
RESEND_API_KEY=your-api-key

# Cafe24 (Optional)
CAFE24_CLIENT_ID=your-client-id
CAFE24_CLIENT_SECRET=your-secret
CAFE24_REDIRECT_URI=http://localhost:3000/api/platform/cafe24/callback

# Sentry (Error tracking)
SENTRY_AUTH_TOKEN=your-token
NEXT_PUBLIC_SENTRY_ORG=your-org
NEXT_PUBLIC_SENTRY_PROJECT=your-project
```

---

## Common Issues & Solutions

### Database Connection Issues

**Problem**: `PrismaClientInitializationError`

**Solution**:
```bash
# Ensure .env variables are set
echo $DATABASE_URL

# Restart dev server
npm run dev

# Check Prisma migrations
npx prisma migrate status

# Reset database (⚠️ destroys data)
npx prisma migrate reset
```

### Type Errors After Schema Changes

**Problem**: `Property 'newField' does not exist on type 'Campaign'`

**Solution**:
```bash
# Generate Prisma types
npx prisma generate

# Also generates in: src/generated/prisma/

# Type check
npm run type-check
```

### Tests Failing with Database Error

**Problem**: `PrismaClientKnownRequestError`

**Solution**:
```bash
# Use test database (separate from dev)
# Update vitest.config.integration.ts

# Ensure migrations ran
npx prisma migrate dev

# Clear test data between runs
# See vitest hooks: beforeEach cleanup
```

### Meta API Token Expired

**Problem**: `Invalid OAuth token`

**Solution**:
```bash
# Exchange for new token
npm run token:exchange

# Or use warmup script (automatic)
npm run warmup:start --interval=60
```

---

## AI Agent Working Instructions

### When You Start

1. Read AGENTS.md for project context and conventions
2. Check `git log --oneline -5` for recent patterns
3. Review existing tests in `tests/` for code style
4. Refer to this AGENTS.md for architecture guidance

### Code Quality Standards

- TypeScript: strict mode, no `any` types
- Tests: Always write tests FIRST (RED → GREEN → REFACTOR)
- Components: Use shadcn/ui + Tailwind CSS 4
- APIs: Return typed responses, validate input with Zod
- Errors: Use domain errors, never throw generic Error
- Commits: Follow `[type]: description` format

### Before Committing

```bash
npm run type-check    # Must pass
npm run lint          # Must pass
npm run lint:fix      # Auto-fix if needed
npm test              # Must pass
npm run build         # Must succeed
```

### When You Get Stuck

1. Check existing code in that layer (find similar patterns)
2. Review AGENTS.md for team conventions
3. Look at recent commits for examples: `git log --oneline -20`
4. Run tests to understand expected behavior
5. Ask questions clearly with context

---

## References

- **Project Guide**: `AGENTS.md`
- **AI Team Guide**: `docs/ai-team/user-guide-ko.md`
- **Tech Specs**: `docs/deployment/README.md`
- **Deployment**: `docs/deployment/PRODUCTION_CHECKLIST.md`

---

**Document Version**: 1.0
**Last Updated**: 2026-01-23
**Maintained By**: Batwo Development Team
