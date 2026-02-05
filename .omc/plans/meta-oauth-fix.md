# Meta OAuth Login Fix Plan

## Context

### Original Request
Fix Meta OAuth login issues discovered during testing. The login flow fails with two distinct errors when attempting to authenticate via Meta (Facebook) login.

### Interview Summary
Based on codebase analysis, the batwo-maketting service-saas project uses:
- NextAuth.js v5 with Facebook provider for social login
- Meta Graph API v18.0 for OAuth
- Two OAuth flows:
  1. **Login flow** (`/api/auth/callback/facebook`) - Basic login with email/public_profile
  2. **Ads connection flow** (`/api/meta/callback`) - Advanced permissions for ads management

### Research Findings

**Error 1: Invalid Scopes**
```
Invalid Scopes: email. This message is only shown to developers.
```
- Root cause: Meta app (ID: 25668891759434584) is in **development mode**
- In development mode, `email` scope requires either:
  - The user to be a registered test user/developer on the Meta app
  - OR the app to go through app review for the `email` permission

**Error 2: URL Domain Not Registered**
```
앱 도메인에 포함되어 있지 않은 URL 도메인입니다.
```
- Root cause: `http://localhost:3000` is not configured in the Meta app's:
  - Valid OAuth Redirect URIs
  - App Domains

**Current Configuration (auth.ts:11, 38-47)**
```typescript
const META_LOGIN_SCOPES = 'email,public_profile'

Facebook({
  clientId: process.env.META_APP_ID ?? '',
  clientSecret: process.env.META_APP_SECRET ?? '',
  allowDangerousEmailAccountLinking: true,
  authorization: {
    params: {
      scope: META_LOGIN_SCOPES,
    },
  },
}),
```

---

## Work Objectives

### Core Objective
Enable Meta OAuth login to work in development mode for testing, while maintaining production readiness.

### Deliverables
1. **Code changes** to handle development mode gracefully
2. **Documentation** for Meta app configuration
3. **Fallback behavior** when email scope is unavailable

### Definition of Done
- [ ] Meta OAuth login works on localhost:3000
- [ ] Login succeeds even if email permission is denied
- [ ] Clear documentation exists for Meta app setup
- [ ] Both development and production environments are supported
- [ ] All existing tests pass

---

## Must Have / Must NOT Have

### MUST HAVE (Guardrails)
| Rule | Rationale |
|------|-----------|
| Support login without email scope | Development mode doesn't grant email to non-test users |
| Preserve existing production behavior | Don't break working production OAuth |
| Document Meta app configuration | Other developers need to replicate setup |
| Handle OAuth errors gracefully | Show user-friendly error messages |

### MUST NOT HAVE
| Anti-pattern | Reason |
|--------------|--------|
| Hard-code test user credentials | Security risk |
| Bypass OAuth in development | Must test real OAuth flow |
| Remove email scope entirely | Production needs it |
| Store Meta app secrets in code | Security violation |

---

## Task Flow and Dependencies

```
[Phase 1: Meta App Configuration]
    |
    v
[Phase 2: Code Changes]
    |
    +---> [2.1 Scope Handling]
    |
    +---> [2.2 Error Handling]
    |
    v
[Phase 3: Documentation]
    |
    v
[Phase 4: Verification]
```

---

## Detailed TODOs

### Phase 1: Meta App Configuration (Manual - Developer Portal)

#### TODO 1.1: Configure App Domains
**Priority:** P0 (Blocking)
**Estimated time:** 5 minutes
**Dependencies:** Access to Meta Developer Portal

**Steps:**
1. Go to https://developers.facebook.com/apps/25668891759434584/settings/basic/
2. In "App Domains" field, add:
   - `localhost`
3. Save changes

**Acceptance Criteria:**
- [ ] `localhost` appears in App Domains list
- [ ] Settings saved without error

#### TODO 1.2: Configure Valid OAuth Redirect URIs
**Priority:** P0 (Blocking)
**Estimated time:** 5 minutes
**Dependencies:** TODO 1.1

