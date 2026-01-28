<!-- Parent: ../AGENTS.md -->

# Presentation Layer - AGENTS.md

**Location:** `src/presentation/`
**Purpose:** React UI layer for Batwo AI Marketing platform. Implements component library, custom hooks, and client-side state management.

## Overview

The presentation layer is the user-facing part of the application. It contains:
- **React components** (shadcn/ui based) organized by feature domain
- **Custom hooks** for data fetching, mutations, and side effects (TanStack Query)
- **Zustand stores** for client-side state management
- **Landing page** and **dashboard** interfaces

This layer consumes APIs from `src/app/api/*` and business logic from `src/application/`.

## Directory Structure

```
src/presentation/
├── components/          # React components (shadcn/ui + Tailwind)
│   ├── admin/          # Admin dashboard components
│   ├── alerts/         # Notification and alert components
│   ├── ab-test/        # A/B testing UI
│   ├── campaign/       # Campaign management components
│   ├── common/         # Shared layout components
│   ├── dashboard/      # KPI dashboard and analytics
│   ├── landing/        # Public landing page
│   ├── onboarding/     # Onboarding wizard
│   ├── pixel/          # Meta pixel setup components
│   ├── quota/          # MVP quota management
│   ├── report/         # Report generation and display
│   └── team/           # Team collaboration UI
├── hooks/              # Custom React hooks (TanStack Query)
├── stores/             # Zustand state stores
└── AGENTS.md          # This file
```

## Key Files

| File | Purpose | Type |
|------|---------|------|
| `components/landing/HeroSection.tsx` | Hero section with animated dashboard preview | Component |
| `components/landing/FeaturesSection.tsx` | Feature highlights with icons | Component |
| `components/landing/PricingSection.tsx` | Pricing plans and CTA | Component |
| `components/dashboard/KPICard.tsx` | Reusable KPI metric card with trends | Component |
| `components/dashboard/CampaignSummaryTable.tsx` | Campaign performance table | Component |
| `components/campaign/CampaignCard.tsx` | Campaign card with status and actions | Component |
| `components/campaign/CampaignCreateForm/` | Multi-step form (4 steps) | Component |
| `components/campaign/AICopySuggestions.tsx` | AI-powered copy generation | Component |
| `components/campaign/OptimizationPanel.tsx` | AI optimization recommendations | Component |
| `components/onboarding/OnboardingWizard.tsx` | 4-step onboarding flow | Component |
| `components/pixel/PixelSelector.tsx` | Meta pixel selection UI | Component |
| `hooks/useCampaigns.ts` | Fetch/create/update campaigns (TanStack Query) | Hook |
| `hooks/useDashboardKPI.ts` | Fetch dashboard KPI data | Hook |
| `hooks/useReports.ts` | Report generation and retrieval | Hook |
| `hooks/useQuota.ts` | MVP quota tracking | Hook |
| `hooks/useAICopy.ts` | AI copy generation mutation | Hook |
| `stores/campaignStore.ts` | Campaign filters, selection, form draft | Zustand |
| `stores/uiStore.ts` | Global UI state (modals, sidebars) | Zustand |
| `stores/quotaStore.ts` | MVP quota limits and usage | Zustand |
| `stores/onboardingStore.ts` | Onboarding progress and completion | Zustand |

