---
name: verify-bundle
description: Verifies patterns affecting production bundle size. Detects namespace imports, dev-only library leaks, and large chunks.
---

# Bundle Optimization Verification

## Purpose

Ensures no unnecessary code is included in the production bundle:

1. **Namespace import (`import *`)** — Detects namespace imports that block tree shaking
2. **Dev-only library production leak** — Dev-only libraries included in production bundle
3. **Missing conditional loading** — Dev-only code imported without `process.env.NODE_ENV` guard
4. **ssr:false in Server Component** — `next/dynamic`'s `ssr: false` is only allowed in Client Components

## When to Run

- After adding new external libraries
- After modifying import statements
- After using `next/dynamic`
- When build output size increases

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/errors/reportError.ts` | Sentry named imports (migrated from namespace import) |
| `src/app/error.tsx` | Sentry named imports (migrated from namespace import) |
| `src/app/providers.tsx` | ReactQueryDevtools lazy + dev-only conditional loading |
| `src/app/docs/page.tsx` | swagger-ui-react full production exclusion (`NODE_ENV` guard) |
| `src/app/layout.tsx` | Root layout (Server Component) |
| `src/app/(dashboard)/layout.tsx` | Dashboard layout (FacebookSDK Suspense loading) |
| `src/infrastructure/external/errors/CircuitBreaker.ts` | Circuit breaker — server-only, namespace import allowed |
| `src/infrastructure/external/errors/ResilienceService.ts` | Resilience service — server-only, verify client bundle exclusion |
| `src/infrastructure/external/errors/withRetry.ts` | Retry utility — server-only, verify client bundle exclusion |
| `src/infrastructure/pdf/AuditPDFGenerator.ts` | Audit PDF generator — server-only (verify bundle if using large libs like `pdf-lib`) |
| `src/infrastructure/cache/audit/UpstashAuditCache.ts` | Upstash Redis server-only dependency |
| `package.json` | dependencies vs devDependencies |

## Workflow

### Step 1: Namespace import (`import *`) detection

**Check:** Find `import * as` patterns in `src/`. These block tree shaking and should be replaced with named imports.

```bash
grep -rn "import \* as" src/ --include="*.ts" --include="*.tsx"
```

**PASS criteria:** No output or only allowed patterns
**FAIL criteria:** Namespace import used on tree-shakeable library

**Fix:**
```typescript
// Before (violation)
import * as Sentry from '@sentry/nextjs'
Sentry.captureException(error)

// After (fixed)
import { captureException } from '@sentry/nextjs'
captureException(error)
```

### Step 2: Dev-only library production leak detection

**Check:** Detect libraries in devDependencies imported without conditional guards.

Known dev-only libraries:
- `@tanstack/react-query-devtools`
- `swagger-ui-react`
- `@types/*`

```bash
grep -rn "from ['\"]swagger-ui-react\|from ['\"]@tanstack/react-query-devtools" src/ --include="*.ts" --include="*.tsx"
```

Verify detected files have `process.env.NODE_ENV` guards.

**PASS criteria:** All dev-only imports inside `process.env.NODE_ENV` guard or `React.lazy()`
**FAIL criteria:** Direct import without guard

**Fix:**
```typescript
// process.env.NODE_ENV guard
if (process.env.NODE_ENV !== 'production') {
  const SwaggerUI = (await import('swagger-ui-react')).default
}

// Or React.lazy + Suspense
const DevTools = lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
```

### Step 3: ssr:false in Server Component detection

**Check:** Verify `next/dynamic`'s `ssr: false` option is not used in Server Component files.

```bash
grep -rn "ssr:\s*false" src/app/**/layout.tsx src/app/**/page.tsx --include="*.tsx" 2>/dev/null
```

If the file lacks `'use client'`, it's a violation.

**PASS criteria:** `ssr: false` used only in Client Components
**FAIL criteria:** `ssr: false` used in Server Component

**Fix:**
- Extract component to a separate Client Component, or
- Use `typeof window !== 'undefined'` guard inside the component

## Output Format

```markdown
### verify-bundle Results

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | Namespace import (`import *`) | PASS/FAIL | Violations: N files |
| 2 | Dev-only production leak | PASS/FAIL | Unguarded imports: N |
| 3 | Server Component ssr:false | PASS/FAIL | Violations: N files |
```

## Exceptions

The following are **NOT violations**:

1. **Node.js built-in module namespace imports** — `import * as path from 'path'` etc. are not tree-shaking targets
2. **Server-only file namespace imports** — API routes in `src/app/api/` are not included in client bundle, so namespace imports are allowed
3. **Test files** — Files in `tests/` directory are not included in the bundle
4. **Type-only namespace imports** — `import type *` form has no runtime bundle impact
5. **Regular dynamic imports without next/dynamic** — `import()` expressions are for code splitting and are normal
6. **shadcn/radix UI primitive wrappers** — `import * as React` and `import * as <RadixPrimitive>` patterns in `src/components/ui/**` are upstream (shadcn/radix) recommended templates and are allowed
