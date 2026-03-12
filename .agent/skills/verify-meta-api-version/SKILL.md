---
name: verify-meta-api-version
description: Verifies Meta Graph API version is unified at v25.0. Use after adding/modifying Meta API related files.
---

## Purpose

1. **Version uniformity** — Verify all Meta Graph API calls use the same version (v25.0)
2. **New file coverage** — Detect if newly added Meta API clients use the correct version
3. **Hardcoding prevention** — Verify version strings are managed as constants

## When to Run

- After adding/modifying Meta API client files
- After changing OAuth-related code
- After adding new Meta Graph API endpoints
- After Meta API version upgrade work

## Related Files

| File | Purpose |
|------|---------|
| `src/infrastructure/external/meta-ads/MetaAdsClient.ts` | Main Meta Ads API client |
| `src/infrastructure/external/meta-ads/MetaAdsWarmupClient.ts` | API Warmup client |
| `src/infrastructure/external/meta-ads/AdLibraryClient.ts` | Ad Library API client |
| `src/infrastructure/external/meta-pages/MetaPagesClient.ts` | Pages API client |
| `src/infrastructure/auth/auth.ts` | Facebook OAuth provider |
| `src/app/api/meta/callback/route.ts` | Meta OAuth callback |
| `scripts/test-token.ts` | Token test script |
| `scripts/exchange-token.ts` | Token exchange script |
| `tests/unit/infrastructure/meta-ads/MetaAdsClient.test.ts` | MetaAdsClient unit test |

## Workflow

### Step 1: Detect non-v25.0 version usage

**Tool:** Grep

**Check:** Detect usage of versions other than v25.0 in `graph.facebook.com` or `facebook.com/v` patterns

```bash
grep -rn 'graph\.facebook\.com/v' --include='*.ts' --include='*.tsx' src/ scripts/ tests/ | grep -v 'v25\.0'
grep -rn 'facebook\.com/v' --include='*.ts' --include='*.tsx' src/ scripts/ tests/ | grep -v 'v25\.0'
```

**PASS:** No results (all references use v25.0)
**FAIL:** Non-v25.0 version found

**Fix:** Replace version in found files with v25.0

### Step 2: Verify version constant usage

**Tool:** Grep

**Check:** Detect if version is hardcoded inline in URLs (direct string usage instead of constant)

```bash
grep -rn "fetch.*graph\.facebook\.com/v" --include='*.ts' src/ | grep -v META_API
```

**PASS:** No direct URL hardcoding in fetch calls
**FAIL:** Direct URL usage without constant

**Fix:** Construct URLs via `META_API_BASE` or `META_API_VERSION` constant

### Step 3: Verify test MSW handler version consistency

**Tool:** Grep

**Check:** Verify test MSW handlers use the same version as production code

```bash
grep -rn 'graph\.facebook\.com/v' --include='*.test.ts' --include='*.test.tsx' tests/ | grep -v 'v25\.0'
```

**PASS:** All test MSW handlers use v25.0
**FAIL:** Tests use different version

## Output Format

| File | Current Version | Status |
|------|----------------|--------|
| MetaAdsClient.ts | v25.0 | ✅ PASS |
| auth.ts | v25.0 | ✅ PASS |

## Exceptions

1. **Version references in comments** — Mentioning previous versions in code comments or documentation is not a violation
2. **Migration guides** — Referencing previous versions in version upgrade documentation is normal
3. **Environment variable-based version** — Using dynamic version via `process.env.META_API_VERSION` etc. is an exception to the constant rule
