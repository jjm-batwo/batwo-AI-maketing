<!-- Parent: ../AGENTS.md -->

# AGENTS.md - Test Suite Guide

**Project**: Batwo AI Marketing Solution
**Directory**: `/Users/jm/batwo-maketting service-saas/tests/`
**Last Updated**: 2026-01-23
**Coverage Target**: Domain ≥95% | Application ≥90% | Infrastructure ≥85% | E2E ≥100% (critical flows)

---

## Purpose

This directory contains the complete test suite for the Batwo project, organized into three tiers following the clean architecture pattern:

1. **Unit Tests** (`unit/`) - Fast, isolated tests for domain and application logic
2. **Integration Tests** (`integration/`) - Database and API integration tests
3. **E2E Tests** (`e2e/`) - Full user journey tests via Playwright
4. **Test Infrastructure** (`fixtures/`, `mocks/`, `setup.ts`) - Utilities and test helpers

The testing strategy enforces **Test-Driven Development (TDD)**: RED → GREEN → REFACTOR cycle before every feature.

---

## Directory Structure

```
tests/
├── unit/                          # Unit tests (Vitest, jsdom)
│   ├── domain/
│   │   ├── entities/              # Domain entity tests
│   │   │   ├── Campaign.test.ts
│   │   │   ├── Report.test.ts
│   │   │   ├── KPI.test.ts
│   │   │   ├── MetaPixel.test.ts
│   │   │   ├── PlatformIntegration.test.ts
│   │   │   ├── Subscription.test.ts
│   │   │   ├── Invoice.test.ts
│   │   │   └── ConversionEvent.test.ts
│   │   ├── value-objects/         # Value object tests
│   │   │   ├── Money.test.ts
│   │   │   ├── DateRange.test.ts
│   │   │   ├── Percentage.test.ts
│   │   │   ├── CampaignStatus.test.ts
│   │   │   ├── GlobalRole.test.ts
│   │   │   ├── SubscriptionPlan.test.ts
│   │   │   ├── SubscriptionStatus.test.ts
│   │   │   └── InvoiceStatus.test.ts
│   │   ├── errors/
│   │   │   └── DomainErrors.test.ts
│   │   ├── repositories/           # Repository interface tests
│   │   │   └── IKPIRepository.getDailyAggregates.test.ts
│   │   └── .gitkeep
│   │
│   ├── application/
│   │   ├── campaign/               # Campaign use case tests
│   │   │   ├── CreateCampaignUseCase.test.ts
│   │   │   ├── GetCampaignUseCase.test.ts
│   │   │   ├── ListCampaignsUseCase.test.ts
│   │   │   ├── UpdateCampaignUseCase.test.ts
│   │   │   ├── PauseCampaignUseCase.test.ts
│   │   │   ├── ResumeCampaignUseCase.test.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── report/                 # Report use case tests
│   │   │   ├── GenerateWeeklyReportUseCase.test.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── kpi/                    # KPI use case tests
│   │   │   ├── GetDashboardKPIUseCase.test.ts
│   │   │   ├── GetDashboardKPIUseCase.chartData.test.ts
│   │   │   ├── SyncMetaInsightsUseCase.test.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── pixel/                  # Pixel feature use cases
│   │   │   ├── ListUserPixelsUseCase.test.ts
│   │   │   ├── GetPixelStatusUseCase.test.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── services/               # Application service tests
│   │   │   ├── BudgetAlertService.test.ts
│   │   │   ├── ReportSchedulerService.test.ts
│   │   │   └── .gitkeep
│   │   │
│   │   ├── ai-team/                # AI team system tests
│   │   │   ├── architecture-validator.test.ts
│   │   │   ├── intent-classifier.test.ts
│   │   │   ├── feature-planner-config.test.ts
│   │   │   ├── github-issue-manager.test.ts
│   │   │   └── .gitkeep
│   │   │
│   │   └── .gitkeep
│   │
│   ├── infrastructure/
│   │   ├── meta-ads/
│   │   │   └── MetaAdsClient.test.ts
│   │   ├── meta-pixel/
│   │   │   ├── MetaPixelClient.test.ts
│   │   │   └── CAPIClient.test.ts
│   │   ├── platforms/
│   │   │   └── Cafe24Adapter.test.ts
│   │   ├── email/
│   │   │   └── EmailService.test.ts
│   │   ├── tracking/
│   │   │   └── TrackingScriptService.test.ts
│   │   ├── pdf/
│   │   │   └── ReportPDFGenerator.test.ts
│   │   └── .gitkeep
│   │
│   ├── lib/
│   │   ├── seo.test.ts
│   │   ├── env.test.ts
│   │   ├── sentry.test.ts
│   │   ├── errors/
│   │   │   └── reportError.test.ts
│   │   └── .gitkeep
│   │
│   ├── presentation/
│   │   ├── components/
│   │   │   ├── quota/
│   │   │   │   ├── QuotaStatusBadge.test.tsx
│   │   │   │   └── QuotaExceededDialog.test.tsx
│   │   │   ├── campaign/
│   │   │   │   └── CampaignCreateForm.test.tsx
│   │   │   ├── pixel/
│   │   │   │   ├── PixelSelector.test.tsx
│   │   │   │   ├── PixelStatus.test.tsx
│   │   │   │   └── UniversalScriptCopy.test.tsx
│   │   │   ├── onboarding/
│   │   │   │   └── steps/
│   │   │   │       └── PixelSetupStep.test.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── KPICard.test.tsx
│   │   │   ├── CTASection.test.tsx
│   │   │   ├── HeroSection.test.tsx
│   │   │   └── .gitkeep
│   │   │
│   │   ├── stores/
│   │   │   └── onboardingStore.test.ts
│   │   │
│   │   ├── setup.ts               # React Testing Library setup
│   │   └── .gitkeep
│   │
│   ├── services/
│   │   ├── BudgetRecommendationService.test.ts
│   │   └── AnomalyDetectionService.test.ts
│   │
│   ├── value-objects/
│   │   └── CopyVariation.test.ts
│   │
│   ├── api/
│   │   ├── ai/
│   │   │   └── copy.test.ts
│   │   └── .gitkeep
│   │
│   ├── app/
│   │   ├── error-pages.test.tsx
│   │   └── legal-pages.test.tsx
│   │
│   ├── setup.ts                   # Vitest setup (global mocks)
│   └── setup.test.ts              # Setup verification test
│
├── integration/                   # Integration tests (Vitest, node environment)
│   ├── setup.ts                   # Database setup & cleanup utilities
│   ├── repositories/              # Repository implementation tests
│   │   ├── PrismaCampaignRepository.test.ts
│   │   ├── PrismaReportRepository.test.ts
│   │   ├── PrismaKPIRepository.test.ts
│   │   ├── PrismaUsageLogRepository.test.ts
│   │   └── .gitkeep
│   │
│   ├── api/                       # API route integration tests
│   │   ├── campaigns.api.test.ts
│   │   ├── dashboard-kpi.api.test.ts
│   │   ├── reports.api.test.ts
│   │   ├── quota.api.test.ts
│   │   ├── pixel.api.test.ts
│   │   ├── pixel-tracker.api.test.ts
│   │   ├── platform-cafe24.api.test.ts
│   │   └── .gitkeep
│   │
│   └── .gitkeep
│
├── e2e/                           # E2E tests (Playwright)
│   ├── auth.spec.ts               # Authentication flows
│   ├── campaign-flow.spec.ts      # Campaign creation end-to-end
│   ├── dashboard.spec.ts          # Dashboard interactions
│   ├── error-pages.spec.ts        # Error page rendering
│   ├── legal-pages.spec.ts        # Legal page navigation
│   ├── pixel-setup.spec.ts        # Meta pixel setup flow
│   ├── security-headers.spec.ts   # Security header validation
│   ├── seo.spec.ts                # SEO checks
│   └── .gitkeep
│
├── fixtures/                      # Test data & fixtures
│   └── .gitkeep
│
├── mocks/                         # Mock implementations
│   ├── handlers/                  # MSW (Mock Service Worker) handlers
│   │   └── .gitkeep
│   │
│   ├── repositories/              # Mock repository implementations
│   │   ├── MockCampaignRepository.ts
│   │   ├── MockKPIRepository.ts
│   │   ├── MockUsageLogRepository.ts
│   │   ├── MockMetaPixelRepository.ts
│   │   ├── index.ts               # Export all mocks
│   │   └── .gitkeep
│   │
│   ├── services/
│   │   ├── index.ts               # Mock service factory
│   │   └── .gitkeep
│   │
│   └── .gitkeep
│
└── .gitkeep
```

