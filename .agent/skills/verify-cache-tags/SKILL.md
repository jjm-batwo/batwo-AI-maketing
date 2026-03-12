---
name: verify-cache-tags
description: Verifies ISR cache tags and mutation API revalidateTag calls are consistently mapped.
---

# ISR Cache Tag Consistency Verification

## Purpose

Verifies that the Next.js ISR cache tag system is correctly configured:

1. **Missing revalidateTag** — Mutation API missing `revalidateTag()` call for related tags
2. **Missing revalidateTag 2nd argument** — In Next.js 16, `revalidateTag('tag', 'default')` format requires a 2nd argument
3. **Tag mismatch** — Tags used in fetch don't match tags invalidated in revalidateTag
4. **Mutation API without revalidateTag** — POST/PATCH/PUT/DELETE methods exist but no revalidateTag call

## When to Run

- After adding new API routes
- After modifying mutation logic in existing API routes
- After modifying fetch calls in server component pages

## Related Files

| File | Purpose |
|------|---------|
| `src/app/api/campaigns/route.ts` | Campaign creation API — invalidates `campaigns`, `kpi`, `admin-dashboard` tags |
| `src/app/api/campaigns/[id]/route.ts` | Campaign update/delete API — invalidates `campaigns`, `kpi`, `admin-dashboard` tags |
| `src/app/api/campaigns/[id]/status/route.ts` | Campaign status change API — invalidates `campaigns`, `kpi`, `admin-dashboard` tags |
| `src/app/api/reports/route.ts` | Report creation API — invalidates `reports` tag |
| `src/app/api/reports/[id]/route.ts` | Report delete API — invalidates `reports` tag |
| `src/app/api/reports/[id]/send/route.ts` | Report email send API — delivery-only side effect (ISR tag exception) |
| `src/app/api/reports/[id]/share/route.ts` | Report share API — delivery/link generation only (ISR tag exception) |
| `src/app/api/campaigns/budget-recommendation/route.ts` | Budget recommendation API — calculation result return only (ISR tag exception) |
| `src/app/api/admin/refunds/[id]/route.ts` | Refund processing API — invalidates `admin-dashboard` tag |
| `src/app/api/admin/users/[id]/route.ts` | User management API — invalidates `admin-dashboard` tag |
| `src/app/api/admin/settings/admins/route.ts` | Admin settings API — invalidates `admin-dashboard` tag |
| `src/app/api/dashboard/kpi/route.ts` | Dashboard KPI API — uses cache service (Redis), short TTL (2 min) |
| `src/app/api/ai/feedback/route.ts` | AI feedback API — read-only GET + creation POST (ISR tag unnecessary, exception) |
| `src/app/api/ai/feedback/analytics/route.ts` | Feedback analytics API — read-only GET (ISR tag unnecessary, exception) |
| `src/app/api/audit/accounts/route.ts` | Audit target ad account list API — read-only GET (ISR cache unnecessary) |
| `src/app/api/audit/analyze/route.ts` | Audit analysis execution API — one-off POST (ISR cache unnecessary) |
| `src/app/api/audit/auth-url/route.ts` | Audit OAuth URL generation API — read-only GET (ISR cache unnecessary) |
| `src/app/api/audit/callback/route.ts` | Audit OAuth callback API — token exchange GET (ISR cache unnecessary) |
| `src/app/api/audit/pdf/route.ts` | Audit PDF generation API — read-only POST (one-off generation, ISR cache unnecessary) |
| `src/app/api/audit/share/route.ts` | Audit result share link API — uses in-memory cache (`auditShareCache`) |
| `src/app/api/audit/share/[token]/route.ts` | Share token lookup API — read-only GET (ISR tag unnecessary) |
| `src/app/(dashboard)/campaigns/page.tsx` | Campaign list page — uses `campaigns`, `kpi` tags |
| `src/app/(dashboard)/campaigns/[id]/page.tsx` | Campaign detail page — uses `campaigns` tag |
| `src/app/(dashboard)/reports/page.tsx` | Reports list page — uses `reports` tag |
| `src/app/(dashboard)/dashboard/page.tsx` | Dashboard page — Client Component, uses TanStack Query (no ISR) |
| `src/app/(dashboard)/optimization-rules/page.tsx` | Optimization rules page — uses `optimization-rules`, `campaigns` tags (revalidate: 60) |
| `src/app/(admin)/admin/page.tsx` | Admin dashboard — uses `admin-dashboard` tag |

## Workflow

### Step 1: Collect revalidateTag calls from mutation APIs

**Check:** Extract `revalidateTag()` calls from API routes.

```bash
grep -rn "revalidateTag(" src/app/api/ --include="*.ts"
```

**Result:** Collect per-API invalidation tag list

### Step 2: revalidateTag 2nd argument verification (Next.js 16 required)

**Check:** Verify all `revalidateTag()` calls take 2 arguments.

