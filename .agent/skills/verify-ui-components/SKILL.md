---
name: verify-ui-components
description: Verifies UI component consistency, accessibility, and performance patterns. Use after modifying landing/dashboard/campaign/chat/optimization/pixel/onboarding/audit components.
---

# UI Component Verification

## Purpose

Verifies React component implementation consistency and quality:

1. **shadcn/ui consistency** — Custom components follow shadcn/ui patterns
2. **Accessibility (a11y)** — ARIA attributes, keyboard navigation, focus management
3. **Performance patterns** — Unnecessary re-renders, memoization, lazy loading
4. **Type safety** — Props interface completeness, generic usage
5. **Style consistency** — Tailwind class ordering, responsive design

## When to Run

- After adding new UI components
- After modifying landing page sections
- After changing dashboard components
- After adding/modifying chat UI components
- After changing campaign management components
- After changing optimization rule management components
- After customizing shadcn/ui components

## Related Files

| File | Purpose |
|------|---------|
| `src/presentation/components/landing/FeaturesSection/FeaturesSection.tsx` | Landing page features section — Intersection Observer animation |
| `src/presentation/components/landing/HeroSection/HeroContent.tsx` | Landing page hero — CTA button, social proof |
| `src/presentation/components/landing/HeroSection/AIInsight.tsx` | Hero AI insight — real-time analysis demo card |
| `src/presentation/components/landing/HeroSection/DashboardPreview.tsx` | Hero dashboard preview — tab-based demo UI |
| `src/presentation/components/landing/HeroSection/FreeAuditButton.tsx` | Hero free audit CTA button |
| `src/presentation/components/landing/HeroSection/KPIGrid.tsx` | Hero KPI grid — mini KPI card layout |
| `src/presentation/components/landing/HeroSection/MiniChart.tsx` | Hero mini chart — sparkline SVG chart |
| `src/presentation/components/landing/HeroSection/TabSwitcher.tsx` | Hero tab switcher — dashboard/audit/campaign tab toggle |
| `src/presentation/components/landing/PricingSection/PricingSection.tsx` | Pricing section — toggle, card grid |
| `src/presentation/components/landing/ProductShowcaseSection.tsx` | Product showcase — tab interface |
| `src/presentation/components/landing/SocialProofSection.tsx` | Social proof — card grid, quotes |
| `src/presentation/components/dashboard/KPICard.tsx` | KPI card — sparkchart, change rate display |
| `src/presentation/components/dashboard/KPIChart.tsx` | KPI chart — Recharts based |
| `src/presentation/components/dashboard/CampaignSummaryTable.tsx` | Campaign summary table — sorting, filtering |
| `src/presentation/components/dashboard/DonutChart.tsx` | Donut chart — campaign status distribution |
| `src/presentation/components/dashboard/AIInsights.tsx` | AI insights card |
| `src/presentation/components/dashboard/InsightDetailModal.tsx` | AI insight detail modal — Dialog based, rootCause/recommendations/forecast display, null guard pattern |
| `src/presentation/components/dashboard/OptimizationTimeline.tsx` | Optimization timeline — rule application history display |
| `src/presentation/components/dashboard/SavingsWidget.tsx` | Savings widget — estimated savings amount display |
| `src/presentation/components/dashboard/FeedbackSummaryCard.tsx` | Feedback summary card — positive rate/recent negative feedback display |
| `src/presentation/components/chat/ChatInput.tsx` | Chat input — character limit, keyboard send, accessibility |
| `src/presentation/components/chat/ChatMessage.tsx` | Chat message — role-based rendering, markdown support |
| `src/presentation/components/chat/ChatPanel.tsx` | Chat panel — message list, scroll, guide questions |
| `src/presentation/components/chat/ChatMessageFeedback.tsx` | Chat feedback — like/dislike buttons, ARIA accessibility |
| `src/presentation/components/optimization/OptimizationRuleTable.tsx` | Optimization rule list table UI |
| `src/presentation/components/optimization/OptimizationRuleForm.tsx` | Optimization rule create/edit form UI |
| `src/presentation/components/optimization/RulePresetCards.tsx` | Optimization rule preset cards UI |
| `src/presentation/components/campaign/CampaignTable.tsx` | Campaign table — toggle switch, sorting, bulk actions |
| `src/presentation/components/campaign/CampaignCard.tsx` | Campaign card — status badge, action dropdown |
| `src/presentation/components/campaign/CampaignList.tsx` | Campaign list — filtering, card grid |
| `src/presentation/components/campaign/CampaignEditForm.tsx` | Campaign edit form — budget, targeting settings |
| `src/presentation/components/campaign/OptimizationPanel.tsx` | Campaign optimization panel — AI recommendation display |
| `src/presentation/components/campaign/CampaignHierarchySection.tsx` | Campaign hierarchy drill-down section — ad set/ad navigation UI |
| `src/presentation/components/campaign/AdSetTable.tsx` | Ad set table — drill-down ad set list with insights, edit/chart actions |
| `src/presentation/components/campaign/AdTable.tsx` | Ad table — drill-down ad list with insights, edit/chart actions |
| `src/presentation/components/campaign/AdDetailPanel.tsx` | Ad detail slide panel — ad creative preview and edit interface |
| `src/app/(dashboard)/campaigns/CampaignsClient.tsx` | Campaign list client screen component |
| `src/app/(dashboard)/campaigns/[id]/CampaignDetailClient.tsx` | Campaign detail client screen component |
| `src/app/(dashboard)/campaigns/[id]/analytics/AnalyticsClient.tsx` | Campaign analytics client screen component |
| `src/presentation/components/audit/AuditReportCard.tsx` | Audit report card — score and improvement summary |
| `src/presentation/components/audit/AuditCategoryBreakdown.tsx` | Audit category analysis — detailed per-category scores |
| `src/presentation/components/audit/AuditConversionCTA.tsx` | Audit conversion CTA — bundle service signup prompt |
| `src/presentation/components/audit/EmptyAuditResult.tsx` | Audit empty result — guidance UI when no analysis data |
| `src/presentation/components/pixel/PlatformSelector.tsx` | Pixel install — platform selection card (Cafe24/custom/Naver) |
| `src/presentation/components/pixel/guides/CustomSiteGuide.tsx` | Pixel install — custom site install guide |
| `src/presentation/components/pixel/guides/NaverGuide.tsx` | Pixel install — Naver Smart Store install guide |
| `src/presentation/components/pixel/MatchRateBar.tsx` | Pixel install — EMQ match rate visualization bar |
| `src/presentation/components/pixel/PixelStatus.tsx` | Pixel install — pixel status dashboard (EMQ, health status integrated display) |
| `src/presentation/components/pixel/HybridTrackingCard.tsx` | Pixel install — pixel vs CAPI event cross-comparison card |
| `src/app/(dashboard)/settings/pixel/page.tsx` | Pixel settings page |
| `src/presentation/components/onboarding/steps/PixelSetupStep.tsx` | Onboarding — pixel install step (platform selection → guide branch) |
| `src/presentation/hooks/useScrollAnimation.ts` | Scroll animation hook |
| `src/presentation/hooks/useDashboardKPI.ts` | Dashboard KPI data hook |
| `src/presentation/hooks/useSavings.ts` | Savings amount calculation hook |
| `src/presentation/hooks/useAgentChat.ts` | AI chat SSE streaming hook |
| `src/presentation/stores/uiStore.ts` | Global UI state — ChatPanel/insight sharing (DashboardInsightSummary) |
| `src/presentation/hooks/useFeedback.ts` | Chat message feedback hook |
| `src/presentation/hooks/useFeedbackAnalytics.ts` | Feedback analytics data hook |
| `src/presentation/hooks/useKeyboardNavigation.ts` | Chat keyboard navigation hook |
| `src/presentation/hooks/useOptimizationRules.ts` | Optimization rules CRUD hook |
| `src/presentation/hooks/useAdSetsWithInsights.ts` | Campaign drill-down ad set + insights query hook |
| `src/presentation/hooks/useAdsWithInsights.ts` | Campaign drill-down ad + insights query hook |
| `src/presentation/components/audit/AccountSelector.tsx` | Audit account selector — ad account selection after OAuth callback |
| `src/presentation/utils/accountStatus.ts` | Account status utility — audit account status determination helper |
| `src/app/audit/callback/page.tsx` | Audit callback page (core audit UI) |
| `src/components/ui/` | shadcn/ui base components |
| `src/presentation/components/report/ReportDetail.tsx` | Report detail view — 9 enhanced sections with backward compat |
| `src/presentation/components/report/sections/OverallSummarySection.tsx` | KPI summary cards with change indicators |
| `src/presentation/components/report/sections/DailyTrendSection.tsx` | Daily metrics trend table |
| `src/presentation/components/report/sections/CampaignPerformanceSection.tsx` | Campaign metrics table |
| `src/presentation/components/report/sections/CreativePerformanceSection.tsx` | Top N creative ranking table |
| `src/presentation/components/report/sections/CreativeFatigueSection.tsx` | Fatigue score badges with recommendations |
| `src/presentation/components/report/sections/FormatComparisonSection.tsx` | Format comparison grid |
| `src/presentation/components/report/sections/FunnelPerformanceSection.tsx` | Funnel stage progress bars |
| `src/presentation/components/report/sections/PerformanceAnalysisSection.tsx` | AI analysis positive/negative factors |
| `src/presentation/components/report/sections/RecommendationsSection.tsx` | Action cards with priority badges |

