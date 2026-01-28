# E2E Tests

Playwright를 사용한 End-to-End 테스트 모음입니다.

## 테스트 구조

```
tests/e2e/
├── fixtures/           # 테스트 유틸리티
│   ├── auth.ts         # 인증 헬퍼
│   ├── viewport.ts     # 뷰포트 설정
│   └── index.ts        # 전체 export
├── auth.spec.ts        # 인증 관련 테스트
├── dashboard.spec.ts   # 대시보드 테스트
├── landing.spec.ts     # 랜딩 페이지 테스트
├── campaign.spec.ts    # 캠페인 관련 테스트
└── README.md
```

## 테스트 시나리오

### 1. auth.spec.ts
인증 및 로그인 관련 테스트

- **로그인 페이지 렌더링**
  - 페이지 요소 표시 확인
  - 소셜 로그인 버튼 확인
  - 약관 링크 확인

- **Meta 로그인 버튼 클릭**
  - OAuth 플로우 시작 확인
  - 로딩 상태 확인
  - 다른 버튼 비활성화 확인

- **미인증 사용자 리다이렉트**
  - 보호된 경로 접근 시 로그인 페이지로 리다이렉트
  - callbackUrl 파라미터 보존

- **OAuth 로그인**
  - Google, Kakao, Meta 버튼 표시 및 스타일링 확인
  - OAuth 플로우 트리거 확인

- **에러 처리**
  - URL 파라미터의 에러 메시지 표시
  - 알 수 없는 에러 처리

### 2. dashboard.spec.ts
대시보드 페이지 테스트 (대부분 skip - 인증 구현 필요)

- **대시보드 페이지 로드**
  - 페이지 로드 확인
  - 페이지 타이틀 확인

- **KPI 카드 표시**
  - 지출, ROAS, CTR, 전환 카드 표시
  - 로딩 상태 확인
  - 숫자 값 표시 확인

- **캠페인 목록 렌더링**
  - 캠페인 요약 섹션 표시
  - 전체 보기 링크
  - 빈 상태 처리

- **네비게이션**
  - 캠페인, 보고서, 설정 페이지 이동

- **반응형 레이아웃**
  - 모바일, 태블릿, 데스크톱 뷰포트 테스트

### 3. landing.spec.ts
랜딩 페이지 테스트

- **랜딩 페이지 로드**
  - 페이지 로드 확인
  - 타이틀 확인
  - 리다이렉트 방지 확인

- **Hero 섹션 표시**
  - Hero 섹션 표시
  - 메인 헤딩 확인
  - 설명 텍스트 확인

- **CTA 버튼 동작**
  - CTA 버튼 표시 및 클릭
  - 로그인/회원가입 페이지로 이동
  - 접근성 확인

- **모바일 반응형 확인**
  - iPhone SE, iPhone 11 Pro Max 뷰포트
  - iPad, Desktop 뷰포트
  - 가로 스크롤 방지
  - 읽기 쉬운 폰트 크기

- **랜딩 페이지 섹션들**
  - 기능, 가격, FAQ 섹션
  - 푸터 링크

- **성능 및 접근성**
  - 로딩 시간
  - 헤딩 계층 구조
  - 이미지 alt 텍스트

### 4. campaign.spec.ts
캠페인 관련 테스트 (대부분 skip - 인증 구현 필요)

- **캠페인 목록 페이지**
  - 미인증 사용자 리다이렉트
  - 캠페인 목록 표시
  - 생성 버튼
  - 필터 및 검색

- **캠페인 상세 페이지**
  - 캠페인 정보 표시
  - 성과 지표
  - 수정 버튼
  - 일시중지/활성화

- **캠페인 생성 페이지**
  - 다단계 폼
  - 유효성 검사
  - 뒤로 가기 및 데이터 보존
  - 최종 제출

- **캠페인 수정 페이지**
  - 기존 데이터 표시
  - 변경 사항 저장

## Fixtures (테스트 유틸리티)

### authFixture
인증 관련 헬퍼 함수

```typescript
import { authFixture } from './fixtures'

// 로그인
await authFixture.loginAsUser(page)

// Meta OAuth
await authFixture.loginWithMeta(page)

// 로그아웃
await authFixture.logout(page)
```

### viewport
뷰포트 설정 헬퍼

```typescript
import { setViewport, VIEWPORTS } from './fixtures'

// 모바일 뷰포트로 설정
await setViewport(page, 'mobile')

// 사용 가능한 뷰포트
VIEWPORTS = {
  mobile: { width: 375, height: 667 },
  mobileWide: { width: 414, height: 896 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  ...
}
```

## 테스트 실행

```bash
# 모든 E2E 테스트 실행
npm run test:e2e

# UI 모드로 실행
npm run test:e2e:ui

# 특정 파일만 실행
npx playwright test auth.spec.ts

# 특정 브라우저만 실행
npx playwright test --project=chromium

# 헤드리스 모드 끄기
npx playwright test --headed

# 디버그 모드
npx playwright test --debug
```

## 테스트 작성 가이드

### TDD 원칙 따르기

```typescript
// 1. RED - 실패하는 테스트 먼저 작성
test('should display login button', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByRole('button', { name: 'Login' })).toBeVisible()
})

// 2. GREEN - 최소한의 코드로 테스트 통과
// 3. REFACTOR - 코드 개선
```

### 접근성 중심

```typescript
// Role 기반 선택자 사용
page.getByRole('button', { name: /로그인/ })
page.getByRole('heading', { name: /대시보드/ })
page.getByLabel('이메일')

// 피해야 할 선택자
page.locator('.btn-login') // CSS 클래스
page.locator('#login-btn')  // ID
```

### 타임아웃 처리

```typescript
// 명시적 타임아웃
await expect(element).toBeVisible({ timeout: 10000 })

// 비동기 작업 대기
await page.waitForURL('/dashboard')
await page.waitForLoadState('networkidle')
```

### 에러 처리

```typescript
// 선택적 요소 확인
const optionalElement = page.getByText('Optional')
if (await optionalElement.isVisible({ timeout: 5000 }).catch(() => false)) {
  await optionalElement.click()
}

// 여러 선택자 중 하나
const element = page.getByRole('button').or(page.getByRole('link'))
await expect(element.first()).toBeVisible()
```

## 주의사항

### Skip된 테스트들
- 실제 인증 구현 전까지 대부분의 대시보드/캠페인 테스트는 `skip` 상태
- 인증 구현 후 `test.skip`을 제거하고 활성화 필요

### Mock 데이터
- OAuth 플로우는 외부 서비스이므로 실제 테스트에서는 Mock 필요
- 테스트 데이터베이스 또는 시딩 필요

### 환경 변수
```bash
# .env.test
BASE_URL=http://localhost:3000
```

## 디버깅

### Trace 뷰어 사용
```bash
npx playwright test --trace on
npx playwright show-trace trace.zip
```

### 스크린샷
```typescript
await page.screenshot({ path: 'screenshot.png' })
await element.screenshot({ path: 'element.png' })
```

### 비디오 녹화
playwright.config.ts에서 설정:
```typescript
use: {
  video: 'on',
}
```

## 참고 문서
- [Playwright 공식 문서](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [프로젝트 CLAUDE.md](/CLAUDE.md)
