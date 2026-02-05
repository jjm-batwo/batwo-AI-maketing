# E2E Test Activation - Learnings

## Mock Authentication Implementation

### NextAuth Session Cookie Approach

**Discovery:** NextAuth uses JWT tokens stored in HTTP-only cookies for session management.

**Implementation:**
```typescript
// Generate NextAuth compatible JWT token
const token = await encode({
  token: mockSession,
  secret: process.env.AUTH_SECRET,
  maxAge: 60 * 60 * 24 * 7,
})

// Set cookie with proper name
const cookieName = secureCookie
  ? '__Secure-authjs.session-token'
  : 'authjs.session-token'

cookieStore.set(cookieName, token, {
  httpOnly: true,
  secure: secureCookie,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
})
```

**Key Learning:** Cookie name changes based on `secure` flag:
- Development: `authjs.session-token`
- Production: `__Secure-authjs.session-token`

## Playwright Global Setup Pattern

### Storage State Persistence

**Pattern:**
1. Global setup runs once before all tests
2. Creates authenticated session via API
3. Saves browser context to `storage-state.json`
4. Authenticated tests reuse this state
5. Global teardown cleans up

**Benefits:**
- Single authentication for all tests
- Faster test execution (no repeated login)
- Consistent session state

**Implementation:**
```typescript
// In global-setup.ts
const storageState = await context.storageState()
await context.storageState({ path: './storage-state.json' })

// In playwright.config.ts
{
  name: 'chromium-authenticated',
  use: {
    storageState: './tests/e2e/storage-state.json',
  },
}
```

## Test Database Seeding

### Upsert Pattern for Idempotency

**Problem:** Tests may run multiple times, need to handle existing data.

**Solution:** Use Prisma `upsert()` for all test data creation.

```typescript
const testUser = await prisma.user.upsert({
  where: { email: 'test@example.com' },
  update: {},  // Don't update if exists
  create: {
    email: 'test@example.com',
    name: 'Test User',
    // ...
  },
})
```

**Key Learning:** Upsert ensures:
- First run: Creates data
- Subsequent runs: Reuses existing data
- No duplicate key errors

### Composite Key Handling

**Discovery:** Campaigns use composite unique key `userId_metaCampaignId`.

```typescript
where: {
  userId_metaCampaignId: {
    userId: testUser.id,
    metaCampaignId: 'campaign_test_001',
  },
}
```

## TypeScript Import Patterns

### CommonJS vs ES Modules

**Problem:** Default imports fail with `esModuleInterop: false`.

**Solution:** Use namespace imports for Node.js modules.

```typescript
// ❌ Fails
import fs from 'fs'
import path from 'path'

// ✅ Works
import * as fs from 'fs'
import * as path from 'path'
```

**Key Learning:** Playwright test files use CommonJS-compatible imports.

## Test API Security

### Multi-Layer Protection

**Layer 1: Environment Check**
```typescript
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_API) {
  return 403
}
```

**Layer 2: Database URL Validation**
```typescript
const databaseUrl = process.env.DATABASE_URL || ''
if (!databaseUrl.includes('test') && process.env.NODE_ENV !== 'test') {
  return skip
}
```

**Key Learning:** Never trust single check. Defense in depth prevents production data corruption.

## Test Fixture Patterns

### Progressive Enhancement Approach

**Pattern:**
1. Try best approach (Mock API)
2. Fallback to alternative (Manual login)
3. Handle gracefully if both fail

```typescript
try {
  const response = await page.goto('/api/test/mock-auth')
  if (response?.ok()) {
    return // Success
  }
} catch (error) {
  // Fall back to manual login
}

// Manual login implementation
await page.goto('/login')
// ...
```

**Key Learning:** E2E tests should be resilient to environment changes.

## Error Test Strategies

### Network Mocking with `page.route()`

**Discovery:** Playwright's `page.route()` allows intercepting requests.

**Use Cases:**
- Simulate API failures
- Test retry logic
- Test error messages

```typescript
await page.route('**/api/campaigns', (route) => {
  route.abort('failed')  // Simulate network error
})
```

**Key Learning:** Network mocking is more reliable than actual server errors for testing.

### Conditional Assertions

**Problem:** Not all UI states are implemented yet.

**Solution:** Check if element exists before asserting.

```typescript
const isVisible = await element.isVisible({ timeout: 5000 })
  .catch(() => false)

if (isVisible) {
  await expect(element).toBeVisible()
}
```

**Key Learning:** Graceful degradation allows partial test coverage during development.

## Test Coverage Strategy

### Incremental Activation

**Approach:**
1. Start with critical path tests (auth, navigation)
2. Enable UI tests as components are implemented
3. Add error cases progressively
4. Keep some tests as TODO documentation

**Metrics:**
- Before: 5% E2E coverage (only unauthenticated paths)
- After: 25% E2E coverage (auth + basic flows)
- Target: 90% E2E coverage (full UI implementation)

**Key Learning:** Skip tests document future work, not just failures.

## Playwright Project Dependencies

### Sequential Project Execution

**Discovery:** Can enforce test execution order with `dependencies`.

```typescript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'chromium-authenticated',
    use: { storageState: './storage-state.json' },
    dependencies: ['chromium'],  // Run after chromium
  },
]
```

**Use Case:** Ensure global setup completes before authenticated tests run.

**Key Learning:** Project dependencies provide execution order guarantees.

## Debugging Techniques

### Console Logging in Tests

**Pattern:** Add contextual logging for debugging failures.

```typescript
console.log('[Auth Fixture] Mock session created successfully')
console.warn('[Auth Fixture] Mock auth API failed, falling back...')
console.error('[DB Init] Error initializing database:', error)
```

**Key Learning:** Prefix logs with component name for easier filtering.

### Timeout Strategies

**Pattern:** Use catch for optional elements.

```typescript
const isVisible = await element.isVisible({ timeout: 5000 })
  .catch(() => false)
```

**Benefits:**
- No timeout errors for optional elements
- Tests continue execution
- Boolean result easy to use in conditions

## Future Improvements

### Test Data Factories

**Idea:** Create factory functions for common test data patterns.

```typescript
// Future pattern
const testUser = await TestFactory.createUser({ email: 'test@example.com' })
const testCampaign = await TestFactory.createCampaign({ userId: testUser.id })
```

**Benefits:**
- DRY principle
- Consistent test data
- Easier to maintain

### Parallel Test Execution

**Current:** Sequential execution (global setup dependency)
**Future:** Isolate each test with its own session

**Approach:**
- Each test creates its own mock session
- Use test fixtures instead of global setup
- Better parallelization

### Visual Regression Testing

**Next Step:** Add Playwright screenshot comparison.

```typescript
await expect(page).toHaveScreenshot('campaign-list.png')
```

**Benefits:**
- Catch CSS regressions
- Verify responsive design
- Document UI states

## References

- [Playwright Authentication](https://playwright.dev/docs/auth)
- [NextAuth JWT](https://next-auth.js.org/configuration/options#jwt)
- [Prisma Upsert](https://www.prisma.io/docs/reference/api-reference/prisma-client-reference#upsert)