## Workflow

### Step 1: Component Props interface verification

**Check:** Verify all components define complete TypeScript Props interfaces.

```bash
grep -rn "interface.*Props" src/presentation/components/landing/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/campaign/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/chat/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/optimization/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/pixel/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/onboarding/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/audit/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/analytics/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/components/report/ --include="*.tsx"
grep -rn "interface.*Props" src/presentation/utils/ --include="*.ts" --include="*.tsx"
```

**PASS criteria:** All components define Props interfaces
**FAIL criteria:** `any` type used or Props not defined

### Step 2: 'use client' directive verification

**Check:** Verify components using client hooks have 'use client' directive.

```bash
grep -rl "useState\|useEffect\|useMemo" src/presentation/components/ --include="*.tsx" | while read f; do
  if ! head -1 "$f" | grep -q "'use client'"; then
    echo "MISSING: $f"
  fi
done

grep -rl "useState\|useEffect\|useMemo\|useQuery" "src/app/(dashboard)/campaigns" --include="*Client.tsx" | while read f; do
  if ! head -1 "$f" | grep -q "'use client'"; then
    echo "MISSING: $f"
  fi
done
```

**PASS criteria:** 'use client' declared when using client hooks
**FAIL criteria:** Missing directive causing build errors

### Step 3: shadcn/ui component usage consistency