## Subdirectories Reference

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| **components/admin/** | Admin dashboard components for system monitoring | `AdminHeader.tsx`, `AdminSidebar.tsx`, `AdminStatsCard.tsx` |
| **components/alerts/** | Real-time notification system | `NotificationCenter.tsx` |
| **components/ab-test/** | A/B testing UI and management | `ABTestCard.tsx`, `ABTestList.tsx`, `CreateABTestDialog.tsx` |
| **components/campaign/** | Campaign creation, editing, and management | `CampaignCard.tsx`, `CampaignList.tsx`, `CampaignCreateForm/` (multi-step) |
| **components/common/Layout/** | App layout shells | `MainLayout.tsx`, `Header.tsx`, `Sidebar.tsx`, `MobileSidebar.tsx` |
| **components/dashboard/** | Real-time KPI dashboard | `KPICard.tsx`, `KPIChart.tsx`, `CampaignSummaryTable.tsx`, `AnomalyAlert.tsx`, `AIInsights.tsx` |
| **components/landing/** | Public-facing landing page sections | `HeroSection.tsx`, `FeaturesSection.tsx`, `PricingSection.tsx`, `FAQSection.tsx` (10 sections) |
| **components/onboarding/** | Multi-step user onboarding | `OnboardingWizard.tsx`, `steps/` (Welcome, MetaConnect, PixelSetup, Completion) |
| **components/pixel/** | Meta pixel installation UI | `PixelSelector.tsx`, `PixelStatus.tsx`, `UniversalScriptCopy.tsx` |
| **components/quota/** | MVP usage quota display | `QuotaStatusBadge.tsx`, `QuotaExceededDialog.tsx`, `UpgradeCTA.tsx` |
| **components/report/** | Weekly/monthly report display | `ReportList.tsx`, `ReportDetail.tsx` |
| **components/team/** | Team management and invitations | `TeamList.tsx`, `TeamMemberList.tsx`, `TeamSettings.tsx`, `InviteMemberDialog.tsx` |

## Hooks Reference

### Data Fetching (TanStack Query)

```typescript
// Campaign data
useCampaigns(params?)              // Fetch paginated campaigns
useCampaign(id)                    // Fetch single campaign
useCreateCampaign()                // Mutation: create campaign
useUpdateCampaign()                // Mutation: update campaign
useDeleteCampaign()                // Mutation: delete campaign

// Dashboard
useDashboardKPI()                  // Fetch dashboard KPI data
useCampaignKPI(id)                 // Fetch campaign-specific KPIs

// Reports
useReports(params?)                // Fetch reports list
useGenerateReport()                // Mutation: generate report

// AI Features
useAICopy()                        // Mutation: generate AI copy
useOptimization()                  // Mutation: get optimization suggestions

// MVP Features
useQuota()                         // Get current quota usage
useBudgetAlert()                   // Get budget alerts
useAlerts()                        // Get notification alerts
useABTests()                       // A/B test data
useTeams()                         // Team management

// Utility
useIntersectionObserver()          // Viewport visibility detection
useCampaignMutations()             // Batch campaign mutations
```

### Configuration

All hooks use TanStack Query v5 with:
- **Stale time:** 30 seconds (campaigns) to 5 minutes (dashboard)
- **Cache:** Automatic invalidation on mutations
- **Retry:** 3 retries with exponential backoff for failed requests

## Stores Reference

### campaignStore (Zustand + localStorage)

```typescript
// Filters
filters: CampaignFilters          // status, sortBy, sortOrder, searchQuery
setFilters(partial)               // Update filters
resetFilters()                    // Reset to defaults

// Selection
selectedCampaignIds: string[]     // Multi-select state
selectCampaign(id)                // Add to selection
selectAllCampaigns(ids)           // Bulk select
clearSelection()                  // Clear all selections

// Form Draft (persisted)
formDraft: CampaignFormDraft      // Form progress (step 1-4)
saveFormDraft(draft)              // Save partial form
clearFormDraft()                  // Reset form + step

// Current Step
currentStep: number               // Campaign create form step (1-4)
setCurrentStep(step)              // Navigate between steps
```

**Persistence:** Form draft and current step are persisted to localStorage.

### uiStore (Zustand)

Global UI state for modals, drawers, notifications, sidebar visibility.

```typescript
// Modal state
isModalOpen: boolean
openModal(type)
closeModal()

// Sidebar state
isSidebarOpen: boolean
toggleSidebar()
```

### quotaStore (Zustand)

MVP usage quotas for the current user/org.

```typescript
quotas: {
  campaignsPerWeek: { limit: 5, used: 2 }
  aiCopyPerDay: { limit: 20, used: 15 }
  aiAnalysisPerWeek: { limit: 5, used: 1 }
}
checkQuota(type): boolean
incrementQuota(type): void
```

### onboardingStore (Zustand)

Onboarding completion tracking.

```typescript
currentStep: number               // 1-4
isComplete: boolean               // All steps done?
stepsCompleted: Set<number>       // Completed step numbers
skipStep(number)                  // Skip optional step
completeStep(number)              // Mark step complete
```

## Component Patterns

### shadcn/ui Integration

All components use **shadcn/ui** primitives from `@/components/ui/`:

```typescript
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
```

Radix UI primitives are wrapped with Tailwind CSS 4 for styling.

### Tailwind CSS 4

Modern utility-first CSS with:
- **Container queries** for responsive components
- **CSS Variables** for theming (light/dark)
- **Gradients** for visual polish (hero, cards)
- **Animations** (fade-in, slide-up, pulse)

```typescript
className="bg-gradient-to-r from-primary/20 to-transparent dark:from-primary/10"
className="animate-slide-in-left group-hover:opacity-100 transition-all duration-300"
```

### Accessibility (WCAG 2.1 AA)

All components include:
- **Semantic HTML** (`<button>`, `<nav>`, `<main>`)
- **ARIA labels** for interactive elements
- **Keyboard navigation** (Tab, Enter, Escape)
- **Color contrast** ratios ≥ 4.5:1
- **Focus indicators** visible at all times
- **Screen reader** friendly text

```typescript
<button
  aria-label="Delete campaign"
  aria-expanded={isOpen}
  role="tab"
/>
```

### Form Patterns

Forms use **React Hook Form** + **Zod** validation:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(3, 'Name required'),
  budget: z.number().positive(),
})

export function Form() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  })
  // ...
}
```

### Multi-Step Forms

Campaign creation uses `currentStep` state from Zustand:

```typescript
// Step 1: Business Info
// Step 2: Target Audience
// Step 3: Budget
// Step 4: Review

// Form draft persisted during navigation
// Users can return to incomplete form
```

## Development Guidelines

### Creating Components

1. **Use shadcn/ui** - Don't build from scratch, compose existing components
2. **Client component** - Add `'use client'` directive at top for interactive components
3. **Props interface** - Define TypeScript interface for all props
4. **Accessibility** - Include ARIA labels, semantic HTML, keyboard support
5. **Testing** - Add `data-testid` attributes for Playwright/Vitest

```typescript
'use client'

import { FC } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MyComponentProps {
  title: string
  onClick: () => void
  isLoading?: boolean
  className?: string
}

export const MyComponent: FC<MyComponentProps> = ({
  title,
  onClick,
  isLoading = false,
  className,
}) => {
  return (
    <Button
      onClick={onClick}
      disabled={isLoading}
      aria-busy={isLoading}
      className={cn('transition-all', className)}
    >
      {isLoading ? 'Loading...' : title}
    </Button>
  )
}
```

### Creating Hooks

1. **TanStack Query** for async data - use `useQuery`, `useMutation`
2. **Zustand** for client state - use `create()` with `persist` middleware
3. **Custom hooks** for complex logic - compose from above patterns
4. **Server state vs client state** - Query for data, Zustand for UI/filters

```typescript
'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useMyData() {
  return useQuery({
    queryKey: ['mydata'],
    queryFn: async () => {
      const res = await fetch('/api/mydata')
      return res.json()
    },
    staleTime: 30 * 1000,
  })
}

export function useUpdateData() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch('/api/mydata', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mydata'] })
    },
  })
}
```

### Styling Best Practices

1. **Use Tailwind utilities** - Not custom CSS in components
2. **Color tokens** - Use `text-primary`, `bg-muted`, `border-border` (from CSS vars)
3. **Dark mode** - Add `dark:` prefixes for dark theme support
4. **Responsive** - Mobile-first with `md:`, `lg:` breakpoints
5. **Animations** - Use Tailwind built-ins and custom CSS vars in `globals.css`

```typescript
<div className="p-4 md:p-6 lg:p-8 text-sm md:text-base text-foreground dark:text-foreground/80 bg-white dark:bg-slate-950 rounded-lg border border-border/50 dark:border-border transition-colors duration-300" />
```

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **react** | 19.2.3 | UI framework with Server Components support |
| **next** | 16.1.1 | Framework (App Router, Turbopack) |
| **@tanstack/react-query** | 5.90.12 | Server state management (data fetching) |
| **zustand** | 5.0.9 | Client state management (lightweight) |
| **tailwindcss** | 4 | Utility CSS framework with CSS variables |
| **@tailwindcss/postcss** | 4.1.18 | Tailwind PostCSS plugin |
| **shadcn/ui** | (via git) | Radix UI + Tailwind component library |
| **lucide-react** | 0.562.0 | Icon library (200+ icons) |
| **react-hook-form** | 7.69.0 | Efficient form state management |
| **@hookform/resolvers** | 5.2.2 | Zod schema validation for forms |
| **zod** | 4.2.1 | Schema validation and type safety |
| **date-fns** | 4.1.0 | Date manipulation (campaigns, reports) |
| **@radix-ui/*** | Various | Accessible component primitives |
| **class-variance-authority** | 0.7.1 | Composable component variants |
| **clsx** | 2.1.1 | Conditional className utility |
| **tailwind-merge** | 3.4.0 | Merge Tailwind classes safely |
| **resend** | 6.6.0 | Email delivery for reports |
| **@sentry/nextjs** | 10.32.1 | Error tracking and monitoring |

## Testing

### Unit Tests (Vitest + React Testing Library)

Test individual components and hooks:

```bash
npm test
npm run test:unit
```

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KPICard } from './KPICard'

describe('KPICard', () => {
  it('renders with title and value', () => {
    render(<KPICard title="Revenue" value={5000} format="currency" />)
    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('5,000원')).toBeInTheDocument()
  })

  it('shows change indicator', () => {
    render(<KPICard title="ROAS" value={3.5} change={12} changeType="increase" />)
    expect(screen.getByText('+12%')).toBeInTheDocument()
  })
})
```

### Integration Tests

Test hooks with mock API responses:

```bash
npm run test:integration
```

### E2E Tests (Playwright)

Test full user flows in real browser:

```bash
npx playwright test
npx playwright test --ui  # Interactive mode
```

```typescript
import { test, expect } from '@playwright/test'

test('Create campaign flow', async ({ page }) => {
  await page.goto('/campaigns/create')
  await page.fill('[name="campaignName"]', 'Test Campaign')
  await page.click('button:has-text("Next")')
  expect(page).toHaveURL('/campaigns/create?step=2')
})
```

## Common Tasks

### Add New Component

```bash
# 1. Create component file
touch src/presentation/components/my-feature/MyComponent.tsx

# 2. Define props interface and component
# 3. Import shadcn/ui components as needed
# 4. Add 'use client' if interactive
# 5. Add ARIA labels for accessibility
# 6. Create index.ts for barrel export

# 7. Export from parent index.ts
# echo "export * from './MyComponent'" >> src/presentation/components/my-feature/index.ts
```

### Add New Hook

```bash
# 1. Create hook file
touch src/presentation/hooks/useMyHook.ts

# 2. Define hook with TypeScript interfaces
# 3. Use useQuery or useMutation from TanStack Query
# 4. Return properly typed data
# 5. Export from hooks/index.ts
```

### Add Form to Component

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18),
})

type FormData = z.infer<typeof schema>

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}
      <button type="submit">Submit</button>
    </form>
  )
}
```

## Common Issues

### Query Not Updating After Mutation

Use `queryClient.invalidateQueries()` in `onSuccess`:

```typescript
useMutation({
  mutationFn: updateCampaign,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns'] })
  },
})
```

### Form Reset Not Working

Use `reset()` from `useForm`:

```typescript
const { handleSubmit, reset } = useForm()

const onSuccess = () => {
  reset() // Clears form and errors
}
```

### Hydration Mismatch

Ensure component is client-rendered for interactive state:

```typescript
'use client'  // Add this at top of file

import dynamic from 'next/dynamic'

// Or use dynamic import for heavy components
const HeavyComponent = dynamic(() => import('./Heavy'), { ssr: false })
```

### Dark Mode Not Working

Verify `html` element has `dark` class (managed by next-themes):

```typescript
// In root layout
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

## File Organization

### Component Naming

- **File:** PascalCase.tsx (e.g., `KPICard.tsx`, `CampaignList.tsx`)
- **Export:** Named export with component name
- **Folder:** Feature-based organization (campaign, dashboard, landing)

### Hook Naming

- **File:** use*.ts (e.g., `useCampaigns.ts`, `useQuota.ts`)
- **Export:** Named export (function name and hook)
- **Location:** `src/presentation/hooks/`

### Store Naming

- **File:** *Store.ts (e.g., `campaignStore.ts`, `uiStore.ts`)
- **Export:** Named export (e.g., `useCampaignStore`)
- **Location:** `src/presentation/stores/`

## AI Agent Instructions

### For Component Development

You are a **React UI Engineer** specializing in shadcn/ui and Tailwind CSS 4.

**When implementing components:**

1. Use shadcn/ui as the base - compose from existing components
2. Add `'use client'` directive for interactive components
3. Use Tailwind utilities only - no custom CSS
4. Support dark mode with `dark:` prefixes
5. Include ARIA labels for accessibility
6. Add `data-testid` for testing elements
7. Use TypeScript interfaces for all props
8. Handle loading/error states gracefully
9. Export from both component file and index.ts
10. Test accessibility with keyboard navigation

**Example component structure:**

```typescript
'use client'

import { FC, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

interface FeatureItemProps {
  icon: ReactNode
  title: string
  description: string
  isActive?: boolean
  onClick?: () => void
  className?: string
}

export const FeatureItem: FC<FeatureItemProps> = ({
  icon,
  title,
  description,
  isActive = false,
  onClick,
  className,
}) => {
  return (
    <button
      onClick={onClick}
      aria-pressed={isActive}
      data-testid="feature-item"
      className={cn(
        'flex items-start gap-4 p-4 rounded-lg border transition-all duration-200',
        isActive && 'bg-primary/10 border-primary/30',
        !isActive && 'bg-muted/30 border-border hover:border-border/80',
        className
      )}
    >
      <div className="flex-shrink-0 mt-1 text-primary">{icon}</div>
      <div className="text-left">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
      {isActive && <Check className="w-5 h-5 text-primary flex-shrink-0" />}
    </button>
  )
}
```

### For Hook Development

You are a **React Hooks Engineer** specializing in TanStack Query and Zustand.

**When implementing hooks:**

1. Use TanStack Query for server state (data fetching)
2. Use Zustand for client state (UI, filters, forms)
3. Define clear TypeScript interfaces for request/response
4. Handle error states with proper error messages
5. Set appropriate cache times based on data freshness needs
6. Invalidate caches on mutations
7. Return properly typed data with loading/error states
8. Document hook behavior in comments
9. Export from hooks/index.ts barrel

**TanStack Query patterns:**

```typescript
// Fetching
export function useData(id: string) {
  return useQuery({
    queryKey: ['data', id],
    queryFn: () => fetchData(id),
    enabled: !!id, // Skip if id is undefined
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  })
}

// Mutations with cache invalidation
export function useCreateData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createData,
    onSuccess: (newData) => {
      queryClient.invalidateQueries({ queryKey: ['data'] })
      queryClient.setQueryData(['data', newData.id], newData)
    },
    onError: (error) => {
      console.error('Creation failed:', error)
    },
  })
}
```

**Zustand patterns:**

```typescript
// Simple store
export const useStore = create<StoreState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Store with persistence
export const usePersistentStore = create<StoreState>()(
  persist(
    (set) => ({
      // Store logic
    }),
    {
      name: 'store-key',
      partialize: (state) => ({ /* only these fields persist */ }),
    }
  )
)
```

### For Testing

**When testing components:**

1. Test user interactions, not implementation
2. Use `data-testid` to find elements
3. Use `screen.getByText`, `screen.getByRole` for semantic queries
4. Test accessibility (keyboard navigation, ARIA)
5. Mock API calls with MSW
6. Test loading and error states

**When testing hooks:**

1. Use `renderHook` from testing library
2. Mock API responses with MSW
3. Test cache invalidation
4. Test error handling

---

**Last Updated:** 2025-01-23
**Status:** Complete - Ready for development