---

## Test Execution

### Unit Tests (Vitest + jsdom)

```bash
# Watch mode (recommended for development)
npm test

# Run once
npm run test:run

# With coverage report
npm run test:coverage

# Unit tests only
npm run test:unit

# Specific test file
npm test Campaign.test.ts

# Watch specific test
npm test -- Campaign.test.ts --watch

# Filter tests by name
npm test -- --grep "should create campaign"
```

**Configuration**: `vitest.config.ts`
- **Environment**: jsdom (browser-like for React components)
- **Setup**: `tests/setup.ts`
- **Globals**: Vitest, Playwright assertion library available
- **Path Aliases**: `@domain`, `@application`, `@infrastructure`, `@presentation`, `@lib`, `@tests`

### Integration Tests (Vitest + Node + PostgreSQL)

```bash
# Run integration tests
npm run test:integration

# With coverage
npm run test:integration:coverage

# Specific integration test
npm run test:integration -- repositories/PrismaCampaignRepository.test.ts

# Sequential execution (important for database safety)
npm run test:integration -- --run
```

**Configuration**: `vitest.config.integration.ts`
- **Environment**: node (no jsdom)
- **Database**: Requires `DATABASE_URL_TEST` or `DATABASE_URL`
- **Setup**: `tests/integration/setup.ts`
- **Execution**: Sequential (no parallelism to avoid DB conflicts)
- **Timeout**: 30 seconds per test

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Interactive UI mode (recommended for debugging)
npm run test:e2e:ui