**Check:** Verify UI components reuse shadcn/ui base components.

```bash
grep -rn "@/components/ui/" src/presentation/components/landing/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/campaign/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/chat/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/optimization/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/pixel/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/onboarding/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/audit/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/analytics/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/components/report/ --include="*.tsx"
grep -rn "@/components/ui/" src/presentation/utils/ --include="*.ts" --include="*.tsx"
```

**PASS criteria:** Basic UI like Card, Button, Input uses shadcn/ui
**FAIL criteria:** Base components implemented from scratch

### Step 4: Tailwind class ordering and patterns

**Check:** Verify Tailwind CSS classes are written in consistent order.

```bash
grep -rn "cn(" src/presentation/components/landing/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/campaign/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/chat/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/optimization/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/pixel/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/onboarding/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/audit/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/analytics/ --include="*.tsx"
grep -rn "cn(" src/presentation/components/report/ --include="*.tsx"
grep -rn "cn(" src/presentation/utils/ --include="*.ts" --include="*.tsx"
```

**PASS criteria:** Conditional classes use `cn()` utility
**FAIL criteria:** Conditional classes handled with string templates

**Class ordering rules:**

1. Layout (flex, grid, block)
2. Spacing (p-, m-, gap-)
3. Sizing (w-, h-)
4. Typography (text-, font-)
5. Colors (bg-, text-, border-)
6. Effects (shadow-, rounded-)
7. States (hover:, focus:, disabled:)

### Step 5: Accessibility (a11y) basic check

**Check:** Verify basic accessibility attributes are included.

```bash
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/landing/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/campaign/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/chat/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/optimization/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/pixel/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/onboarding/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/audit/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/analytics/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/components/report/ --include="*.tsx"
grep -rn "aria-label\|aria-describedby\|aria-live\|role=" src/presentation/utils/ --include="*.ts" --include="*.tsx"
```

**PASS criteria:**

- Icon buttons have `aria-label`
- Images have `alt` text
- Form inputs have `label` connections
- Chat message lists have `role="log"` + `aria-live="polite"`
- Feedback buttons have `aria-label`

### Step 6: Performance pattern verification

**Check:** Verify patterns preventing unnecessary re-renders are applied.

```bash
grep -rn "useMemo\|useCallback" src/presentation/components/dashboard/ --include="*.tsx"
grep -rn "useMemo\|useCallback" src/presentation/components/campaign/ --include="*.tsx"
grep -rn "useMemo\|useCallback" src/presentation/components/chat/ --include="*.tsx"
grep -rn "useMemo\|useCallback" "src/app/(dashboard)/campaigns" --include="*Client.tsx"

grep -rn "queryKey:\s*\[.*datePreset" src/presentation/hooks/useAdSetsWithInsights.ts src/presentation/hooks/useAdsWithInsights.ts

grep -rn "React.memo\|memo(" src/presentation/components/ --include="*.tsx"
```

