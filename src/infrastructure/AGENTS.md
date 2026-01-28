<!-- Parent: ../AGENTS.md -->

# Infrastructure Layer - AGENTS.md

## Purpose

The infrastructure layer implements the **adapter and port patterns** from clean architecture. It contains concrete implementations of external service integrations (Meta Ads, OpenAI, Café24) and database access patterns via Prisma.

This layer has NO business logic. It only:
- Adapts external APIs to internal ports/interfaces
- Maps Prisma models to domain entities
- Handles external service errors and retries
- Manages database persistence
- Configures authentication

**Key Principle**: Every external service has a corresponding port interface in `src/application/ports/`, and every implementation class here provides the concrete adapter.

---

## Directory Structure

```
src/infrastructure/
├── auth/                    # NextAuth.js configuration & middleware
├── database/                # Prisma repositories & mappers
├── external/                # External service clients
│   ├── errors/              # Unified error handling
│   ├── meta-ads/            # Meta Ads API client
│   ├── meta-pixel/          # Meta Pixel & CAPI client
│   ├── meta-pages/          # Meta Pages API client
│   ├── openai/              # OpenAI service & prompts
│   ├── platforms/           # E-commerce platform adapters
│   │   └── cafe24/          # Café24 OAuth & API adapter
│   └── tracking/            # Tracking script service
├── email/                   # Email delivery via Resend
├── pdf/                     # PDF generation for reports
└── AGENTS.md                # This file
```

---

## Key Files

| File | Purpose | Implements Port |
|------|---------|-----------------|
| **Auth** |
| `auth/auth.ts` | NextAuth.js initialization with Google/Kakao/Facebook providers | - |
| `auth/auth.config.ts` | Auth configuration (callbacks, jwt strategy) | - |
| `auth/adminMiddleware.ts` | Role-based access control middleware | - |
| **Database** |
| `database/index.ts` | Repository exports | - |
| `database/repositories/PrismaCampaignRepository.ts` | Campaign persistence | `ICampaignRepository` |
| `database/repositories/PrismaReportRepository.ts` | Report persistence | `IReportRepository` |
| `database/repositories/PrismaKPIRepository.ts` | KPI persistence | `IKPIRepository` |
| `database/repositories/PrismaUserRepository.ts` | User persistence | `IUserRepository` |
| `database/repositories/PrismaBudgetAlertRepository.ts` | Budget alert persistence | `IBudgetAlertRepository` |
| `database/repositories/PrismaSubscriptionRepository.ts` | Subscription persistence | `ISubscriptionRepository` |
| `database/repositories/PrismaInvoiceRepository.ts` | Invoice persistence | `IInvoiceRepository` |
| `database/repositories/PrismaTeamRepository.ts` | Team persistence | `ITeamRepository` |
| `database/repositories/PrismaABTestRepository.ts` | A/B test persistence | `IABTestRepository` |
| `database/repositories/PrismaUsageLogRepository.ts` | Usage log persistence | `IUsageLogRepository` |
| `database/mappers/CampaignMapper.ts` | Prisma ↔ Domain entity conversion | - |
| `database/mappers/ReportMapper.ts` | Prisma ↔ Domain entity conversion | - |
| `database/mappers/KPIMapper.ts` | Prisma ↔ Domain entity conversion | - |
| `database/mappers/index.ts` | Mapper exports | - |
| **External Errors** |
| `external/errors/ExternalServiceError.ts` | Base + specialized error types | - |
| **Meta Ads** |
| `external/meta-ads/MetaAdsClient.ts` | Meta Ads Graph API client | `IMetaAdsService` |
| `external/meta-ads/MetaAdsWarmupClient.ts` | Campaign warmup logic | - |
| `external/meta-ads/MetaApiLogRepository.ts` | API call logging for debugging | - |
| `external/meta-ads/index.ts` | Exports | - |
| **Meta Pixel** |
| `external/meta-pixel/MetaPixelClient.ts` | Pixel configuration client | `IMetaPixelService` |
| `external/meta-pixel/CAPIClient.ts` | Conversions API (CAPI) client | `ICAPIService` |
| `external/meta-pixel/index.ts` | Exports | - |
| **Meta Pages** |
| `external/meta-pages/MetaPagesClient.ts` | Meta Pages API client | `IMetaPagesService` |
| `external/meta-pages/index.ts` | Exports | - |
| **OpenAI** |
| `external/openai/AIService.ts` | OpenAI chat completions client | `IAIService` |
| `external/openai/prompts/adCopyGeneration.ts` | Ad copy generation prompts | - |
| `external/openai/prompts/reportInsight.ts` | Report insight generation prompts | - |
| `external/openai/prompts/campaignOptimization.ts` | Campaign optimization prompts | - |
| `external/openai/prompts/budgetRecommendation.ts` | Budget recommendation prompts | - |
| `external/openai/prompts/index.ts` | Prompt exports | - |
| `external/openai/index.ts` | Exports | - |
| **Platforms** |
| `external/platforms/cafe24/Cafe24Adapter.ts` | Café24 OAuth & API integration | `IPlatformAdapter` |
| `external/platforms/cafe24/index.ts` | Exports | - |
| **Tracking** |
| `external/tracking/TrackingScriptService.ts` | Dynamic pixel tracking script generation | - |
| **Email** |
| `email/EmailService.ts` | Email delivery via Resend | `IEmailService` |
| `email/templates/WeeklyReportEmailTemplate.ts` | HTML email template for reports | - |
| `email/index.ts` | Exports | - |
| **PDF** |
| `pdf/ReportPDFGenerator.ts` | PDF report generation via @react-pdf/renderer | `IReportPDFGenerator` |
| `pdf/templates/WeeklyReportTemplate.tsx` | React component PDF template | - |
| `pdf/index.ts` | Exports | - |