# Record new interactions
npm run record:meta

# Specific test file
npm run test:e2e auth.spec.ts

# Debug mode (with console/network logs)
npm run test:e2e:debug
```

**Configuration**: `playwright.config.ts`
- **Browser**: Chromium, Firefox, WebKit
- **Base URL**: `http://localhost:3000` (requires dev server running)
- **Setup**: Global setup for auth, fixtures
- **Screenshots/Videos**: On failure, stored in `test-results/`

---

## Key Files Reference

| File | Purpose | Owners |
|------|---------|--------|
| `setup.ts` | Global Vitest setup (mocks window, ResizeObserver) | QA Lead |
| `tests/unit/presentation/setup.ts` | React Testing Library configuration | Frontend QA |
| `tests/integration/setup.ts` | Database setup/teardown utilities | Backend QA |
| `vitest.config.ts` | Unit test configuration | QA Lead |
| `vitest.config.integration.ts` | Integration test configuration | QA Lead |
| `playwright.config.ts` (root) | E2E test configuration | QA Lead |
| `mocks/repositories/*.ts` | In-memory repository mocks | Developers |
| `mocks/services/index.ts` | Mock service factory | Developers |

---

## Testing Patterns & Best Practices

### 1. Unit Tests (Domain & Application)

**File Location**: `tests/unit/[layer]/[feature]/ComponentName.test.ts`