**PASS criteria:**

- Heavy calculations use `useMemo` for memoization
- Frequently re-rendered list items use `React.memo`
- Dashboard KPI calculations use `useMemo`
- Campaign table sorting/filtering uses `useMemo`/`useCallback`
- Chat event handlers use `useCallback`

### Step 7: Responsive design verification

**Check:** Verify mobile/tablet/desktop breakpoints are properly applied.

```bash
grep -rn "md:\|lg:\|sm:" src/presentation/components/landing/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/dashboard/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/campaign/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/chat/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/optimization/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/pixel/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/onboarding/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/audit/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/analytics/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/components/report/ --include="*.tsx" | head -20
grep -rn "md:\|lg:\|sm:" src/presentation/utils/ --include="*.ts" --include="*.tsx" | head -20
```

**PASS criteria:** All UI implemented mobile-first
**FAIL criteria:** UI breaks at certain screen sizes

### Step 8: Interactive element cursor-pointer verification

**Check:** Verify all interactive elements (buttons, clickable rows, tabs, links) have `cursor-pointer` class applied.

```bash
# Campaign table components — check that clickable name buttons have cursor-pointer
grep -n "cursor-pointer" src/presentation/components/campaign/CampaignTable.tsx
grep -n "cursor-pointer" src/presentation/components/campaign/AdSetTable.tsx
grep -n "cursor-pointer" src/presentation/components/campaign/AdTable.tsx

# Tab components — check that tab triggers have cursor-pointer
grep -n "cursor-pointer" src/components/ui/tabs.tsx

# Check for clickable elements missing cursor-pointer
grep -rn "onClick" src/presentation/components/campaign/ --include="*.tsx" | grep -v "cursor-pointer" | grep -v "Button\|button" | head -20
```

**PASS criteria:**
- All clickable table row name buttons have `cursor-pointer`
- Tab triggers have `cursor-pointer` (globally via shadcn/ui component)
- Interactive elements with `onClick` handlers use `cursor-pointer` or a Button component (which has built-in cursor)

**FAIL criteria:**
- Clickable elements (especially text-styled buttons in tables) lack `cursor-pointer`, making them appear non-interactive

## Output Format

```markdown
### verify-ui-components Results

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Props interfaces | PASS/FAIL | Missing: N files |
| 2 | 'use client' directive | PASS/FAIL | Missing: file paths |
| 3 | shadcn/ui usage | PASS/FAIL | Custom implementation: N |
| 4 | Tailwind classes | PASS/FAIL | cn() not used: N |
| 5 | Accessibility | PASS/FAIL | aria-label missing: N |
| 6 | Performance patterns | PASS/FAIL | useMemo recommended: N |
| 7 | Responsive design | PASS/WARN | Unverified: N |
| 8 | Cursor-pointer | PASS/FAIL | Missing: N elements |
```

## Exceptions

The following are **NOT violations**:

1. **Server Components** — Don't need 'use client' as pure server components
2. **Type definition files** — `.d.ts` files excluded from Props interface check
3. **Story/test files** — Storybook or test files excluded from accessibility checks
4. **HOC/utilities** — Higher-order components or utility functions excluded from some pattern checks
5. **Dynamic imports** — Components loaded via `lazy()` excluded from initial load checks
6. **Chat component textarea** — ChatInput's textarea uses aria-describedby for accessibility; using aria-label instead of label is allowed

## Examples

### Correct Example

```typescript
'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useMemo } from 'react'

interface KPICardProps {
  title: string
  value: number
  change?: number
  isLoading?: boolean
  className?: string
}

export function KPICard({ title, value, change, isLoading, className }: KPICardProps) {
  const formattedValue = useMemo(() => {
    return new Intl.NumberFormat('ko-KR').format(value)
  }, [value])

  return (
    <Card className={cn('hover:shadow-lg transition-shadow', className)}>
      <CardContent className="p-6">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <p className="mt-2 text-3xl font-bold">{formattedValue}</p>
        {change !== undefined && (
          <span className={cn(
            'text-sm',
            change > 0 ? 'text-green-600' : 'text-red-600'
          )}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </CardContent>
    </Card>
  )
}
```

### Violation Example

```typescript
// 'use client' missing
import { useState } from 'react' // Error!

// Props type not defined
export function BadComponent(props: any) { // Violation!
  // Class handling with string template
  return <div className={`p-4 ${props.active ? 'bg-blue-500' : ''}`}> // Violation!
    <button onClick={props.onClick}> {/* aria-label missing */}
      <Icon />
    </button>
  </div>
}
```
