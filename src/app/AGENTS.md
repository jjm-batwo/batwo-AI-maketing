<!-- Parent: ../AGENTS.md -->

# Next.js App Router (`src/app/`)

## Purpose

The App Router directory contains all Next.js routing, page layouts, API endpoints, and middleware for the 바투 AI 마케팅 솔루션 SaaS platform. This directory implements:

- **Pages & Layouts**: User-facing UI routes organized by route groups (`(auth)`, `(dashboard)`, `(admin)`, `(legal)`)
- **API Routes**: RESTful endpoints for campaigns, reports, Meta integration, pixel tracking, admin operations
- **Route Handlers**: Next.js 13+ API route handlers using `route.ts` pattern
- **Middleware**: Request/response processing (currently minimal due to Turbopack compatibility)
- **Error Handling**: Global and page-level error boundaries with Sentry integration
- **SEO & Metadata**: Server-side metadata generation, sitemaps, robots.txt

## Directory Structure

```
src/app/
├── (admin)/                    # Admin panel (protected route group)
│   └── admin/
│       ├── page.tsx           # Admin dashboard
│       ├── layout.tsx
│       ├── users/             # User management
│       ├── payments/          # Payment monitoring
│       ├── refunds/           # Refund management
│       ├── analytics/         # System analytics
│       └── settings/          # Admin settings
│
├── (auth)/                     # Authentication pages (protected route group)
│   ├── layout.tsx             # Auth layout (redirects logged-in users)
│   ├── login/
│   │   └── page.tsx          # Login page
│   └── loading.tsx
│
├── (dashboard)/               # Main app pages (protected route group)
│   ├── layout.tsx             # Dashboard layout wraps MainLayout component
│   ├── dashboard/
│   │   └── page.tsx          # Main dashboard/homepage
│   ├── campaigns/             # Campaign management
│   │   ├── page.tsx          # Campaign list
│   │   ├── new/
│   │   │   └── page.tsx      # Create new campaign
│   │   ├── [id]/
│   │   │   ├── page.tsx      # Campaign detail
│   │   │   └── edit/
│   │   │       └── page.tsx  # Edit campaign
│   │   └── loading.tsx
│   ├── reports/               # Weekly reports
│   │   ├── page.tsx          # Reports list
│   │   ├── [id]/
│   │   │   └── page.tsx      # Report detail
│   │   ├── sample/
│   │   │   └── page.tsx      # Sample report preview
│   │   └── loading.tsx
│   ├── settings/              # User settings
│   │   ├── page.tsx          # Settings overview
│   │   ├── meta-connect/     # Meta Ads OAuth setup
│   │   │   └── page.tsx
│   │   ├── meta-pages/       # Meta Pages selection
│   │   │   └── page.tsx
│   │   ├── pixel/            # Meta Pixel setup
│   │   │   └── page.tsx
│   │   ├── teams/            # Team management
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── loading.tsx
│   └── loading.tsx
│
├── (legal)/                    # Legal pages (public)
│   ├── layout.tsx
│   ├── privacy/
│   │   └── page.tsx          # Privacy policy
│   └── terms/
│       └── page.tsx          # Terms of service
│
├── api/                        # API routes (all endpoints)
│   ├── auth/                  # Authentication
│   │   ├── [...nextauth]/
│   │   │   └── route.ts      # NextAuth.js v5 endpoint
│   │   └── debug/
│   │       └── route.ts      # Auth diagnostics (dev only)
│   │
│   ├── campaigns/             # Campaign management API
│   │   ├── route.ts          # GET (list) / POST (create)
│   │   ├── [id]/
│   │   │   ├── route.ts      # GET / PATCH / DELETE campaign
│   │   │   ├── status/
│   │   │   │   └── route.ts  # GET campaign status
│   │   │   ├── kpi/
│   │   │   │   └── route.ts  # GET campaign KPIs
│   │   │   ├── budget-status/
│   │   │   │   └── route.ts  # GET budget status
│   │   │   └── budget-alert/
│   │   │       └── route.ts  # POST budget alert
│   │   └── budget-recommendation/
│   │       └── route.ts      # GET budget recommendations
│   │
│   ├── reports/               # Weekly reports API
│   │   ├── route.ts          # GET (list) / POST (create)
│   │   ├── [id]/
│   │   │   ├── route.ts      # GET / DELETE report
│   │   │   ├── download/
│   │   │   │   └── route.ts  # GET report PDF download
│   │   │   ├── send/
│   │   │   │   └── route.ts  # POST send report via email
│   │   │   └── share/
│   │   │       └── route.ts  # GET share report (public link)
│   │   ├── sample/
│   │   │   ├── route.ts      # GET sample report
│   │   │   └── download/
│   │   │       └── route.ts  # GET sample report PDF
│   │   └── loading.tsx
│   │
│   ├── meta/                  # Meta Ads integration API
│   │   ├── accounts/
│   │   │   └── route.ts      # GET user's Meta Ads accounts
│   │   ├── pages/
│   │   │   ├── route.ts      # GET user's Meta Pages
│   │   │   └── [pageId]/
│   │   │       └── insights/
│   │   │           └── route.ts # GET page insights
│   │   └── callback/
│   │       └── route.ts      # POST Meta OAuth callback
│   │
│   ├── pixel/                 # Meta Pixel tracking API
│   │   ├── route.ts          # GET (list) / POST (create)
│   │   └── [pixelId]/
│   │       ├── route.ts      # GET / PATCH / DELETE pixel
│   │       ├── status/
│   │       │   └── route.ts  # GET pixel status
│   │       ├── tracker.js/
│   │       │   └── route.ts  # GET dynamic tracking script
│   │       ├── event/
│   │       │   └── route.ts  # POST client events
│   │       └── snippet/
│   │           └── route.ts  # GET installation snippet
│   │
│   ├── platform/              # Third-party platform integrations
│   │   └── cafe24/            # Cafe24 (Korean e-commerce) integration
│   │       ├── auth/
│   │       │   └── route.ts  # GET OAuth authorization URL
│   │       ├── callback/
│   │       │   └── route.ts  # POST OAuth callback
│   │       ├── inject/
│   │       │   └── route.ts  # POST inject pixel into store
│   │       └── disconnect/
│   │           └── route.ts  # POST disconnect platform
│   │
│   ├── ai/                    # AI services API
│   │   ├── copy/
│   │   │   └── route.ts      # POST generate AI ad copy
│   │   ├── anomalies/
│   │   │   └── route.ts      # POST detect anomalies
│   │   └── optimization/
│   │       └── [campaignId]/
│   │           └── route.ts  # GET AI optimization suggestions
│   │
│   ├── cron/                  # Scheduled jobs (Vercel Cron)
│   │   ├── generate-reports/
│   │   │   └── route.ts      # POST generate weekly reports
│   │   └── meta-warmup/
│   │       └── route.ts      # POST warm up Meta API
│   │
│   ├── internal/              # Internal-only endpoints (require auth)
│   │   ├── meta-stats/
│   │   │   └── route.ts      # POST sync Meta campaign stats
│   │   └── meta-warmup/
│   │       └── route.ts      # POST manual Meta warmup trigger
│   │
│   ├── admin/                 # Admin-only API endpoints
│   │   ├── dashboard/
│   │   │   └── route.ts      # GET admin dashboard data
│   │   ├── users/
│   │   │   ├── route.ts      # GET (list) / POST (create)
│   │   │   └── [id]/
│   │   │       └── route.ts  # GET / PATCH / DELETE user
│   │   ├── payments/
│   │   │   ├── route.ts      # GET payment records
│   │   │   └── stats/
│   │   │       └── route.ts  # GET payment statistics
│   │   ├── refunds/
│   │   │   ├── route.ts      # GET / POST refunds
│   │   │   └── [id]/
│   │   │       └── route.ts  # GET / PATCH refund
│   │   ├── analytics/
│   │   │   └── route.ts      # GET system analytics
│   │   └── settings/
│   │       ├── route.ts      # GET / PATCH admin settings
│   │       └── admins/
│   │           └── route.ts  # GET / POST admin users
│   │
│   ├── teams/                 # Team management API
│   │   ├── route.ts          # GET (list) / POST (create)
│   │   └── [id]/
│   │       ├── route.ts      # GET / PATCH team
│   │       └── members/
│   │           ├── route.ts  # GET members / POST add member
│   │           └── [memberId]/
│   │               └── route.ts # DELETE member
│   │
│   ├── alerts/
│   │   └── route.ts          # GET user alerts
│   │
│   ├── ab-tests/             # A/B test API
│   │   ├── route.ts          # GET / POST tests
│   │   └── [id]/
│   │       └── route.ts      # GET / PATCH test
│   │
│   ├── dashboard/
│   │   └── kpi/
│   │       └── route.ts      # GET dashboard KPI data
│   │
│   ├── quota/
│   │   └── route.ts          # GET user quota usage
│   │
│   └── health/
│       └── route.ts          # GET health check (no auth)
│
├── layout.tsx                 # Root layout (fonts, providers, Sentry, metadata)
├── page.tsx                   # Landing page (/ route)
├── error.tsx                  # Global error boundary (Sentry integration)
├── global-error.tsx           # Root error boundary
├── not-found.tsx              # 404 page
├── providers.tsx              # Client providers (SessionProvider, QueryClient, ErrorBoundary)
├── sitemap.ts                 # Dynamic sitemap.xml
├── robots.ts                  # robots.txt configuration
├── opengraph-image.tsx        # Dynamic OG image generation
├── twitter-image.tsx          # Dynamic Twitter image generation
├── globals.css                # Global styles (Tailwind CSS 4)
└── middleware.ts              # Request middleware (minimal due to Turbopack issues)
```