**Pattern**:
```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Campaign } from '@domain/entities/Campaign'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

describe('Campaign', () => {
  beforeEach(() => {
    // Setup fixtures or mocks
  })

  afterEach(() => {
    // Cleanup if needed
  })

  describe('create', () => {
    it('should create campaign with valid data', () => {
      const campaign = Campaign.create({
        name: 'Summer Sale',
        budget: Money.create(100_000, 'KRW'),
        objective: CampaignObjective.CONVERSIONS
      })

      expect(campaign.id).toBeDefined()
      expect(campaign.name).toBe('Summer Sale')
      expect(campaign.status).toBe(CampaignStatus.DRAFT)
    })

    it('should throw error for invalid data', () => {
      expect(() =>
        Campaign.create({
          name: '', // Empty name
          budget: Money.create(100_000, 'KRW'),
          objective: CampaignObjective.CONVERSIONS
        })
      ).toThrow('Campaign name is required')
    })
  })

  describe('immutability', () => {
    it('should return new instance on mutation', () => {
      const original = Campaign.create({ /* ... */ })
      const updated = original.changeStatus(CampaignStatus.PENDING_REVIEW)

      expect(original).not.toBe(updated)
      expect(original.status).toBe(CampaignStatus.DRAFT)
      expect(updated.status).toBe(CampaignStatus.PENDING_REVIEW)
    })
  })
})
```

**Rules**:
- Test public APIs only
- Use `describe` for feature grouping
- One assertion per test (or related assertions)
- Test both success and error paths
- Use fake timers (`vi.useFakeTimers()`) for time-dependent logic
- Mock external dependencies via constructor injection

### 2. React Component Tests

**File Location**: `tests/unit/presentation/components/[feature]/ComponentName.test.tsx`

**Pattern**:
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { QuotaStatusBadge } from '@presentation/components/quota/QuotaStatusBadge'

describe('QuotaStatusBadge', () => {
  it('should render badge with warning status', () => {
    render(<QuotaStatusBadge status="warning" used={80} limit={100} />)

    expect(screen.getByText(/80 \/ 100/)).toBeInTheDocument()
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('text-yellow-500')
  })

  it('should show danger state when quota exceeded', () => {
    render(<QuotaStatusBadge status="danger" used={105} limit={100} />)

    expect(screen.getByText(/105 \/ 100/)).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveClass('text-red-500')
  })

  it('should call onClick handler', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    render(
      <QuotaStatusBadge status="warning" used={80} limit={100} onClick={onClick} />
    )

    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalled()
  })
})
```

**Rules**:
- Use `@testing-library/react` and `@testing-library/user-event`
- Query by semantic roles/labels, not implementation details
- Avoid `get*` queries for conditional rendering (use `query*`)
- Mock callbacks with `vi.fn()`
- Test user interactions, not internals

### 3. Use Case / Application Service Tests

**File Location**: `tests/unit/application/[feature]/CreateXXXUseCase.test.ts`

**Pattern**:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { CreateCampaignUseCase } from '@application/use-cases/campaign'
import { MockCampaignRepository } from '@tests/mocks/repositories'

describe('CreateCampaignUseCase', () => {
  let useCase: CreateCampaignUseCase
  let mockRepository: MockCampaignRepository

  beforeEach(() => {
    mockRepository = new MockCampaignRepository()
    useCase = new CreateCampaignUseCase(mockRepository)
  })

  it('should create and persist campaign', async () => {
    const input = {
      userId: 'user-123',
      name: 'Summer Sale',
      objective: 'CONVERSIONS',
      dailyBudget: 100_000
    }

    const result = await useCase.execute(input)

    expect(result.id).toBeDefined()
    expect(result.name).toBe('Summer Sale')

    // Verify persistence
    const saved = await mockRepository.findById(result.id)
    expect(saved).not.toBeNull()
  })

  it('should throw error for duplicate campaign name', async () => {
    // Create first campaign
    await useCase.execute({
      userId: 'user-123',
      name: 'Summer Sale',
      objective: 'CONVERSIONS',
      dailyBudget: 100_000
    })

    // Try to create duplicate
    await expect(
      useCase.execute({
        userId: 'user-123',
        name: 'Summer Sale', // Same name
        objective: 'CONVERSIONS',
        dailyBudget: 100_000
      })
    ).rejects.toThrow('Campaign name already exists')
  })
})
```