**Steps:**
1. Go to https://developers.facebook.com/apps/25668891759434584/fb-login/settings/
2. In "Valid OAuth Redirect URIs" field, add:
   - `http://localhost:3000/api/auth/callback/facebook` (NextAuth callback)
   - `http://localhost:3000/api/meta/callback` (Ads OAuth callback)
3. Save changes

**Acceptance Criteria:**
- [ ] Both URIs appear in the list
- [ ] Settings saved without error

#### TODO 1.3: Add Test Users (Recommended)
**Priority:** P1 (Important for full functionality)
**Estimated time:** 10 minutes
**Dependencies:** TODO 1.1

**Steps:**
1. Go to https://developers.facebook.com/apps/25668891759434584/roles/test-users/
2. Add your Facebook account as a test user
3. OR go to Roles > Roles and add yourself as a developer

**Acceptance Criteria:**
- [ ] Your account can access email scope in development mode
- [ ] Can log in with full permissions

---

### Phase 2: Code Changes

#### TODO 2.1: Make Email Scope Optional in Development
**Priority:** P1
**Estimated time:** 15 minutes
**File:** `src/infrastructure/auth/auth.ts`
**Lines:** 9-11, 38-47
**Dependencies:** None

**Implementation:**
```typescript
// Line 9-14: Environment-aware scope configuration
const getMetaLoginScopes = () => {
  // In development mode without test user setup, email might not be available
  // public_profile is always available
  const baseScopes = 'public_profile'

  // email requires app review in production or test user in development
  // We request it but handle gracefully if denied
  return process.env.NODE_ENV === 'development'
    ? baseScopes  // Minimal scope for guaranteed dev login
    : 'email,public_profile'  // Full scope for production
}

const META_LOGIN_SCOPES = getMetaLoginScopes()
```

**Acceptance Criteria:**
- [ ] Development mode uses `public_profile` only
- [ ] Production mode uses `email,public_profile`
- [ ] TypeScript compiles without errors

#### TODO 2.2: Handle Missing Email in JWT/Session Callbacks
**Priority:** P1
**Estimated time:** 20 minutes
**File:** `src/infrastructure/auth/auth.config.ts`
**Lines:** 86-108
**Dependencies:** TODO 2.1

**Implementation:**
Update JWT callback to handle users without email. Use `account?.providerAccountId` which is already available in the existing callback signature:

```typescript
// In jwt callback (line 86-108) - keep existing signature
jwt({ token, user, account }) {
  // ... existing debug logging ...
  if (user) {
    token.id = user.id
    token.globalRole = user.globalRole || GlobalRole.USER

    // Handle missing email (development mode without email scope)
    // Use account.providerAccountId which contains the Facebook user ID
    if (!user?.email && account?.providerAccountId) {
      // Generate a placeholder email based on provider account ID
      token.email = `fb_${account.providerAccountId}@placeholder.batwo.local`
    }
  }
  if (account) {
    token.provider = account.provider
  }
  return token
}
```

**Note:** This uses `account?.providerAccountId` instead of `profile?.id` because:
1. `account` is already in the callback signature
2. `providerAccountId` contains the same Facebook user ID
3. No need to modify the callback signature

**Acceptance Criteria:**
- [ ] Login succeeds without email
- [ ] Session has a usable identifier (placeholder email generated)
- [ ] No null pointer errors on missing email
- [ ] TypeScript compiles without errors (no signature changes needed)

#### TODO 2.3: Enhance OAuth Error Messages
**Priority:** P2
**Estimated time:** 15 minutes
**File:** `src/app/(auth)/login/page.tsx`
**Lines:** 11-25
**Dependencies:** None