---

## Subdirectories

| Directory | Responsibility | Key Exports |
|-----------|-----------------|-------------|
| **auth** | Authentication & authorization | `auth`, `signIn`, `signOut`, `authConfig`, `requireAdmin` |
| **database** | Data persistence via Prisma | All repository implementations |
| **external** | Third-party service integrations | All service clients, error classes |
| **email** | Email delivery service | `EmailService` |
| **pdf** | PDF generation for reports | `ReportPDFGenerator` |

---

## AI Agent Instructions

### When to Edit This Layer

Edit infrastructure when:
- Adding a new external service integration (Meta Pixel, Stripe, etc.)
- Modifying database queries or persistence logic
- Updating error handling for external APIs
- Adding new email templates
- Changing authentication configuration

**DO NOT** edit infrastructure for:
- Business logic (belongs in domain/)
- Use cases (belongs in application/)
- React components (belongs in presentation/)

### Implementation Patterns

#### 1. Creating a New Repository (Database Adapter)

**Pattern**: All repositories implement a port interface from `src/application/ports/`.

```typescript
// 1. Check the port interface exists in src/application/ports/IXxxRepository.ts
// 2. Create mapper in src/infrastructure/database/mappers/XxxMapper.ts
//    - toCreateInput(entity) → Prisma create input
//    - toUpdateInput(entity) → Prisma update input
//    - toDomain(prisma) → Entity instance
// 3. Create repository in src/infrastructure/database/repositories/PrismaXxxRepository.ts

import { IXxxRepository } from '@application/ports/IXxxRepository'
import { XxxMapper } from '../mappers/XxxMapper'

export class PrismaXxxRepository implements IXxxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(entity: Xxx): Promise<Xxx> {
    const data = XxxMapper.toCreateInput(entity)
    const created = await this.prisma.xxx.create({ data })
    return XxxMapper.toDomain(created)
  }

  // Implement all port methods...
}
```

**Key Rules**:
- Never expose Prisma types to application/domain
- Always map Prisma models ↔ domain entities
- Implement ALL methods from the port interface

#### 2. Creating a New External Service Client

**Pattern**: Clients implement service ports and handle retries + error mapping.