```bash
# Detect revalidateTag calls with only 1 argument
grep -Prn "revalidateTag\(['\"][^'\"]*['\"](?!\s*,)" src/app/api/ --include="*.ts"
```

**PASS criteria:** All `revalidateTag` calls use 2-argument format
**FAIL criteria:** Calls using only 1 argument exist

**Fix:**
```typescript
// Before (violation)
revalidateTag('campaigns')

// After (fixed)
revalidateTag('campaigns', 'default')
```

### Step 3: Detect mutation APIs missing revalidateTag

**Check:** Detect API routes exporting POST/PATCH/PUT/DELETE methods without calling `revalidateTag`.

```bash
# List API route files with mutation methods
grep -rl "export async function \(POST\|PATCH\|PUT\|DELETE\)" src/app/api/ --include="*.ts"
```

Filter this list for files without `revalidateTag`.

**PASS criteria:** All mutation APIs call appropriate revalidateTag
**FAIL criteria:** Mutation API missing revalidateTag

### Step 4: Tag mapping consistency verification

**Check:** Verify these mapping rules are followed:

| Tag | Fetch usage pages | revalidateTag usage APIs |
|-----|------------------|------------------------|
| `campaigns` | Campaign pages | Campaigns CRUD + status API |
| `kpi` | Campaign page (KPI section) | Campaigns CRUD + status API |
| `reports` | Reports page | Reports CRUD API |
| `admin-dashboard` | Admin page | Admin mutation + campaigns CRUD + status API |

**PASS criteria:** All tags are bidirectionally mapped between fetch and revalidateTag
**FAIL criteria:** Tag exists on only one side or mapping is missing

## Output Format

```markdown
### verify-cache-tags Results

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | revalidateTag collection | Done | X APIs, Y calls |
| 2 | 2-argument format verification | PASS/FAIL | Violations: N |
| 3 | Mutation API missing | PASS/FAIL | Missing: route path |
| 4 | Tag mapping consistency | PASS/FAIL | Mismatch: tag name |
```

## Exceptions

The following are **NOT violations**:

1. **Meta connection status API** — Real-time data API doesn't use cache, so revalidateTag is unnecessary
2. **Read-only APIs** — API routes exporting only GET are not mutations, so revalidateTag is unnecessary
3. **Webhook APIs** — External webhook receiving APIs (e.g., `src/app/api/payments/webhook/`) may use separate cache strategies
4. **Auth APIs** — `src/app/api/auth/` related APIs are session-based, unrelated to ISR tags
5. **AdSet/Ad/Creative/Asset APIs** — Newly added APIs not yet connected to ISR pages; show warning only
6. **KPI/Cron APIs** — Batch/sync-only APIs may use separate mechanisms instead of direct cache invalidation
7. **AI/Agent APIs** — `src/app/api/ai/**`, `src/app/api/agent/**` chatbot/AI analysis APIs are real-time responses, unrelated to ISR pages
8. **Audit APIs** — `src/app/api/audit/**` one-off analysis/PDF generation/share APIs don't need ISR cache (uses in-memory cache)
9. **Pixel APIs** — `src/app/api/pixel/**` pixel install/event APIs are not connected to ISR pages (expand when needed)
10. **Payment APIs** — `src/app/api/payments/**` payment/subscription/billing APIs are not connected to ISR pages
11. **Team APIs** — `src/app/api/teams/**` team management APIs are not connected to ISR pages
12. **Platform APIs** — `src/app/api/platform/**` Cafe24 integration APIs are not connected to ISR pages
13. **Alert APIs** — `src/app/api/alerts/**`, `src/app/api/campaigns/[id]/budget-alert/` alert APIs are real-time
14. **Internal APIs** — `src/app/api/internal/**` stats/warmup APIs are operational, unrelated to ISR tags
15. **Test APIs** — `src/app/api/test/**` dev-only APIs don't need ISR tags
16. **Asset APIs** — `src/app/api/assets/**` file upload APIs have no direct ISR page connection
17. **AB Test APIs** — `src/app/api/ab-tests/**` experiment APIs are not connected to ISR pages
18. **Meta Account APIs** — `src/app/api/meta/accounts/`, `src/app/api/meta/select-account/` Meta account selection/connection APIs are not connected to ISR pages
19. **Report delivery APIs** — `src/app/api/reports/[id]/send/route.ts`, `src/app/api/reports/[id]/share/route.ts` are email delivery/share processing only, they don't change ISR page data models
20. **Budget recommendation API** — `src/app/api/campaigns/budget-recommendation/route.ts` returns recommendation calculations with no persisted read model changes, so revalidateTag is unnecessary
21. **Report schedule API** — `src/app/api/reports/schedule/route.ts` report schedule changes happen in real-time, unrelated to ISR cache
22. **Analytics APIs** — `src/app/api/analytics/**` benchmark, funnel data etc. are for real-time dashboards, unrelated to ISR
