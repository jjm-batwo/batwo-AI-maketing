# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**바투 (Batwo)** is an all-in-one AI marketing solution for e-commerce businesses. It enables users to run Meta and Google Ads campaigns without marketing knowledge or agencies.

**MVP Scope**:
- Meta Ads campaign setup with AI guidance
- KPI dashboard (ROAS, CPA, CTR)
- Automated weekly reports with AI insights

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **Database**: PostgreSQL 15+ with Prisma 6.x ORM
- **Auth**: NextAuth.js v5 with Prisma Adapter
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives)
- **State**: Zustand 5.x + TanStack Query 5.x
- **Testing**: Vitest + Testing Library + Playwright + MSW
- **External APIs**: Meta Marketing API v18.0, OpenAI API

## Architecture

Clean Architecture with 4 layers - dependencies flow inward only:

```
src/
├── domain/           # Core business logic (entities, value-objects, repository interfaces)
├── application/      # Use cases and DTOs (orchestrates domain + infrastructure)
├── infrastructure/   # External adapters (Prisma repos, Meta/OpenAI clients, NextAuth)
├── presentation/     # React components, hooks, Zustand stores
├── app/              # Next.js App Router (pages, API routes, server actions)
└── lib/              # Utilities and DI container
```

**Key Constraints**:
- Domain layer has zero external dependencies
- Application layer depends only on domain interfaces
- Infrastructure implements domain interfaces (ports & adapters)

## Development Commands

```bash
# Development
npm run dev               # Start dev server (localhost:3000)
npm run build             # Production build
npm run lint              # ESLint check
npx tsc --noEmit          # TypeScript type check

# Database
docker-compose -f docker/docker-compose.yml up -d    # Start PostgreSQL
npx prisma migrate dev    # Run migrations
npx prisma studio         # Database GUI
npx prisma db push        # Push schema changes (dev only)

# Testing
npm test                           # Run all tests
npm test -- tests/unit/domain      # Domain layer tests only
npm test -- tests/integration      # Integration tests only
npm test -- --coverage             # With coverage report
npx playwright test                # E2E tests

# Check for circular dependencies
npx madge --circular src/domain
```

## Path Aliases

```typescript
import { Campaign } from '@domain/entities/Campaign'
import { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { KPICard } from '@presentation/components/dashboard/KPICard'
import { container } from '@lib/di/container'
```

## Test Organization

```
tests/
├── unit/
│   ├── domain/           # Entity and value object tests (≥95% coverage)
│   ├── application/      # Use case tests with mocked repos (≥90%)
│   └── infrastructure/   # External API client tests with MSW (≥85%)
├── integration/
│   └── repositories/     # Prisma repository tests against test DB
├── e2e/                  # Playwright flows (auth, campaign, dashboard)
├── fixtures/             # Test data factories
└── mocks/handlers/       # MSW handlers for Meta/OpenAI APIs
```

**Test Naming**:
```typescript
describe('Campaign', () => {
  describe('create', () => {
    it('should create a campaign with valid data', () => {})
    it('should throw InvalidCampaignError for negative budget', () => {})
  })
})
```

## Key Domain Entities

| Entity | Purpose |
|--------|---------|
| `Campaign` | Meta Ads campaign with budget, dates, targeting |
| `KPI` | Performance metrics (ROAS, CPA, CTR calculations) |
| `Report` | Weekly/monthly reports with AI-generated insights |
| `Money` | Value object for currency-safe calculations |
| `DateRange` | Value object for date range validation |

## Environment Variables

See `.env.example` for required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Auth encryption key
- `META_APP_ID` / `META_APP_SECRET` - Meta Ads API credentials
- `OPENAI_API_KEY` - For AI insights generation

## API Route Patterns

All API routes require authentication. Use server-side session check:
```typescript
// src/app/api/campaigns/route.ts
import { auth } from '@infrastructure/auth/auth'

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  // ...
}
```

## Korean Language Context

PRD and user-facing content are in Korean. Keep:
- Code, comments, and technical docs in English
- UI text and user messages in Korean
- Variable names in English (not transliterated Korean)