**Rules**:
- Use mock repositories (not real database)
- Inject dependencies via constructor
- Test both happy path and error cases
- Verify side effects (logging, persistence)
- Use DTOs for input/output

### 4. Integration Tests (Repositories)

**File Location**: `tests/integration/repositories/PrismaXXXRepository.test.ts`

**Pattern**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories'
import { Campaign } from '@domain/entities/Campaign'

describe('PrismaCampaignRepository', () => {
  setupIntegrationTest() // Handles beforeAll, afterAll, beforeEach cleanup

  let repository: PrismaCampaignRepository
  let testUserId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    repository = new PrismaCampaignRepository(prisma)

    const user = await createTestUser()
    testUserId = user.id
  })

  it('should save and retrieve campaign', async () => {
    const campaign = Campaign.create({
      userId: testUserId,
      name: 'Test Campaign',
      objective: CampaignObjective.SALES,
      dailyBudget: Money.create(100_000, 'KRW'),
      startDate: new Date()
    })

    const saved = await repository.save(campaign)
    const retrieved = await repository.findById(saved.id)

    expect(retrieved).not.toBeNull()
    expect(retrieved!.name).toBe('Test Campaign')
  })

  it('should update campaign', async () => {
    const campaign = Campaign.create({ /* ... */ })
    await repository.save(campaign)

    const updated = campaign.updateBudget(Money.create(200_000, 'KRW'))
    await repository.update(updated)

    const retrieved = await repository.findById(campaign.id)
    expect(retrieved!.dailyBudget.amount).toBe(200_000)
  })

  it('should delete campaign', async () => {
    const campaign = Campaign.create({ /* ... */ })
    await repository.save(campaign)

    await repository.delete(campaign.id)

    const retrieved = await repository.findById(campaign.id)
    expect(retrieved).toBeNull()
  })
})
```

**Rules**:
- Use real PostgreSQL database (via `DATABASE_URL_TEST`)
- Call `setupIntegrationTest()` to manage setup/teardown
- Each test runs with clean database
- Use `createTestUser()` for data fixtures
- Test mapper logic (domain ↔ persistence)
- Test database constraints and queries

### 5. API Route Tests

**File Location**: `tests/integration/api/[resource].api.test.ts`

**Pattern**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { POST } from '@/app/api/campaigns/route'
import { NextRequest } from 'next/server'

describe('POST /api/campaigns', () => {
  setupIntegrationTest()

  let testUserId: string

  beforeEach(async () => {
    const user = await createTestUser()
    testUserId = user.id
  })

  it('should create campaign and return 201', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'New Campaign',
        objective: 'CONVERSIONS',
        dailyBudget: 100_000,
        startDate: new Date()
      })
    })

    request.headers.set('Authorization', `Bearer ${testUserId}`)

    const response = await POST(request)

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.id).toBeDefined()
    expect(data.name).toBe('New Campaign')
  })

  it('should return 400 for invalid input', async () => {
    const request = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: '', // Invalid: empty name
        objective: 'CONVERSIONS',
        dailyBudget: 100_000
      })
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  it('should return 422 for business rule violation', async () => {
    // First request (should succeed)
    const request1 = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unique Campaign',
        objective: 'CONVERSIONS',
        dailyBudget: 100_000,
        startDate: new Date()
      })
    })

    // Second request (duplicate name - should fail)
    const request2 = new NextRequest('http://localhost:3000/api/campaigns', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Unique Campaign', // Duplicate
        objective: 'CONVERSIONS',
        dailyBudget: 100_000,
        startDate: new Date()
      })
    })

    await POST(request1)
    const response = await POST(request2)

    expect(response.status).toBe(422)
  })
})
```

