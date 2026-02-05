# E2E Test Suite

## 개요
바투 마케팅 SaaS의 E2E 테스트 스위트입니다. Playwright를 사용하여 주요 사용자 플로우를 검증합니다.

## 테스트 파일 구조

```
tests/e2e/
├── auth.spec.ts                    # 인증 테스트 (30 tests)
├── onboarding/
│   └── wizard.spec.ts              # 온보딩 위저드 테스트 (41 tests)
├── campaigns/
│   └── campaigns.spec.ts           # 캠페인 CRUD 테스트 (24 tests)
├── dashboard/
│   └── dashboard.spec.ts           # 대시보드 KPI 테스트 (23 tests)
├── ai/
│   └── ai-copy.spec.ts             # AI 카피 생성 테스트 (24 tests)
├── payment/
│   └── payment.spec.ts             # 결제 플로우 테스트 (16 tests)
├── fixtures/
│   └── auth.ts                     # 인증 헬퍼
└── helpers/
    ├── api.helper.ts               # API 모킹 헬퍼
    └── mock.helper.ts              # Mock 데이터 생성
```

## 총 테스트 수
**158개 테스트**

- ✅ 인증: 30 tests
- ✅ 온보딩: 41 tests
- ✅ 캠페인: 24 tests
- ✅ 대시보드: 23 tests
- ✅ AI 카피: 24 tests
- ✅ 결제: 16 tests

## 실행 방법

### 전체 테스트 실행
```bash
npx playwright test
```

### 특정 파일만 실행
```bash
npx playwright test tests/e2e/campaigns/campaigns.spec.ts
npx playwright test tests/e2e/dashboard/dashboard.spec.ts
npx playwright test tests/e2e/ai/ai-copy.spec.ts
npx playwright test tests/e2e/payment/payment.spec.ts
```

### UI 모드로 실행 (디버깅)
```bash
npx playwright test --ui
```

### 특정 브라우저로 실행
```bash
npx playwright test --project=chromium
```

### 헤드풀 모드 (브라우저 보이기)
```bash
npx playwright test --headed
```

## 테스트 커버리지

### 1. campaigns.spec.ts (24 tests)
- ✅ Meta 미연결 시 안내 UI
- ✅ 캠페인 목록 페이지 렌더링
- ✅ 캠페인 필터링 (상태별)
- ✅ 캠페인 검색
- ✅ 새 캠페인 생성 폼
- ✅ 캠페인 유효성 검증
- ✅ 캠페인 상세 조회
- ✅ 캠페인 상태 변경 (활성/일시정지)
- ✅ 에러 핸들링

### 2. dashboard.spec.ts (23 tests)
- ✅ Meta 미연결 시 안내 UI
- ✅ 온보딩 위저드 표시
- ✅ KPI 카드 표시 (광고비, 전환, ROAS, CTR)
- ✅ KPI 변화율 표시
- ✅ 날짜 필터 (7일/30일)
- ✅ 성과 차트 렌더링
- ✅ 캠페인 요약 테이블
- ✅ AI 인사이트 섹션
- ✅ 동기화 기능
- ✅ 에러 핸들링
- ✅ 반응형 디자인 (모바일)

### 3. ai-copy.spec.ts (24 tests)
- ✅ AI 카피 생성 폼 접근
- ✅ 제품 정보 입력
- ✅ 유효성 검증
- ✅ AI 카피 생성 요청
- ✅ 로딩 상태 표시
- ✅ 생성 결과 표시 (헤드라인, 본문, 설명)
- ✅ 카피 복사 기능
- ✅ 폼에 카피 적용
- ✅ 할당량 표시 및 관리
- ✅ 할당량 초과 처리
- ✅ 여러 변형 생성
- ✅ 에러 핸들링 및 재시도

### 4. payment.spec.ts (16 tests)
- ✅ 가격 페이지 표시 (비인증/인증)
- ✅ 요금제 비교
- ✅ 현재 플랜 표시
- ✅ 결제 페이지 접근
- ✅ 결제 수단 선택
- ✅ 주문 요약
- ✅ 청구 정보 유효성 검증
- ✅ 결제 처리
- ✅ 구독 관리 (업그레이드/취소)
- ✅ 결제 내역 조회
- ✅ 에러 핸들링

## Mock 데이터

### MockHelper 제공 데이터
- `metaAccounts()`: Meta 광고 계정
- `campaigns()`: 캠페인 목록
- `kpiData()`: KPI 데이터
- `insights()`: 인사이트 데이터
- `metaPixels()`: 픽셀 목록
- `users()`: 사용자 데이터
- `aiCopyResponse()`: AI 카피 생성 결과
- `aiInsights()`: AI 인사이트
- `quotaStatus()`: 할당량 상태
- `subscription()`: 구독 정보

## 패턴 및 베스트 프랙티스

### 1. 인증 관리
```typescript
await authFixture.loginAsUser(page)
```

### 2. API 모킹
```typescript
await apiHelper.mockApiResponse(page, '**/api/campaigns', {
  campaigns: MockHelper.campaigns()
})
```

### 3. 에러 모킹
```typescript
await apiHelper.mockApiError(page, '**/api/campaigns', 500, 'Server Error')
```

### 4. API 대기
```typescript
await apiHelper.waitForApi(page, /\/api\/campaigns/)
```

### 5. 조건부 테스트
```typescript
if (await element.isVisible({ timeout: 2000 })) {
  // 요소가 있을 때만 테스트
}
```

## CI/CD 통합

### GitHub Actions
```yaml
- name: Run E2E Tests
  run: npx playwright test
```

### 리트라이 설정
- CI 환경: 2회 재시도
- 로컬 환경: 재시도 없음

## 문제 해결

### 테스트 타임아웃
- `timeout` 옵션을 늘리거나 `page.waitForLoadState('networkidle')` 사용

### Selector가 찾아지지 않을 때
- `.or()` 체이닝으로 대체 셀렉터 제공
- `isVisible({ timeout: 2000 })` 로 조건부 처리

### API 모킹이 작동하지 않을 때
- `page.route()` 가 `page.goto()` 보다 먼저 호출되는지 확인

## 향후 개선 사항
- [ ] Visual regression testing 추가
- [ ] Performance testing 추가
- [ ] Accessibility testing 강화
- [ ] Cross-browser testing 확대
- [ ] API contract testing 추가
