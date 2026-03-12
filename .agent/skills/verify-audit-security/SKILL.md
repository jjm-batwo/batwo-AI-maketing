---
name: verify-audit-security
description: Verifies audit report HMAC signing/verification consistency. Use after modifying audit APIs or HMAC utilities.
---

# Audit Report HMAC Signing/Verification Consistency

## Purpose

Verifies that the audit report HMAC signing/verification system is consistently applied across all related endpoints:

1. **HMAC utility existence** — `signReport`, `verifyReport` functions are correctly exported
2. **Production enforcement policy** — Policy exists to throw when secret key is not set in production
3. **Signature generation** — `analyze` endpoint calls `signReport`
4. **Signature verification** — `pdf`, `share` endpoints call `verifyReport`
5. **Client-side forwarding** — Callback page includes `signature` in state management and API requests
6. **Environment variable documentation** — `.env.example` contains `AUDIT_HMAC_SECRET` entry
7. **Test coverage** — Unit tests exist and cover environment-specific policies

## When to Run

- After adding or modifying `src/lib/security/auditHmac.ts`
- After adding or modifying audit-related API endpoints (`analyze`, `pdf`, `share`)
- After changing HMAC secret key environment variable policies
- After modifying the audit callback page (`src/app/audit/callback/page.tsx`)

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/security/auditHmac.ts` | HMAC signing/verification utility — exports `signReport`, `verifyReport` |
| `src/app/api/audit/analyze/route.ts` | Signature generation endpoint — calls `signReport` |
| `src/app/api/audit/pdf/route.ts` | Signature verification endpoint — calls `verifyReport` |
| `src/app/api/audit/share/route.ts` | Signature verification endpoint — calls `verifyReport` |
| `src/app/audit/callback/page.tsx` | Client — `signature` state management and API request forwarding |
| `.env.example` | Environment variable docs — `AUDIT_HMAC_SECRET` entry presence |
| `tests/unit/lib/auditHmac.test.ts` | Unit tests — environment-specific policy, signing/verification scenarios |

## Workflow

### Step 1: HMAC utility existence and export verification

**File:** `src/lib/security/auditHmac.ts`

**Check:** Verify `signReport` and `verifyReport` functions are exported.

```bash
grep -n "export" "src/lib/security/auditHmac.ts"
```

**PASS criteria:** Both `signReport` and `verifyReport` are exported
**FAIL criteria:** Either function is not exported or the file doesn't exist

**Fix:**
```typescript
export async function signReport(payload: ReportPayload): Promise<string> { ... }
export async function verifyReport(payload: ReportPayload, signature: string): Promise<boolean> { ... }
```

### Step 2: Production enforcement policy verification

**File:** `src/lib/security/auditHmac.ts`

**Check:** Verify `getSecret()` or similar internal function has a `production` branch with `throw` or error return.

```bash
grep -n "production\|throw\|Error" "src/lib/security/auditHmac.ts"
```

**PASS criteria:** `process.env.NODE_ENV === 'production'` condition and `throw` coexist
**FAIL criteria:** No production enforcement policy

**Fix:**
```typescript
function getSecret(): string {
  const secret = process.env.AUDIT_HMAC_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUDIT_HMAC_SECRET is required in production');
  }
  return secret ?? 'dev-fallback-secret';
}
```

### Step 3: Signature generation verification (analyze endpoint)

**File:** `src/app/api/audit/analyze/route.ts`

**Check:** Verify `signReport` import and invocation exist.

```bash
grep -n "signReport" "src/app/api/audit/analyze/route.ts"
```

**PASS criteria:** Both `signReport` import and call exist
**FAIL criteria:** Either import or call is missing

### Step 4: Signature verification (pdf, share endpoints)

**Files:** `src/app/api/audit/pdf/route.ts`, `src/app/api/audit/share/route.ts`

**Check:** Verify `verifyReport` import and invocation exist in each file.

```bash
grep -n "verifyReport" "src/app/api/audit/pdf/route.ts"
grep -n "verifyReport" "src/app/api/audit/share/route.ts"
```

**PASS criteria:** Both files have `verifyReport` import and call
**FAIL criteria:** Either file is missing `verifyReport`

### Step 5: Client signature forwarding verification

**File:** `src/app/audit/callback/page.tsx`

**Check:** Verify `signature` state management and inclusion in API request bodies.

```bash
grep -n "signature" "src/app/audit/callback/page.tsx"
```

**PASS criteria:** Both `signature` state declaration (useState/useRef etc.) and API request body inclusion exist
**FAIL criteria:** Either state declaration or API forwarding is missing

### Step 6: Environment variable documentation verification

**File:** `.env.example`

**Check:** Verify `AUDIT_HMAC_SECRET` entry exists.

```bash
grep -n "AUDIT_HMAC_SECRET" ".env.example"
```

**PASS criteria:** `AUDIT_HMAC_SECRET` key is documented in `.env.example`
**FAIL criteria:** Entry is missing from `.env.example`

### Step 7: Test coverage verification

**File:** `tests/unit/lib/auditHmac.test.ts`

**Check:** Verify test file exists and tests environment-specific policies (production throw).

```bash
ls "tests/unit/lib/auditHmac.test.ts" 2>/dev/null || echo "MISSING"
grep -n "production\|throw\|NODE_ENV" "tests/unit/lib/auditHmac.test.ts" 2>/dev/null
```

**PASS criteria:** Test file exists + production environment policy test included
**FAIL criteria:** Test file missing or environment-specific branch test absent

## Output Format

```markdown
### verify-audit-security Results

| # | Check | Status | Detail |
|---|-------|--------|--------|
| 1 | HMAC utility export | PASS/FAIL | signReport, verifyReport presence |
| 2 | Production enforcement policy | PASS/FAIL | production throw policy presence |
| 3 | Signature generation (analyze) | PASS/FAIL | signReport import/call |
| 4 | Signature verification (pdf, share) | PASS/FAIL | verifyReport import/call |
| 5 | Client signature forwarding | PASS/FAIL | State management and API inclusion |
| 6 | Environment variable documentation | PASS/FAIL | .env.example entry presence |
| 7 | Test coverage | PASS/FAIL | Test file and environment policy test |
```

## Exceptions

The following are **NOT violations**:

1. **auth-url/route.ts** — Only generates OAuth auth URLs, not an HMAC signing target
2. **callback/route.ts** — Only receives Meta OAuth callbacks, not an HMAC signing target
3. **accounts/route.ts** — Read-only endpoint for ad account list, not an HMAC signing target
4. **share/[token]/route.ts** — Public share API may use a different HMAC approach (token-based verification allowed)
5. **Dev environment fallback secret** — Hardcoded fallback usage when `NODE_ENV !== 'production'` is normal behavior
6. **Test file not existing** — If `auditHmac.ts` is not yet implemented, show warning only; don't FAIL