**Rules**:
- Use real request/response for integration
- Test validation (400), business rules (422), and success (200/201)
- Mock auth or use test tokens
- Clean database before each test
- Test error responses

### 6. E2E Tests (Playwright)

**File Location**: `tests/e2e/[feature].spec.ts`

**Pattern**:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Campaign Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/')
  })

  test('should create campaign from start to finish', async ({ page }) => {
    // Navigate to campaign creation
    await page.goto('/campaigns/new')

    // Fill form (step 1)
    await page.fill('input[name="name"]', 'Summer Sale')
    await page.selectOption('select[name="objective"]', 'CONVERSIONS')
    await page.fill('input[name="dailyBudget"]', '100000')
    await page.click('button:has-text("Next")')

    // Fill targeting (step 2)
    await page.selectOption('select[name="ageGroup"]', '18-34')
    await page.click('input[name="interests"]')
    await page.click('text=Fashion')
    await page.click('button:has-text("Next")')

    // Review & confirm (step 3)
    await expect(page.locator('text=Summer Sale')).toBeVisible()
    await page.click('button:has-text("Create Campaign")')

    // Verify success
    await expect(page.locator('text=Campaign created successfully')).toBeVisible()
    await expect(page).toHaveURL(/\/campaigns\/\w+/)
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/campaigns/new')

    // Click next without filling form
    await page.click('button:has-text("Next")')

    // Should show validation errors
    await expect(page.locator('text=Campaign name is required')).toBeVisible()
    await expect(page.locator('text=Daily budget is required')).toBeVisible()
  })

  test('should show error for duplicate campaign name', async ({ page }) => {
    // Create first campaign
    await page.goto('/campaigns/new')
    await page.fill('input[name="name"]', 'Summer Sale')
    await page.selectOption('select[name="objective"]', 'CONVERSIONS')
    await page.fill('input[name="dailyBudget"]', '100000')
    await page.click('button:has-text("Create Campaign")')
    await expect(page.locator('text=Campaign created')).toBeVisible()

    // Try to create duplicate
    await page.goto('/campaigns/new')
    await page.fill('input[name="name"]', 'Summer Sale')
    await page.selectOption('select[name="objective"]', 'CONVERSIONS')
    await page.fill('input[name="dailyBudget"]', '100000')
    await page.click('button:has-text("Create Campaign")')

    // Should show error
    await expect(page.locator('text=Campaign name already exists')).toBeVisible()
  })
})
```

**Rules**:
- Test critical user journeys only (not every detail)
- Use semantic selectors (role, label, text)
- Avoid hardcoding IDs/classes
- Set up test data in `beforeEach` or via API
- Test both happy path and error scenarios
- Wait for navigation: `page.waitForURL()`
- Use `@playwright/test` fixtures for setup

### 7. Mock Repository Pattern

**File Location**: `tests/mocks/repositories/MockXXXRepository.ts`

**Pattern**:
```typescript
import { Campaign } from '@domain/entities/Campaign'
import {
  ICampaignRepository,
  CampaignFilters,
  PaginationOptions,
  PaginatedResult,
} from '@domain/repositories/ICampaignRepository'

export class MockCampaignRepository implements ICampaignRepository {
  private campaigns: Map<string, Campaign> = new Map()

  async save(campaign: Campaign): Promise<Campaign> {
    this.campaigns.set(campaign.id, campaign)
    return campaign
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.campaigns.get(id) ?? null
  }

  async findByUserId(userId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(c => c.userId === userId)
  }