## Key Files

| File | Purpose | Notes |
|------|---------|-------|
| `layout.tsx` | Root layout with fonts, providers, SEO metadata | Uses Geist font, includes Vercel Analytics & Speed Insights |
| `page.tsx` | Landing page (/) - redirects logged-in users to /campaigns | Server component with auth check |
| `providers.tsx` | Client-side context providers | SessionProvider, QueryClient, ErrorBoundary |
| `error.tsx` | Global error boundary with Sentry integration | Shows error details in dev mode, feedback form in prod |
| `global-error.tsx` | Root-level error handler | Catches errors in root layout |
| `not-found.tsx` | 404 page | Custom not-found UI |
| `middleware.ts` | Minimal middleware (auth redirects in layouts instead) | Turbopack compatibility workaround |
| `sitemap.ts` | Dynamic sitemap generation | SEO optimization |
| `robots.ts` | robots.txt configuration | Crawl rules for search engines |
| `opengraph-image.tsx` | Dynamic OG image for social sharing | Per-route OG image generation |
| `twitter-image.tsx` | Dynamic Twitter card image | Social sharing optimization |

## Route Groups

| Group | Purpose | Auth Required | Route Pattern |
|-------|---------|---------------|---------------|
| `(auth)` | Authentication pages | No (redirects if logged in) | `/login`, `/register` |
| `(dashboard)` | Main app interface | Yes | `/campaigns`, `/reports`, `/settings`, `/dashboard` |
| `(admin)` | Admin panel | Yes (admin role) | `/admin/users`, `/admin/payments`, `/admin/analytics` |
| `(legal)` | Legal pages | No | `/privacy`, `/terms` |
| (root) | Public pages & API | Varies | `/`, `/api/*` |