```typescript
// 1. Check port interface exists in src/application/ports/IXxxService.ts
// 2. Create client in src/infrastructure/external/xxx/XxxClient.ts

import { IXxxService } from '@application/ports/IXxxService'
import { withRetry } from '@lib/utils/retry'

export class XxxClient implements IXxxService {
  private async requestWithRetry<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    return withRetry(
      () => this.request<T>(endpoint, options),
      { maxAttempts: 3, shouldRetry: isTransientError }
    )
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<T> {
    const response = await fetch(url, options)
    if (!response.ok) {
      throw this.mapError(response)
    }
    return response.json() as T
  }

  private mapError(response: Response): Error {
    // Map external API errors to our error types
    if (response.status === 429) return new RateLimitError()
    if (response.status === 401) return new AuthError()
    return new ExternalServiceError()
  }

  async xxx(): Promise<XxxResult> {
    return this.requestWithRetry<XxxResult>(endpoint, options)
  }
}
```

**Key Rules**:
- Always use `withRetry` for network calls
- Map external API errors to our error hierarchy
- Never expose external API types to application/domain
- Include API call logging when available

#### 3. Error Handling

All external services throw specialized errors in `external/errors/ExternalServiceError.ts`:

```typescript
// Specific error types for each service
export class MetaAdsApiError extends ExternalServiceError {
  static isRateLimitError(error): boolean { ... }
  static isAuthError(error): boolean { ... }
  static isTransientError(error): boolean { ... }
}

export class OpenAIApiError extends ExternalServiceError {
  static isRateLimitError(error): boolean { ... }
  static isContextLengthError(error): boolean { ... }
  static isTransientError(error): boolean { ... }
}

// Use in retry logic
shouldRetry: (error) => {
  if (error instanceof MetaAdsApiError) {
    return MetaAdsApiError.isTransientError(error)
  }
  return false
}
```

**Error Recovery**:
- Transient errors (500, 502, 503, timeout) → retry with exponential backoff
- Rate limits (429) → retry with longer backoff
- Auth errors (401, 403) → fail fast, let handler re-authenticate
- Client errors (4xx) → fail fast, log for debugging

#### 4. Adding Authentication

Authentication is configured in `auth/auth.ts`:

```typescript
// OAuth providers
providers: [
  Google({ clientId, clientSecret }),
  Kakao({ clientId, clientSecret }),
  Facebook({ clientId, clientSecret })  // Meta login
]

// Middleware
import { requireAdmin, handleAdminAuth } from '@infrastructure/auth'

export async function GET(req: Request) {
  const result = await handleAdminAuth(req)
  if (!result.user) {
    return new Response('Unauthorized', { status: 401 })
  }
  // proceed...
}
```

#### 5. Database Migrations

Prisma schema is in `prisma/schema.prisma`. When adding fields:

```bash
# 1. Update prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name add_xxx_field

# 3. Generate types
npm run type-check

# 4. Update mapper and repository
```

---

## Dependencies

### External Libraries

| Package | Purpose | Used By |
|---------|---------|---------|
| `next-auth` v5 | OAuth authentication | `auth/` |
| `@auth/prisma-adapter` | NextAuth + Prisma integration | `auth/` |
| `@prisma/client` v7 | Database ORM | `database/` |
| `resend` | Email delivery API | `email/` |
| `@react-pdf/renderer` | PDF generation | `pdf/` |
| `openai` SDK or `fetch` | OpenAI chat completions | `external/openai/` |

### Internal Dependencies

| Layer | Used By |
|-------|---------|
| `src/domain/entities/` | All repositories and mappers |
| `src/domain/repositories/` | All ports used by repos |
| `src/application/ports/` | All service clients implement ports |
| `src/application/dto/` | Mappers convert to/from DTOs |
| `@lib/utils/retry` | All network clients use retry logic |
| `@lib/prisma` | All database code |

---

## Common Tasks

### Add a new repository