**Implementation:**
Add specific error messages for Meta OAuth issues:

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  // ... existing messages ...

  // Meta-specific errors
  'invalid_scope': 'Meta 앱 권한 설정이 필요합니다. 관리자에게 문의하세요.',
  'invalid_redirect_uri': 'OAuth 리다이렉트 URL이 등록되지 않았습니다.',
  'access_denied': 'Meta 로그인이 거부되었습니다. 다시 시도해주세요.',
}
```

**Acceptance Criteria:**
- [ ] Scope errors show user-friendly message
- [ ] Redirect URI errors are handled
- [ ] Messages are in Korean as per existing pattern

#### TODO 2.4: Add Development Mode Indicator
**Priority:** P3
**Estimated time:** 10 minutes
**File:** `src/app/(auth)/login/page.tsx`
**Lines:** 125-146
**Dependencies:** TODO 2.1

**Implementation:**
Show a development mode warning when in dev environment:

```typescript
{process.env.NODE_ENV === 'development' && (
  <p className="text-xs text-amber-600 text-center">
    개발 모드: Meta 로그인은 테스트 사용자로 제한됩니다
  </p>
)}
```

**Acceptance Criteria:**
- [ ] Warning appears only in development
- [ ] Warning is not shown in production
- [ ] Styling matches existing UI

---

### Phase 3: Documentation

#### TODO 3.1: Create Meta App Setup Guide
**Priority:** P1
**Estimated time:** 30 minutes
**File:** `docs/deployment/META_APP_SETUP.md` (NEW)
**Dependencies:** Phase 1 & 2 complete

**Content outline:**
1. Prerequisites
2. Creating a Meta App
3. Configuring Facebook Login product
4. Setting up OAuth redirect URIs (dev + prod)
5. Adding test users for development
6. App review requirements for production
7. Troubleshooting common errors

**Acceptance Criteria:**
- [ ] Step-by-step instructions with screenshots references
- [ ] Covers both development and production setup
- [ ] Includes troubleshooting section
- [ ] Links to official Meta documentation

#### TODO 3.2: Update .env.example with Better Comments
**Priority:** P2
**Estimated time:** 10 minutes
**File:** `.env.example`
**Lines:** 30-44
**Dependencies:** None

**Implementation:**
Enhance Meta-related comments:

```bash
# -------------------------------------------
# Meta Ads API (필수 - Meta 광고 연동)
# -------------------------------------------
# 1. https://developers.facebook.com 에서 앱 생성
# 2. Facebook 로그인 제품 추가
# 3. 유효한 OAuth 리디렉션 URI 설정:
#    - http://localhost:3000/api/auth/callback/facebook (개발 - NextAuth)
#    - http://localhost:3000/api/meta/callback (개발 - Ads OAuth)
#    - https://yourdomain.com/api/auth/callback/facebook (프로덕션)
#    - https://yourdomain.com/api/meta/callback (프로덕션)
# 4. 앱 도메인에 'localhost' 추가 (개발용)
# 5. 테스트 사용자 등록 (개발 시 email 권한 필요 시)
# 6. 앱 검수에서 아래 권한 요청 필요 (프로덕션):
#    - email (프로덕션 로그인)
#    - ads_management, ads_read, business_management, pages_read_engagement
META_APP_ID=""
META_APP_SECRET=""
```

**Acceptance Criteria:**
- [ ] All OAuth redirect URIs documented
- [ ] Development vs production differences clear
- [ ] Test user requirement mentioned

---

### Phase 4: Verification

#### TODO 4.1: Test Development Login Flow
**Priority:** P0
**Estimated time:** 15 minutes
**Dependencies:** All previous phases

**Test Steps:**
1. Start dev server: `npm run dev`
2. Navigate to `http://localhost:3000/login`
3. Click "Meta로 계속하기" button
4. Complete OAuth flow on Facebook (approve permissions)
5. Verify redirect back to app

**Verification - Session Created Successfully:**
- After login redirect, navigate to `/campaigns` - should display dashboard, NOT redirect back to `/login`
- In browser dev tools (Application tab), check for session cookie `authjs.session-token`
- In browser dev tools (Network tab), verify `/api/auth/session` returns user data with `id` field