## API Endpoint Categories

### Authentication (`/api/auth/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `[...nextauth]` | - | NextAuth.js v5 provider routes | - |
| `debug` | GET | Auth diagnostics (dev only) | No |

### Campaigns (`/api/campaigns/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `GET` | GET | List user's campaigns (paginated) | Required |
| `POST` | POST | Create new campaign | Required |
| `[id]` | GET/PATCH/DELETE | Get/update/delete specific campaign | Required |
| `[id]/status` | GET | Get campaign's current Meta status | Required |
| `[id]/kpi` | GET | Get campaign KPIs from Meta | Required |
| `[id]/budget-status` | GET | Check budget remaining | Required |
| `[id]/budget-alert` | POST | Set/trigger budget alert | Required |
| `budget-recommendation` | GET | Get AI budget recommendations | Required |

### Reports (`/api/reports/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `GET` | GET | List user's weekly reports | Required |
| `POST` | POST | Generate new report | Required |
| `[id]` | GET/DELETE | Get/delete report | Required |
| `[id]/download` | GET | Download report as PDF | Required |
| `[id]/send` | POST | Send report via email | Required |
| `[id]/share` | GET | Get public share link | Public |
| `sample` | GET | Get sample report data | No |
| `sample/download` | GET | Download sample report PDF | No |