1. Define port in `src/application/ports/IXxxRepository.ts`
2. Create mapper in `database/mappers/XxxMapper.ts`
3. Create repository in `database/repositories/PrismaXxxRepository.ts`
4. Export from `database/repositories/index.ts`
5. Test with unit tests in `tests/unit/repositories/`

### Add a new external service

1. Define port in `src/application/ports/IXxxService.ts`
2. Create client in `external/xxx/XxxClient.ts`
3. Add error handling in `external/errors/`
4. Export from `external/index.ts`
5. Test with unit tests in `tests/unit/external/`

### Add error handling

Errors are defined in `external/errors/ExternalServiceError.ts`. Add helper methods:

```typescript
static isXxxError(error: XxxApiError): boolean {
  return error.statusCode === XXX
}
```

Use in retry logic and handlers.

### Update authentication

Edit `auth/auth.ts`:
- Add new OAuth provider
- Modify session/JWT strategy
- Add auth event handlers

Edit `auth/auth.config.ts`:
- Modify callbacks (authorize, session, etc.)
- Change token configuration

---

## Testing

### Unit Tests

Test repositories and clients separately:

```bash
npm test -- database/
npm test -- external/
```

Key test patterns:
- Mock Prisma client for repositories
- Mock fetch for external clients
- Test error mapping and retry logic
- Verify mapper conversions (input → domain → output)

### Integration Tests

Test repositories with real database:

```bash
npm run test:int -- database/
```

Use test database transaction for isolation.

### External API Testing

Mock external APIs in tests:

```typescript
vi.mock('fetch', () => ({
  fetch: vi.fn().mockResolvedValue({
    ok: true,
    json: () => ({ id: '123', ... })
  })
}))
```

---

## Configuration

### Environment Variables

```bash
# NextAuth
AUTH_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
KAKAO_CLIENT_ID=xxx
KAKAO_CLIENT_SECRET=xxx
META_APP_ID=xxx
META_APP_SECRET=xxx

# Database
DATABASE_URL=postgresql://...

# Meta Ads
META_ACCESS_TOKEN=xxx (for test account)

# OpenAI
OPENAI_API_KEY=xxx

# Email
RESEND_API_KEY=xxx

# Café24 (optional)
CAFE24_CLIENT_ID=xxx
CAFE24_CLIENT_SECRET=xxx

# Debug
SKIP_DATABASE_ADAPTER=false  # Set to 'true' if DB unavailable
```

---

## Important Notes

### Database Adapter Safety

The auth config has a safety feature for database availability (see `auth/auth.ts` line 16):

```typescript
const USE_DATABASE_ADAPTER = process.env.SKIP_DATABASE_ADAPTER !== 'true'
```

If the database is temporarily unavailable, set `SKIP_DATABASE_ADAPTER=true` to allow OAuth to still work. Sessions will use JWT strategy instead of database persistence.

### API Logging

Meta Ads client includes optional API call logging:

```typescript
const client = new MetaAdsClient()
client.setLogger(logRepository, 'account-id')
```

This logs all API calls for debugging and performance monitoring.

### Tracking Script

The `TrackingScriptService` generates dynamic pixel tracking scripts. Scripts are injected into Café24 stores and can track pageviews, purchases, and custom events.

---

## Architecture Principles

### Dependency Injection

All clients receive dependencies via constructor:

```typescript
constructor(
  private readonly prisma: PrismaClient,
  private readonly logger: Logger
) {}
```

This enables easy testing and configuration.

### No Business Logic

Infrastructure layer MUST NOT contain:
- Campaign optimization logic
- Report analysis logic
- Budget calculation
- User permission checks

These belong in the application layer (use cases) or domain layer.

### Adapter Pattern

Each external service has:
- **Port** (interface in `src/application/ports/`)
- **Adapter** (implementation in `src/infrastructure/external/`)
- **Error mapping** (in `external/errors/`)

This allows switching implementations without affecting application logic.

---

## Related Documentation

- **Architecture**: `docs/architecture.md`
- **Database Schema**: `prisma/schema.prisma`
- **API Ports**: `src/application/ports/`
- **Domain Entities**: `src/domain/entities/`