  async findByFilters(
    filters: CampaignFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Campaign>> {
    let results = Array.from(this.campaigns.values())

    if (filters.userId) {
      results = results.filter(c => c.userId === filters.userId)
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status]
      results = results.filter(c => statuses.includes(c.status))
    }

    const page = pagination?.page ?? 1
    const limit = pagination?.limit ?? 10
    const total = results.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const data = results.slice(start, start + limit)

    return { data, total, page, limit, totalPages }
  }

  async update(campaign: Campaign): Promise<Campaign> {
    this.campaigns.set(campaign.id, campaign)
    return campaign
  }

  async delete(id: string): Promise<void> {
    this.campaigns.delete(id)
  }

  // Test helpers
  clear(): void {
    this.campaigns.clear()
  }

  getAll(): Campaign[] {
    return Array.from(this.campaigns.values())
  }
}
```

**Rules**:
- Implement the same interface as Prisma repository
- Use in-memory storage (Map, Set)
- Support filtering and pagination
- Include test helpers (`clear()`, `getAll()`)
- Keep logic simple (no complex queries)

---

## Coverage Targets & Metrics

### Target Coverage

| Layer | Target | Rationale |
|-------|--------|-----------|
| **Domain** | ≥95% | Core business logic, must be bulletproof |
| **Application** | ≥90% | Use cases and orchestration |
| **Infrastructure** | ≥85% | Adapters (some external API edge cases acceptable) |
| **Presentation** | ≥80% | React components (UI often changes) |
| **E2E** | 100% | Critical user journeys only |

### Generate Coverage Report

```bash
# Unit test coverage
npm run test:coverage

# Integration test coverage
npm run test:integration:coverage

# View HTML report
open coverage/index.html
```

### Improving Coverage

1. **RED → GREEN → REFACTOR**: Write test first
2. **Branch Coverage**: Test both if/else paths
3. **Error Paths**: Test all exceptions
4. **Edge Cases**: Boundary values, null/undefined
5. **Integration**: Test database queries and API responses

---

## Common Issues & Solutions

### Database Connection Errors

**Problem**: `PrismaClientInitializationError` in integration tests

**Solution**:
```bash
# Ensure test database is set
export DATABASE_URL_TEST=postgresql://user:pass@localhost:5432/batwo_test

# Run migrations for test database
npx prisma migrate deploy --skip-generate

# Or use main database if no test DB available
unset DATABASE_URL_TEST
```

### Vitest Not Finding Modules

**Problem**: `Cannot find module '@domain/entities'`

**Solution**:
```bash
# Check path aliases in vitest.config.ts and tsconfig.json
# Make sure paths match exactly

# Restart TypeScript server in IDE
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### React Component Tests Failing

**Problem**: `TypeError: window.matchMedia is not a function`

**Solution**: Already handled in `tests/setup.ts`, but verify it's included in vitest config:
```typescript
// vitest.config.ts
setupFiles: ['./tests/setup.ts']
```

### E2E Tests Timeout

**Problem**: `Timeout 30000 exceeded`

**Solution**:
```bash
# Increase timeout for slow tests
test('should do something slow', async ({ page }) => {
  // test code
}, { timeout: 60000 })

# Or run in debug mode
npm run test:e2e:debug
```

### Integration Tests Running in Parallel

**Problem**: Database conflicts, tests interfering with each other

**Solution**: Already configured in `vitest.config.integration.ts`:
```typescript
// Integration tests run sequentially
sequence: { concurrent: false }
fileParallelism: false
```

---

## AI Agent Working Instructions

### When Writing Tests

1. **Read Existing Tests**: Check similar tests in the codebase for patterns
2. **Follow TDD**: RED → GREEN → REFACTOR cycle
3. **Use Mocks**: Inject mock repositories for unit tests
4. **Name Tests Clearly**: `should [do what] [when condition]`
5. **Test Boundaries**: Happy path + all error cases
6. **Keep Tests Fast**: Mock external APIs, use in-memory stores
7. **One Assertion Focus**: Test one thing per test (related assertions OK)

