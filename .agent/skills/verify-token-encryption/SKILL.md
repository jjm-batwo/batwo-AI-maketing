---
name: verify-token-encryption
description: Verifies encryption/decryption functions are consistently applied on DB accessToken store/retrieve paths. Use after adding/modifying Meta API integration code.
---

## Purpose

1. **Store path encryption** — Verify all paths storing accessToken to DB call `encryptToken()`
2. **Retrieve path decryption** — Verify all paths reading accessToken from DB and passing to external APIs call `safeDecryptToken()`
3. **Direct access prevention** — Detect code using `prisma.metaAdAccount` accessToken directly without encryption/decryption
4. **Enforcement point consistency** — Specify whether encryption/decryption is enforced via helper calls or repository mapper/middleware, and check for gaps when mixed

## When to Run

- After adding/modifying Meta OAuth callback or account connection code
- After adding new API routes that query MetaAdAccount accessToken
- After adding/modifying token-related use cases
- After modifying `TokenEncryption.ts` utility

## Related Files

| File | Purpose |
|------|---------|
| `src/application/utils/TokenEncryption.ts` | AES-256-GCM encryption/decryption utility |
| `src/app/api/meta/callback/route.ts` | Meta OAuth callback — token store (encryptToken) |
| `src/app/api/meta/select-account/route.ts` | Account selection — token store (encryptToken) |
| `src/app/api/meta/pages/route.ts` | Pages list — token retrieve (safeDecryptToken) |
| `src/app/api/meta/pages/[pageId]/insights/route.ts` | Page insights — token retrieve (safeDecryptToken) |
| `src/application/use-cases/campaign/SyncCampaignsUseCase.ts` | Campaign sync — token retrieve (safeDecryptToken) |
| `src/application/use-cases/token/RefreshMetaTokenUseCase.ts` | Token refresh — decrypt, exchange, re-encrypt and store |
| `src/infrastructure/database/repositories/PrismaConversionEventRepository.ts` | CAPI event repository — safeDecryptToken in findPixelTokenMappings |
| `src/lib/di/container.ts` | DI container — safeDecryptToken for Meta token decryption in buildAgentContext |
| `src/app/api/platform/cafe24/callback/route.ts` | Cafe24 OAuth callback — token store (encryptToken) |
| `src/app/api/platform/cafe24/inject/route.ts` | Cafe24 script injection — token retrieve (safeDecryptToken) |
| `src/app/api/platform/cafe24/disconnect/route.ts` | Cafe24 disconnect — token retrieve (safeDecryptToken) |
| `tests/unit/application/utils/TokenEncryption.test.ts` | TokenEncryption unit tests |

## Workflow

### Step 1: Detect missing encryptToken on accessToken DB store paths

**Tool:** Grep

**Check:** Verify `encryptToken` is called where `prisma.metaAdAccount.create` or `prisma.metaAdAccount.update`/`upsert` sets accessToken

```bash
grep -rn 'metaAdAccount\.\(create\|update\|upsert\)' --include='*.ts' src/ | grep -v node_modules
```

Verify each found file has `encryptToken` import and usage.

**PASS:** All store paths use `encryptToken()`
**FAIL:** Paths found storing accessToken in plaintext

**Fix:** Apply `encryptToken(accessToken)` before storing

### Step 2: Detect missing decryption when passing accessToken to external APIs

**Tool:** Grep

**Check:** Paths reading accessToken from MetaAdAccount and passing to external services (MetaAdsClient, MetaPagesClient, etc.)

```bash
grep -rn 'metaAdAccount.*accessToken\|\.accessToken' --include='*.ts' src/app/api/ src/application/use-cases/ src/infrastructure/database/repositories/ | grep -v 'encryptToken\|decryptToken\|TokenEncryption\|import'
```

**PASS:** All retrieve paths use `safeDecryptToken()`
**FAIL:** accessToken used directly without decryption

**Fix:** Apply `safeDecryptToken(accessToken)` before passing to external APIs

### Step 3: TokenEncryption utility import consistency

**Tool:** Grep

**Check:** Verify files handling accessToken import the TokenEncryption utility

```bash
grep -rln 'accessToken' --include='*.ts' src/app/api/meta/ src/application/use-cases/ src/infrastructure/database/repositories/ | xargs grep -L 'TokenEncryption\|encryptToken\|decryptToken' 2>/dev/null
```

**PASS:** No results, or one of these enforcement points is confirmed:

- Per-file helper usage (`encryptToken`, `safeDecryptToken`)
- Central enforcement via repository mapper/middleware is documented and verified in actual code

**FAIL:** File uses accessToken but neither helper usage nor central enforcement is confirmed

**Fix:** Apply appropriate encryption/decryption functions to that file

## Output Format

| File | Path Type | Function | Status |
|------|-----------|----------|--------|
| callback/route.ts | Store | encryptToken | ✅ PASS |
| pages/route.ts | Retrieve | safeDecryptToken | ✅ PASS |
| SyncCampaignsUseCase.ts | Retrieve | safeDecryptToken | ✅ PASS |

## Exceptions

1. **OAuthSession accessToken** — Temporary session storage with short TTL (5 min), encryption is optional
2. **Test code** — Tests using mock accessTokens don't need encryption
3. **TOKEN_ENCRYPTION_KEY not set** — When key is absent, `encryptToken` returns plaintext as-is; this is not an error (migration compatibility)
4. **Account model's accessToken** — NextAuth's Account table is managed internally by NextAuth, not a direct encryption target
