# E2E Test Activation - Architectural Decisions

## AD-001: Mock Authentication via API Endpoints

**Status:** Accepted

**Context:**
- Need to run authenticated E2E tests without real OAuth providers
- Playwright needs valid NextAuth session cookies
- Multiple tests should share same session for performance

**Decision:**
Create dedicated test API endpoints (`/api/test/mock-auth`) that generate valid NextAuth JWT tokens and set session cookies.

**Alternatives Considered:**

1. **Real OAuth Login**
   - Pros: Tests actual flow
   - Cons: Slow, flaky, requires credentials, rate limits

2. **Browser Storage Manipulation**
   - Pros: No API needed
   - Cons: NextAuth uses HTTP-only cookies, not accessible from JS

3. **Database Session Seeding**
   - Pros: Bypasses auth entirely
   - Cons: NextAuth expects JWT tokens, not DB sessions

**Consequences:**
- ✅ Fast test execution
- ✅ Reliable (no external dependencies)
- ✅ Security safeguards (production disabled)
- ⚠️ Doesn't test actual OAuth flow
- ⚠️ Requires test-specific API endpoints

## AD-002: Global Setup with Storage State

**Status:** Accepted

**Context:**
- Creating session for each test is slow (~2-5 seconds per test)
- 50+ authenticated tests = 100-250 seconds overhead
- Playwright supports shared browser contexts

**Decision:**
Use global setup to create session once, save to `storage-state.json`, reuse across all authenticated tests.

**Alternatives Considered:**

1. **Before Each Hook**
   - Pros: Test isolation
   - Cons: Very slow (2-5s × 50 tests = 100-250s)

2. **Before All Hook**
   - Pros: Faster than before each
   - Cons: Per-file setup, still ~20-30s overhead

3. **Test Fixtures**
   - Pros: Clean API
   - Cons: Still creates session per test unless shared

**Consequences:**
- ✅ 100-250s saved per test run
- ✅ Consistent session state
- ⚠️ All tests share same user session
- ⚠️ Changes in one test may affect others
- ⚠️ Must clean up state between tests

## AD-003: Upsert Pattern for Test Data

**Status:** Accepted

**Context:**
- Tests may run multiple times (during development)
- Database may already contain test data
- Unique constraints prevent duplicate data

**Decision:**
Use Prisma `upsert()` for all test data creation instead of `create()`.

**Alternatives Considered:**

1. **Delete All + Create**
   - Pros: Clean slate
   - Cons: Slow, destructive, may hit foreign key constraints

2. **Try Create, Catch Duplicate**
   - Pros: Simple
   - Cons: Error handling noise, not idempotent

3. **Find or Create Pattern**
   - Pros: Clear intent
   - Cons: Two queries instead of one

**Consequences:**
- ✅ Idempotent test data setup
- ✅ Fast (single query)
- ✅ No errors on re-runs
- ⚠️ Update block must be empty or carefully managed
- ⚠️ Existing data may differ from expected

## AD-004: Test API Security Layers

**Status:** Accepted

**Context:**
- Test APIs must never run in production
- Mistakes happen (wrong env, leaked code)
- Need defense in depth

**Decision:**
Implement three security layers:
1. Environment check (`NODE_ENV === 'production'`)
2. Explicit flag (`ALLOW_TEST_API` environment variable)
3. Database URL validation (`DATABASE_URL.includes('test')`)

**Alternatives Considered:**

1. **Single Environment Check**
   - Pros: Simple
   - Cons: Easy to misconfigure, single point of failure

2. **Build-time Removal**
   - Pros: Zero production overhead
   - Cons: Build complexity, may break with dynamic imports

3. **IP Whitelist**
   - Pros: Network-level security
   - Cons: Not applicable to serverless, maintenance burden

**Consequences:**
- ✅ Defense in depth prevents disasters
- ✅ Explicit opt-in for production testing
- ✅ Database safety check
- ⚠️ Three checks per request (minimal overhead)
- ⚠️ Test API code shipped to production (dead code)

## AD-005: Gradual Test Activation

**Status:** Accepted

**Context:**
- Many UI components not yet implemented
- Full test coverage not possible now
- Need to track what's tested vs. what's pending

**Decision:**
Keep tests as `test.skip()` with comments documenting why, activate as features are implemented.

**Alternatives Considered:**

1. **Delete Unimplemented Tests**
   - Pros: Clean, no clutter
   - Cons: Lose test plan documentation, easy to forget

2. **TODO Comments**
   - Pros: Standard pattern
   - Cons: Not executable, easy to ignore