### Meta Integration (`/api/meta/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `accounts` | GET | List user's Meta Ads accounts | Required |
| `pages` | GET | List user's Meta Pages | Required |
| `pages/[pageId]/insights` | GET | Get page analytics | Required |
| `callback` | POST | Meta OAuth callback handler | No |

### Pixel Tracking (`/api/pixel/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `GET` | GET | List user's pixels (paginated) | Required |
| `POST` | POST | Create new pixel | Required |
| `[pixelId]` | GET/PATCH/DELETE | Get/update/delete pixel | Required |
| `[pixelId]/status` | GET | Get pixel tracking status | Required |
| `[pixelId]/tracker.js` | GET | Dynamic tracking script (returns JS) | Public |
| `[pixelId]/event` | POST | Client-side event tracking | Public |
| `[pixelId]/snippet` | GET | Installation snippet HTML | Public |

### Platform Integration (`/api/platform/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `cafe24/auth` | GET | Get Cafe24 OAuth URL | Required |
| `cafe24/callback` | POST | Cafe24 OAuth callback | No |
| `cafe24/inject` | POST | Inject pixel into Cafe24 store | Required |
| `cafe24/disconnect` | POST | Disconnect Cafe24 integration | Required |

### AI Services (`/api/ai/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `copy` | POST | Generate AI ad copy (uses OpenAI) | Required |
| `anomalies` | POST | Detect campaign anomalies | Required |
| `optimization/[campaignId]` | GET | Get optimization suggestions | Required |

### Admin APIs (`/api/admin/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `dashboard` | GET | Admin dashboard metrics | Admin only |
| `users` | GET/POST | List/create users | Admin only |
| `users/[id]` | GET/PATCH/DELETE | Manage user | Admin only |
| `payments` | GET | List payments | Admin only |
| `payments/stats` | GET | Payment statistics | Admin only |
| `refunds` | GET/POST | Manage refunds | Admin only |
| `refunds/[id]` | GET/PATCH | Refund details | Admin only |
| `analytics` | GET | System analytics | Admin only |
| `settings` | GET/PATCH | Admin settings | Admin only |
| `settings/admins` | GET/POST | Manage admin users | Admin only |

### Team Management (`/api/teams/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `GET` | GET | List user's teams | Required |
| `POST` | POST | Create team | Required |
| `[id]` | GET/PATCH | Get/update team | Required |
| `[id]/members` | GET/POST | List/add members | Required |
| `[id]/members/[memberId]` | DELETE | Remove member | Required |

### Scheduled Jobs (`/api/cron/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `generate-reports` | POST | Generate weekly reports | Cron token |
| `meta-warmup` | POST | Warm up Meta API connections | Cron token |

### Internal (`/api/internal/*`)
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `meta-stats` | POST | Sync Meta campaign statistics | Required |
| `meta-warmup` | POST | Manual Meta warmup trigger | Required |

### Utilities
| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `health` | GET | Health check endpoint | No |
| `quota` | GET | Get user's API quota usage | Required |
| `alerts` | GET | Get user's alerts | Required |
| `ab-tests` | GET/POST | A/B test management | Required |
| `ab-tests/[id]` | GET/PATCH | A/B test details | Required |
| `dashboard/kpi` | GET | Dashboard KPI data | Required |

## Subdirectories Reference

| Subdirectory | Type | Contains | Agent Focus |
|--------------|------|----------|------------|
| `(admin)/` | Route Group | Admin pages & layouts | executor-high, security-reviewer |
| `(auth)/` | Route Group | Login, registration, auth layouts | executor, security-reviewer |
| `(dashboard)/` | Route Group | Main app pages, settings, reports | executor, designer |
| `(legal)/` | Route Group | Privacy policy, terms of service | writer |
| `api/` | API Routes | All RESTful endpoints (50+ routes) | executor, architect |