**Verification - Console Logs (development mode):**
- Check terminal for `[AUTH] jwt callback:` log with `hasUser: true`
- Check terminal for `[AUTH] session callback:` log with `tokenId` populated

**Acceptance Criteria:**
- [ ] No "Invalid Scopes" error during OAuth flow
- [ ] No "URL Domain" error during OAuth redirect
- [ ] Successful redirect to `/campaigns` after login (not back to `/login`)
- [ ] Session cookie `authjs.session-token` present in browser
- [ ] `/api/auth/session` returns valid user object with `id`

#### TODO 4.2: Test Error Handling
**Priority:** P1
**Estimated time:** 10 minutes
**Dependencies:** TODO 4.1

**Test Steps:**
1. Test with invalid Meta App ID (should show configuration error)
2. Test with user denying permissions (should show access denied)
3. Verify all error messages display correctly

**Acceptance Criteria:**
- [ ] Errors are caught and displayed
- [ ] No unhandled exceptions
- [ ] User-friendly Korean messages shown

#### TODO 4.3: Run Existing Tests
**Priority:** P0
**Estimated time:** 10 minutes
**Dependencies:** All code changes

**Commands:**
```bash
npm run type-check  # TypeScript compilation
npm test            # Unit tests
npm run lint        # ESLint checks
```

**Acceptance Criteria:**
- [ ] TypeScript compiles without errors
- [ ] All existing tests pass
- [ ] No new lint errors

---

## Commit Strategy

### Commit 1: Meta App Configuration Documentation
```
docs: add Meta app OAuth configuration guide

- Create META_APP_SETUP.md with step-by-step instructions
- Update .env.example with detailed OAuth setup comments
- Document development vs production differences
```

### Commit 2: OAuth Scope Handling
```
feat(auth): make email scope optional in development mode

- Use public_profile only in development for guaranteed login
- Handle missing email in JWT/session callbacks
- Add placeholder email generation for dev users
```

### Commit 3: Error Handling Enhancement
```
fix(auth): improve Meta OAuth error messages

- Add specific error messages for Meta OAuth failures
- Add development mode indicator on login page
- Improve error handling for scope/redirect issues
```

---

## Risk Identification and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Production login breaks | Low | High | Environment-specific scope configuration; test in staging first |
| Users confused by placeholder email | Medium | Low | Only in dev mode; clear documentation |
| Meta app configuration missed | Medium | High | Checklist in documentation; verification steps |
| Test users not properly configured | Medium | Medium | Fallback to public_profile only in dev |

---

## Success Criteria

### Immediate (This PR)
- [ ] Meta OAuth login works on localhost:3000
- [ ] Development mode has graceful fallback
- [ ] All existing tests pass
- [ ] Documentation complete

### Follow-up (Future)
- [ ] Production environment tested
- [ ] App review submitted for email permission
- [ ] Monitoring for OAuth errors in production

---

## Files to Modify

| File | Type | Changes |
|------|------|---------|
| `src/infrastructure/auth/auth.ts` | Edit | Environment-aware scope config |
| `src/infrastructure/auth/auth.config.ts` | Edit | Handle missing email |
| `src/app/(auth)/login/page.tsx` | Edit | Error messages + dev indicator |
| `.env.example` | Edit | Enhanced comments |
| `docs/deployment/META_APP_SETUP.md` | New | Setup guide |

---

## Estimated Total Time

| Phase | Time |
|-------|------|
| Meta App Configuration | 20 minutes |
| Code Changes | 60 minutes |
| Documentation | 40 minutes |
| Verification | 35 minutes |
| **Total** | **~2.5 hours** |

---

## Notes

1. **Manual Step Required**: Phase 1 requires manual configuration in Meta Developer Portal. This cannot be automated.

2. **Environment Awareness**: The solution is environment-aware to support both development (relaxed) and production (strict) modes.

3. **Backward Compatibility**: Existing production users should not be affected as email scope will still be requested in production.

4. **Test User Alternative**: If full email access is needed in development, adding the developer as a test user in Meta app is the recommended approach.