3. **All Tests Active, Expected to Fail**
   - Pros: Shows actual coverage
   - Cons: Noisy, hard to distinguish real failures

**Consequences:**
- ✅ Tests document intended behavior
- ✅ Clear activation path (remove `.skip`)
- ✅ Easy to see what's pending
- ⚠️ Skip count high initially (psychological effect)
- ⚠️ Must remember to activate as features ship

## AD-006: TypeScript Import Strategy

**Status:** Accepted

**Context:**
- Playwright tests run in Node.js environment
- TypeScript configured without `esModuleInterop`
- Default imports fail for Node.js built-ins

**Decision:**
Use namespace imports (`import * as fs from 'fs'`) for all Node.js built-in modules in test files.

**Alternatives Considered:**

1. **Enable esModuleInterop**
   - Pros: Allows default imports
   - Cons: May break existing code, affects entire project

2. **Require Syntax**
   - Pros: Always works in Node.js
   - Cons: Mixing CommonJS and ES modules, no type safety

3. **Mix: Default for Some, Namespace for Others**
   - Pros: "Natural" imports
   - Cons: Inconsistent, confusing for team

**Consequences:**
- ✅ Consistent import style in tests
- ✅ No TypeScript config changes
- ✅ Works with current setup
- ⚠️ Verbose syntax (`fs.readFileSync` vs `readFileSync`)
- ⚠️ Different from src/ import style

## AD-007: Error Test Coverage Strategy

**Status:** Accepted

**Context:**
- Error cases often overlooked in manual testing
- Network errors, validation errors, auth errors all need testing
- Real errors hard to reproduce consistently

**Decision:**
Create dedicated `errors.spec.ts` with network mocking and edge case coverage.

**Alternatives Considered:**

1. **Mix Error Tests with Feature Tests**
   - Pros: Co-located with happy path
   - Cons: Files become large, hard to find error tests

2. **Skip Error Tests**
   - Pros: Focus on happy path first
   - Cons: Low error handling confidence, bugs in production

3. **Unit Test Errors Only**
   - Pros: Faster, more targeted
   - Cons: Doesn't test full stack error flow

**Consequences:**
- ✅ Comprehensive error coverage
- ✅ Easy to find all error scenarios
- ✅ Tests actual user experience of errors
- ⚠️ Network mocking may not match production exactly
- ⚠️ Requires maintenance as APIs change

## AD-008: baseURL Hardcoding in Fixtures

**Status:** Accepted (Pragmatic)

**Context:**
- Need to construct API URLs in fixtures
- Playwright's baseURL is in config, not easily accessible in fixtures
- TypeScript errors when accessing private `_options` property

**Decision:**
Hardcode `baseURL = 'http://localhost:3000'` in fixtures with comment explaining it matches config.

**Alternatives Considered:**

1. **Pass baseURL to Fixtures**
   - Pros: DRY, type-safe
   - Cons: Fixtures become more complex, every call needs param

2. **Access via `page.context().browser()`**
   - Pros: Single source of truth
   - Cons: TypeScript errors, accessing private API

3. **Environment Variable**
   - Pros: Configurable
   - Cons: Another config to maintain, easy to forget

**Consequences:**
- ✅ Simple, clear code
- ✅ No TypeScript errors
- ✅ Works immediately
- ⚠️ Duplicate config value (DRY violation)
- ⚠️ Must update in two places if port changes
- ⚠️ Doesn't work with custom baseURL

**Mitigation:**
Add comment: `// Use configured baseURL from playwright.config.ts`

## AD-009: Test Data Cleanup Strategy

**Status:** Deferred

**Context:**
- Test data accumulates in database
- Cleanup after each test is slow
- Cleanup on failure may not run

**Decision:**
Initial implementation: No cleanup between tests. Manual cleanup via DELETE endpoint.

**Future Decision Needed:**
Evaluate these approaches after initial implementation:

1. **Transaction Rollback**
   - Wrap each test in transaction, rollback
   - Requires Prisma transaction support in test context

2. **Database Reset**
   - Drop and recreate DB between test suites
   - Requires fast DB (SQLite for tests?)

3. **Cleanup in Global Teardown**
   - Delete all test data after all tests
   - Doesn't help with test isolation

**Consequences:**
- ✅ Fast initial implementation
- ⚠️ Test data accumulates
- ⚠️ May cause test interdependencies
- 🔮 Future decision required based on actual issues

## Decision Review Schedule

These decisions should be reviewed after:
- ✅ First full test run (validate performance gains)
- ✅ First production deployment (validate security)
- 🔲 First month of usage (validate maintenance burden)
- 🔲 Team onboarding (validate developer experience)