## AI Agent Instructions

### Route Handler Development

**When modifying route handlers** (`/api/**/*.ts`):

1. **Authentication**: Always check user session first using `await auth()` or `getAuthenticatedUser()`
2. **Authorization**: Verify user role/permissions (e.g., admin-only routes)
3. **Input Validation**: Validate request body and query parameters
4. **Error Handling**: Return appropriate HTTP status codes with descriptive error messages
5. **Pagination**: For list endpoints, implement page/limit parameters
6. **Response Format**: Return JSON with consistent structure `{ data, total, page, limit }` for lists
7. **Logging**: Log errors with context (user ID, operation, error details)
8. **Caching**: Use ETag or Last-Modified headers where appropriate
9. **Rate Limiting**: Apply quota checks via DI container if needed

**Pattern for GET list endpoints:**
```typescript
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  // Fetch data with pagination
  // Return { data, total, page, limit, totalPages }
}
```

**Pattern for POST/create endpoints:**
```typescript
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const body = await request.json()

  // Validate input
  if (!body.requiredField) {
    return NextResponse.json(
      { message: 'Required field missing' },
      { status: 400 }
    )
  }

  // Create resource using DI container
  const useCase = container.resolve(SomeUseCase)
  const result = await useCase.execute({ ...body, userId: user.id })

  return NextResponse.json(result, { status: 201 })
}
```

### Page Development

**When creating/modifying page components** (`/app/**/*.tsx`):

1. **Server Components**: Use async Server Components by default for data fetching
2. **Auth Checks**: Use `await auth()` to check session and redirect unauthorized users
3. **Layouts**: Wrap pages in appropriate layout (dashboard, auth, legal)
4. **Metadata**: Export `metadata` for SEO on page routes
5. **Loading States**: Provide `loading.tsx` for route groups
6. **Error Handling**: Let errors bubble up to error boundaries
7. **Route Groups**: Use `(groupName)` syntax for organizing routes without affecting URLs

**Pattern for protected page:**
```typescript
export const metadata: Metadata = getMetadata({ path: '/campaigns' })

export default async function CampaignsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  // Fetch data server-side
  const campaigns = await fetchUserCampaigns(session.user.id)

  return (
    <div>
      <CampaignsUI campaigns={campaigns} />
    </div>
  )
}
```

### Layout Development

**When modifying layouts**:

1. **Composition**: Layouts wrap children without re-rendering on navigation
2. **Auth Redirects**: Implement session-based redirects in layouts (not middleware)
3. **Providers**: Apply context/state providers at appropriate nesting level
4. **Metadata**: Set default metadata for route group children
5. **Performance**: Minimize server-side work in layouts (they run frequently)

**Current architecture note**: Auth redirects are in layouts (not middleware) due to Turbopack issues with middleware in Next.js 16.1.1.

### Error Handling

**Pattern for global errors** (`error.tsx`):

1. Use 'use client' directive
2. Capture to Sentry with context
3. Show error details in dev mode only
4. Provide user feedback form for production
5. Include recovery action (retry/home button)

### Dependencies

**Key imports for route handlers:**

```typescript
// Next.js
import { NextRequest, NextResponse } from 'next/server'

// Authentication
import { auth } from '@/infrastructure/auth'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'

// Database
import { prisma } from '@/lib/prisma'

// Dependency Injection
import { container, DI_TOKENS } from '@/lib/di/container'

// Domain/Application
import { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

// Error Handling
import * as Sentry from '@sentry/nextjs'
```

**Key imports for pages:**

```typescript
// Next.js
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'

// Authentication
import { auth } from '@/infrastructure/auth'

// Components
import { YourComponent } from '@/presentation/components/...'

// Utilities
import { getMetadata } from '@/lib/constants/seo'
```

## Architecture Patterns

### Clean Architecture in API Routes

Routes follow Clean Architecture separation:

```
API Route (Controller)
    ↓
UseCase (Application Layer)
    ↓
Repository/Domain Logic
    ↓
Prisma (Infrastructure)
    ↓
Database
```

