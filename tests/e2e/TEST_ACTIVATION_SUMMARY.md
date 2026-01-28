# E2E Test Activation Summary

## Overview

E2E 테스트의 스킵된 테스트들을 활성화하고 Mock 인증 시스템을 구현했습니다.

## Changes Made

### 1. Mock Authentication System

#### Global Setup (`tests/e2e/global-setup.ts`)
- Playwright 테스트 실행 전 한 번 실행
- Mock 인증 세션 생성
- 테스트 데이터베이스 초기화
- 세션 상태를 `storage-state.json`에 저장

#### Global Teardown (`tests/e2e/global-teardown.ts`)
- 테스트 완료 후 정리 작업
- 저장된 세션 파일 삭제

#### Test API Endpoints

**`/api/test/mock-auth/route.ts`**
- `GET`: Mock 인증 세션 생성 (NextAuth JWT 토큰)
- `DELETE`: Mock 세션 삭제 (로그아웃)
- 프로덕션 환경에서는 자동 비활성화

**`/api/test/db-init/route.ts`**
- `GET`: 테스트 데이터베이스 시드
  - 테스트 사용자 생성
  - 테스트 캠페인 생성
  - 테스트 KPI 데이터 생성
- `DELETE`: 테스트 데이터 정리
- DATABASE_URL에 'test' 포함 확인 (안전장치)

### 2. Updated Fixtures

#### `tests/e2e/fixtures/auth.ts`

**Before:**
```typescript
async loginAsUser(page: Page) {
  await page.goto('/login')
  await page.getByLabel('이메일').fill(email)
  await page.getByLabel('비밀번호').fill(password)
  await page.getByRole('button', { name: /로그인/ }).click()
}
```

**After:**
```typescript
async loginAsUser(page: Page) {
  // Mock 인증 API 호출
  const response = await page.goto('/api/test/mock-auth')
  if (response?.ok()) {
    await page.goto('/')
    return
  }
  // Fallback to manual login
}
```

**logout() 개선:**
- Mock 세션 삭제 API 호출
- UI 로그아웃 버튼 클릭 시도
- Fallback으로 `/api/auth/signout` 호출

### 3. Playwright Config Update

#### Before:
```typescript
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
]
```

#### After:
```typescript
globalSetup: './tests/e2e/global-setup.ts',
globalTeardown: './tests/e2e/global-teardown.ts',
projects: [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'chromium-authenticated',
    use: {
      ...devices['Desktop Chrome'],
      storageState: './tests/e2e/storage-state.json',
    },
    dependencies: ['chromium'],
  },
]
```

### 4. Activated Tests

#### `auth.spec.ts`
- ✅ **로그아웃 테스트 활성화** (라인 185)
  - Mock 세션 생성 후 로그아웃 테스트

#### `dashboard.spec.ts`
- ✅ **대시보드 페이지 로드** (라인 4-24)
  - 인증 후 대시보드 접근
  - 페이지 타이틀 확인
- ✅ **KPI 카드 표시** (라인 26-43)
  - KPI 메트릭 표시 확인
  - 최소 1개 이상의 KPI 표시
- ✅ **캠페인 목록 렌더링** (라인 95-105)
  - 캠페인 섹션 표시 확인

#### `campaign.spec.ts`
- ✅ **캠페인 목록 페이지** (라인 13-45)
  - 인증 후 캠페인 목록 접근
  - 캠페인 카드 또는 빈 상태 표시
  - 생성 버튼 표시

### 5. New Error Tests

#### `tests/e2e/errors.spec.ts` (NEW)

**404 Not Found**
- 존재하지 않는 경로 처리
- 존재하지 않는 캠페인 ID 처리

**네트워크 에러**
- API 요청 실패 처리
- 재시도 로직 테스트

**유효성 검사 에러**
- 필수 필드 검증
- 예산 최소값 검증

**권한 에러**
- Admin 페이지 접근 제한
- 다른 사용자 캠페인 수정 방지

**세션 만료**
- 세션 만료 시 로그인 페이지 리다이렉트
- Redirect URL 보존

**폼 제출 에러**
- 중복 캠페인 이름 처리
- Meta API 실패 처리

**로딩 상태**
- 로딩 인디케이터 표시
- 로딩 완료 후 숨김

## Test Execution

### 로컬 환경

```bash
# 1. 테스트 데이터베이스 설정 (선택사항)
export DATABASE_URL="postgresql://user:password@localhost:5432/batwo_test"

# 2. 모든 E2E 테스트 실행
npm run test:e2e

# 3. UI 모드로 실행
npm run test:e2e:ui

# 4. 특정 파일만 실행
npx playwright test auth.spec.ts
npx playwright test errors.spec.ts

# 5. 특정 프로젝트만 실행
npx playwright test --project=chromium
npx playwright test --project=chromium-authenticated
```

### CI 환경

```bash
# CI=true로 설정하면 자동으로:
# - retries: 2
# - workers: 1
# - reuseExistingServer: false

CI=true npm run test:e2e
```

## Test Data Seeding

Global setup에서 자동으로 다음 데이터가 생성됩니다:

### Test User
```typescript
{
  email: 'test@example.com',
  name: 'Test User',
  globalRole: 'USER'
}
```

### Test Campaign
```typescript
{
  metaCampaignId: 'campaign_test_001',
  name: 'E2E Test Campaign',
  status: 'ACTIVE',
  objective: 'CONVERSIONS',
  dailyBudget: 50000
}
```