### Test File Naming

| Layer | Pattern | Example |
|-------|---------|---------|
| Domain | `EntityName.test.ts` | `Campaign.test.ts` |
| Domain VO | `ValueObjectName.test.ts` | `Money.test.ts` |
| Application | `UseCaseNameUseCase.test.ts` | `CreateCampaignUseCase.test.ts` |
| Infrastructure | `AdapterName.test.ts` | `PrismaCampaignRepository.test.ts` |
| Presentation | `ComponentName.test.tsx` | `QuotaStatusBadge.test.tsx` |
| E2E | `[feature].spec.ts` | `campaign-flow.spec.ts` |

### Before Committing

```bash
# Run all test layers
npm test                    # Unit tests
npm run test:integration   # Integration tests
npm run test:e2e           # E2E tests (requires dev server)

# Check coverage
npm run test:coverage

# Type check & lint
npm run type-check
npm run lint
```

### Debugging Tests

```bash
# Watch mode with immediate feedback
npm test -- --watch

# Debug UI mode (Playwright)
npm run test:e2e:ui

# VSCode debug
# .vscode/launch.json configuration available

# Console logging in tests
console.log('Debug:', value) // Shows in test output

# Vitest inspection
node --inspect-brk node_modules/.bin/vitest run
```

---

## Dependencies & Versions

| Package | Version | Purpose | Category |
|---------|---------|---------|----------|
| `vitest` | 4.0.16+ | Unit test runner | Test Framework |
| `@vitest/ui` | 4.0.16+ | Test UI dashboard | Test Framework |
| `@testing-library/react` | 14.x | React component testing | Test Utilities |
| `@testing-library/jest-dom` | 6.x | DOM assertions | Test Utilities |
| `@testing-library/user-event` | 14.x | User interaction simulation | Test Utilities |
| `@playwright/test` | 1.57+ | E2E test framework | E2E Testing |
| `jsdom` | 24.x | Browser environment for tests | Test Environment |
| `vi` (Vitest globals) | Built-in | Mocking utilities | Test Framework |
| `PrismaClient` | 7.2.0+ | Database client for integration tests | Database |

---

## References & Documentation

### Internal Documentation
- **Architecture**: `../AGENTS.md` - Complete project architecture
- **Project Guide**: `../CLAUDE.md` - Korean project guidelines
- **Testing Strategy**: `../CLAUDE.md#TDD-개발-방식`

### External Documentation
- **Vitest**: https://vitest.dev/
- **Playwright**: https://playwright.dev/
- **Testing Library**: https://testing-library.com/
- **Prisma Testing**: https://www.prisma.io/docs/orm/prisma-client/testing/unit-testing

### Related Configuration
- `vitest.config.ts` - Unit test configuration
- `vitest.config.integration.ts` - Integration test configuration
- `playwright.config.ts` - E2E test configuration
- `tsconfig.json` - TypeScript path aliases

---

## Quick Start

### For New Team Members

1. **Read This File** and `../AGENTS.md`
2. **Run All Tests**:
   ```bash
   npm test                 # Unit tests
   npm run test:integration # Integration tests (if DB available)
   ```
3. **Write Your First Test**:
   - Pick a simple domain entity test
   - Copy pattern from existing test
   - Follow RED → GREEN → REFACTOR cycle
4. **Run Tests** and verify they pass:
   ```bash
   npm test -- YourFeature.test.ts
   ```

### For Continuous Integration

Tests are run automatically on every commit:
- Unit tests: Required to pass
- Integration tests: Required if touching database
- E2E tests: Required before production deployment

### For Local Development

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run tests in watch mode
npm test

# Terminal 3 (optional): Run E2E tests
npm run test:e2e:ui
```

---

**Document Version**: 1.0
**Last Updated**: 2026-01-23
**Maintained By**: Batwo QA Team