The DI container (`container.resolve()`) provides dependencies at the route level.

### Route Organization

- **Public Routes**: Landing page, login, legal pages
- **Protected Routes**: Everything under `(dashboard)`, `(auth)`
- **Admin Routes**: Everything under `(admin)` (requires admin role)
- **API Routes**: All `/api/*` routes (vary by endpoint)

### Error Response Standards

All error responses follow:
```typescript
{
  message: "Human-readable error message",
  code?: "ERROR_CODE", // Optional error code for clients
  status: 400 // HTTP status code
}
```

### Success Response Standards

List responses:
```typescript
{
  data: [...],
  total: number,
  page: number,
  limit: number,
  totalPages?: number
}
```

Single resource responses:
```typescript
{
  id: string,
  // ... resource fields
}
```

## Related Directories

- **Components**: `src/presentation/components/` - React components used in pages
- **Hooks**: `src/presentation/hooks/` - Custom React hooks
- **Business Logic**: `src/domain/` - Entities, value objects, repositories
- **Use Cases**: `src/application/use-cases/` - Business use cases
- **Infrastructure**: `src/infrastructure/` - External integrations, database, auth
- **Utils**: `src/lib/` - Shared utilities, DI container, constants

## Common Development Tasks

| Task | Location | Pattern |
|------|----------|---------|
| Add new API endpoint | `src/app/api/[resource]/route.ts` | See Route Handler Development section |
| Create new page | `src/app/(group)/route/page.tsx` | See Page Development section |
| Modify layout | `src/app/(group)/layout.tsx` | See Layout Development section |
| Handle errors | `src/app/error.tsx` or `src/app/api/*/route.ts` try/catch | See Error Handling section |
| Add authentication | Route handler or page server component | Use `await auth()` from @/infrastructure/auth |
| Protected admin route | `src/app/(admin)/admin/*/page.tsx` | Check `session?.user?.role === 'ADMIN'` |

## Configuration

- **Next.js Config**: `next.config.ts` - Turbopack, redirects, rewrites
- **TypeScript Config**: `tsconfig.json` - Path aliases, strict mode
- **SEO Config**: `src/lib/constants/seo.ts` - Global metadata
- **Environment Variables**: `.env.example` - API keys, OAuth credentials
- **Database**: `prisma/schema.prisma` - Database models

## Recent Issues & Fixes

### Turbopack & Middleware (Known Issue)

**Status**: Workaround implemented

Next.js 16.1.1 + Turbopack combination causes middleware to not execute properly. Solution:
- Auth redirects implemented directly in page layouts (see `(auth)/layout.tsx`, `page.tsx`)
- Middleware kept minimal (just `NextResponse.next()`)
- When issue is fixed, migrate redirects back to middleware

### Database Unavailability Handling

**Status**: Fixed (recent commits)

When database is unavailable:
- Auth fails gracefully
- PrismaAdapter disabled automatically
- Health endpoint returns status
- API routes return 503 Service Unavailable

See recent commits: `69bdfad`, `f040c9b`, `ece2e52`

## Performance Considerations

1. **Pagination**: All list endpoints paginate (page/limit) to prevent large responses
2. **Query Optimization**: Use Prisma select to fetch only needed fields
3. **Caching**: Consider cache headers for frequently accessed data (reports, KPIs)
4. **Streaming**: Large PDF downloads use streaming responses
5. **Quota Checking**: API calls quota-checked before expensive operations

## Security Considerations

1. **Authentication**: All protected routes check session/token
2. **Authorization**: Admin routes verify user role
3. **Input Validation**: Request bodies and query parameters validated
4. **Error Messages**: Production errors are generic (no internal details leaked)
5. **CORS**: Configured in `next.config.ts` if needed
6. **Rate Limiting**: Consider implementing on high-usage endpoints
7. **Sensitive Data**: Never log passwords, tokens, API keys

## Monitoring & Logging

- **Sentry Integration**: Error tracking in `error.tsx`
- **Vercel Analytics**: User behavior tracking
- **Speed Insights**: Performance monitoring
- **Console Logs**: Used in development and for errors
- **Structured Logging**: Recommended for production API routes