### Test KPI
```typescript
{
  date: today,
  impressions: 10000,
  clicks: 500,
  spend: 25000,
  conversions: 50,
  revenue: 125000
}
```

## Security Considerations

### Production Safety

1. **Environment Check**
   - Mock auth API는 `NODE_ENV === 'production'`에서 자동 비활성화
   - `ALLOW_TEST_API` 환경 변수로 명시적 활성화 필요

2. **Database Safety**
   - Test API는 DATABASE_URL에 'test'가 포함된 경우만 작동
   - 프로덕션 DB 실수 방지

3. **Cookie Security**
   - NextAuth 세션 쿠키 사용
   - httpOnly, secure, sameSite 설정

### Access Control

```typescript
// Production에서는 403 응답
if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_API) {
  return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
}
```

## Remaining Skipped Tests

일부 테스트는 실제 UI 구현이 필요하여 여전히 skip 상태입니다:

### `dashboard.spec.ts`
- ❌ KPI 개별 메트릭 테스트 (spend, ROAS, CTR, conversion)
- ❌ 로딩 상태 테스트
- ❌ 숫자 값 표시 테스트
- ❌ 사이드바 테스트

### `campaign.spec.ts`
- ❌ 캠페인 상세 페이지 (11개 테스트)
- ❌ 캠페인 생성 페이지 (17개 테스트)
- ❌ 캠페인 수정 페이지 (4개 테스트)

### `errors.spec.ts`
- ❌ 유효성 검사 테스트 (폼 미구현)
- ❌ 권한 테스트 (다른 사용자 캠페인)
- ❌ 폼 제출 에러 테스트

**활성화 조건:**
- 해당 UI 컴포넌트 구현 완료
- API 엔드포인트 구현 완료
- 테스트 데이터 스키마 완성

## Next Steps

1. **UI 구현 후 테스트 활성화**
   - 캠페인 상세 페이지 구현 → 상세 페이지 테스트 활성화
   - 캠페인 생성 폼 구현 → 생성 폼 테스트 활성화
   - KPI 대시보드 구현 → KPI 테스트 활성화

2. **추가 테스트 케이스**
   - Meta Ads API 통합 테스트
   - 보고서 생성 테스트
   - 픽셀 설치 테스트

3. **성능 테스트**
   - 페이지 로딩 시간 측정
   - API 응답 시간 측정
   - Lighthouse 점수 측정

4. **접근성 테스트**
   - WCAG 2.1 AA 준수
   - 키보드 네비게이션
   - 스크린 리더 호환성

## Troubleshooting

### Mock 세션이 생성되지 않는 경우

```bash
# 1. Test API 엔드포인트 확인
curl http://localhost:3000/api/test/mock-auth

# 2. AUTH_SECRET 환경 변수 확인
echo $AUTH_SECRET

# 3. 수동으로 세션 생성
npx playwright test --project=chromium --headed
```

### 테스트 데이터가 생성되지 않는 경우

```bash
# 1. Database 연결 확인
psql $DATABASE_URL

# 2. Prisma 마이그레이션 확인
npx prisma migrate dev

# 3. 수동으로 DB 초기화
curl http://localhost:3000/api/test/db-init
```

### Storage state 파일이 없는 경우

```bash
# Global setup 수동 실행
npx tsx tests/e2e/global-setup.ts

# 또는 테스트 재실행
npm run test:e2e
```

## Files Changed

### New Files
- `tests/e2e/global-setup.ts`
- `tests/e2e/global-teardown.ts`
- `tests/e2e/errors.spec.ts`
- `src/app/api/test/mock-auth/route.ts`
- `src/app/api/test/db-init/route.ts`
- `tests/e2e/TEST_ACTIVATION_SUMMARY.md`

### Modified Files
- `playwright.config.ts`
- `tests/e2e/fixtures/auth.ts`
- `tests/e2e/auth.spec.ts`
- `tests/e2e/dashboard.spec.ts`
- `tests/e2e/campaign.spec.ts`
- `.gitignore`

## Test Coverage

### Before
- ✅ 랜딩 페이지: 100% 활성화
- ✅ 로그인 페이지: 100% 활성화
- ❌ 대시보드: 0% 활성화 (모두 skip)
- ❌ 캠페인: 5% 활성화 (미인증 리다이렉트만)
- ❌ 에러 케이스: 0%

### After
- ✅ 랜딩 페이지: 100% 활성화
- ✅ 로그인 페이지: 100% 활성화
- ✅ 대시보드: 30% 활성화 (기본 로드 + KPI + 캠페인 목록)
- ✅ 캠페인: 20% 활성화 (목록 페이지 + 생성 버튼)
- ✅ 에러 케이스: 50% 활성화 (404, 네트워크, 세션, 로딩)

### Target (UI 구현 후)
- ✅ 랜딩 페이지: 100%
- ✅ 로그인 페이지: 100%
- ✅ 대시보드: 90%
- ✅ 캠페인: 85%
- ✅ 에러 케이스: 100%

## References

- [Playwright Authentication Guide](https://playwright.dev/docs/auth)
- [NextAuth.js Testing](https://next-auth.js.org/getting-started/client#testing)
- [Project CLAUDE.md](/CLAUDE.md)
- [E2E Tests README](/tests/e2e/README.md)
