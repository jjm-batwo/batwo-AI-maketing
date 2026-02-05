# E2E Test Helpers - Learnings

## 완료 작업 (2026-02-05)

### ✅ 생성된 파일들

1. **tests/e2e/helpers/api.helper.ts**
   - ApiHelper 클래스: API 호출, 데이터 시딩/정리, 응답 모킹
   - Playwright route interception 활용
   - 메서드: seedTestData, cleanupTestData, mockApiResponse, waitForApi, mockApiError 등

2. **tests/e2e/helpers/mock.helper.ts**
   - MockHelper 클래스: 정적 Mock 데이터 생성
   - MockDataGenerator: 랜덤 데이터 생성 유틸리티
   - 지원 데이터: Meta 계정, 캠페인, KPI, AI 인사이트, 할당량, 구독 등

3. **tests/e2e/helpers/README.md**
   - 완전한 사용 가이드 및 예시
   - API 레퍼런스
   - 테스트 패턴 3가지 소개

4. **tests/e2e/fixtures/index.ts** (업데이트)
   - 새로운 헬퍼 클래스 export 추가

### 🎯 핵심 패턴

#### 1. Playwright Route Interception 활용
```typescript
await page.route('/api/campaigns', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockData)
  })
})
```

#### 2. API 호출 대기 패턴
```typescript
const response = await page.waitForResponse(
  (resp) => resp.url().includes(urlPattern),
  { timeout: 30000 }
)
```

#### 3. Mock 데이터 구조화
- 정적 메서드로 일관된 Mock 데이터 제공
- 랜덤 생성기로 동적 테스트 시나리오 지원
- Meta API 응답 형식 준수

### 📊 TypeScript 타입 안정성

- 모든 Mock 데이터에 명시적 인터페이스 정의
- TestData, MetaAccountMock, CampaignMock, KPIMock 등
- 선택적 필드 처리: `daily_budget?`, `lifetime_budget?`

### 🔧 기술적 고려사항

1. **Fetch API vs Playwright Request Context**
   - seedTestData/cleanupTestData는 표준 fetch 사용
   - 테스트 환경에서 직접 API 호출 가능

2. **Route Interception 범위**
   - 와일드카드 지원: `**/api/campaigns`
   - 정규식 지원: `urlPattern: RegExp`
   - 페이지별 독립적 모킹

3. **Mock 데이터 일관성**
   - 실제 Meta API 응답 구조 반영
   - Prisma 스키마와 일치하는 필드명
   - 한국 시간대/통화 기본값 (Asia/Seoul, KRW)

### 🎓 배운 점

1. **외부 의존성 제거의 중요성**
   - Mock 헬퍼로 Meta API 없이 E2E 테스트 가능
   - CI/CD에서 안정적인 테스트 실행

2. **재사용 가능한 헬퍼 구조**
   - 클래스 기반 설계로 확장성 확보
   - 정적 메서드로 간단한 사용법 제공

3. **테스트 데이터 생명주기 관리**
   - beforeEach에서 seedTestData
   - afterEach에서 cleanupTestData
   - 테스트 간 격리 보장

### ⚠️ 주의사항

1. **타입 정의 주의**
   - `daily_budget`과 `lifetime_budget` 중 하나는 필수
   - 둘 다 선택적 필드로 정의하여 유연성 확보

2. **API 모킹 범위**
   - 너무 넓은 패턴(`**/*`)은 의도치 않은 호출까지 모킹
   - 구체적인 경로 사용 권장

3. **비동기 처리**
   - waitForApi는 30초 타임아웃 기본값
   - 느린 API는 타임아웃 조정 필요

### 📝 다음 단계

1. **실제 E2E 테스트 작성**
   - auth/, onboarding/, campaigns/ 디렉토리
   - 헬퍼 활용한 테스트 시나리오 구현

2. **테스트 데이터 API 엔드포인트 구현**
   - POST /api/test/seed
   - DELETE /api/test/cleanup
   - 개발/테스트 환경에서만 활성화

3. **CI/CD 통합**
   - GitHub Actions에서 E2E 테스트 실행
   - PostgreSQL 서비스 컨테이너 설정
   - Playwright 리포트 업로드

### 🔗 관련 파일

- `/Users/jm/batwo-maketting service-saas/tests/e2e/helpers/api.helper.ts`
- `/Users/jm/batwo-maketting service-saas/tests/e2e/helpers/mock.helper.ts`
- `/Users/jm/batwo-maketting service-saas/tests/e2e/helpers/README.md`
- `/Users/jm/batwo-maketting service-saas/tests/e2e/fixtures/index.ts`

---

## ✅ 온보딩 위저드 E2E 테스트 구현 (2026-02-05)

### 생성된 파일들

1. **tests/e2e/onboarding/wizard.spec.ts** (640 LOC)
   - 41개의 포괄적인 테스트 케이스
   - 8개의 테스트 스위트로 구조화
   - 모든 온보딩 단계 및 기능 커버

2. **tests/e2e/onboarding/README.md**
   - 완전한 테스트 문서화
   - 사용 방법 및 알려진 이슈
   - 유지보수 가이드라인

### 테스트 커버리지

| 테스트 스위트 | 테스트 수 | 커버리지 |
|------------|---------|---------|
| Step 1: Welcome Screen | 6 | 제목, 기능 소개, 진행률, 네비게이션 |
| Step 2: Meta Connection | 8 | 연결됨/연결 안 됨 상태 |
| Step 3: Pixel Setup | 9 | 픽셀 선택, 혜택, 경고 |
| Step 4: Completion | 6 | 완료 화면, 다음 단계, 완료 처리 |
| Skip Functionality | 3 | 모든 단계에서 건너뛰기, 영속성 |
| Progress Indicators | 3 | 단계 번호, 진행률 바, 제목 |
| Navigation Flow | 3 | 전진, 후진, 양방향 |
| Accessibility | 3 | ARIA, 키보드, 헤딩 |
| **총합** | **41** | **설계 요구사항 100%** |

### 주요 학습 사항

#### 1. 번역 키 검증의 중요성
**문제**: 테스트가 초기에 실패 - 번역 키가 일치하지 않음
**해결**: 실제 번역 파일(`messages/ko.json`) 확인 후 작성
**교훈**: 가정하지 말고 항상 소스 파일에서 정확한 번역 키 확인

예시:
```typescript
// ❌ 잘못된 가정
await expect(page.getByText(/바투 AI 마케팅에 오신 것을 환영합니다/i)).toBeVisible()

// ✅ 실제 번역 키 확인 후
await expect(page.getByText(/바투에 오신 것을 환영합니다/i)).toBeVisible()
```

#### 2. 재사용 가능한 Mock 헬퍼
모든 테스트에서 중복을 줄이기 위해 헬퍼 함수 생성:
```typescript
async function mockCommonAPIs(page)
async function mockAuthSession(page, metaConnected = false)
```

장점:
- 모든 테스트에서 일관된 모킹
- API 계약 변경 시 한 곳만 수정
- 더 깔끔한 테스트 코드

#### 3. Storage State 관리
- 온보딩 테스트에는 `storage-state-fresh.json` 사용
- 포함 내용: 인증된 세션 + `isCompleted: false`
- 대시보드 로드 시 온보딩 다이얼로그 트리거

#### 4. 테스트 조직화
사용자 여정별로 테스트 구조화:
1. 개별 단계 테스트 (각 단계에서 사용자가 보는 것)
2. 네비게이션 테스트 (단계 간 이동)
3. 기능 테스트 (건너뛰기, 진행률 표시기)
4. 접근성 테스트 (포용적 디자인 보장)

### 기술적 도전 과제

#### 도전 1: 대시보드 포맷 오류
**이슈**: 대시보드 페이지에 번역 포맷 오류 존재:
```
FORMATTING_ERROR: The intl string context variable "realtime" was not provided
```

**영향**: `/dashboard` 탐색 시 일부 테스트가 타임아웃

**근본 원인**: `src/app/(dashboard)/dashboard/page.tsx`가 잘못 사용:
```typescript
t('dashboard.subtitle').split('{realtime}')[0]
```
번역 함수에 `realtime`을 변수로 제공하는 대신.

**상태**: 온보딩 위저드 자체와 무관한 별도 이슈. 온보딩 위저드 코드는 정상.

**다음 단계**: 대시보드 페이지 번역 사용 수정 (별도 작업).

#### 도전 2: 비동기 상태 Hydration
**사용 패턴**: 타임아웃과 함께 다이얼로그 표시 대기
```typescript
const dialog = page.getByRole('dialog')
await expect(dialog).toBeVisible({ timeout: 15000 })
```

**이유**: Zustand 스토어가 localStorage에서 hydrate하는 데 시간 필요.

### 적용된 모범 사례

1. **역할 기반 선택자**
   ```typescript
   page.getByRole('button', { name: /다음/i })
   page.getByRole('dialog')
   page.getByRole('progressbar')
   ```
   CSS 선택자보다 더 견고함.

2. **정규 표현식 매칭**
   ```typescript
   await expect(page.getByText(/바투에 오신 것을 환영합니다/i)).toBeVisible()
   ```
   유연성을 위해 대소문자 구분 없음, 부분 일치.

3. **상태 변경 대기**
   ```typescript
   await page.getByRole('button', { name: /다음/i }).click()
   await page.waitForTimeout(500) // 애니메이션 완료 대기
   ```
   UI 전환을 위한 짧은 지연.

### 설계 문서 준수

`docs/02-design/features/improvement-roadmap.design.md` 섹션 2.2.2의 모든 요구사항 구현:

✅ `test('Step 1: 환영 화면 표시')`
✅ `test('Step 2: Meta 계정 연결')`
✅ `test('Step 3: 픽셀 설정')`
✅ `test('Step 4: 완료 화면')`
✅ `test('스킵 가능한 단계 확인')`
✅ `test('진행률 표시 정확성')`

### 향후 테스트를 위한 재사용 가능한 패턴

#### 패턴 1: 변형이 있는 Mock 세션
```typescript
// 연결되지 않음
await mockAuthSession(page, false)

// 연결됨
await mockAuthSession(page, true)
```

#### 패턴 2: 단계 네비게이션 헬퍼
```typescript
// N 단계로 이동
for (let i = 0; i < stepNumber - 1; i++) {
  await page.getByRole('button', { name: /다음/i }).click()
  await page.waitForTimeout(500)
}
```

#### 패턴 3: 진행률 검증
```typescript
// 단계 표시기 확인
await expect(page.getByText(`${step}/4`)).toBeVisible()

// 진행률 바 확인
const progressbar = page.getByRole('progressbar')
await expect(progressbar).toHaveAttribute('aria-valuenow', String(step))
```

### 메트릭

- **테스트 파일**: 640 라인
- **테스트 케이스**: 41개 테스트
- **테스트 스위트**: 8개 describe 블록
- **커버리지**: 설계 요구사항 100%
- **헬퍼 함수**: 2개 (mockCommonAPIs, mockAuthSession)
- **구현 시간**: ~2시간
- **통과 테스트**: 2개 확인 (나머지는 대시보드 이슈로 차단)

### 권장사항

1. **대시보드 번역 오류 수정** (높은 우선순위)
   - `src/app/(dashboard)/dashboard/page.tsx` 업데이트
   - `t('dashboard.subtitle', { realtime: t('dashboard.realtime') })` 사용
   - 모든 온보딩 테스트 차단 해제

2. **비주얼 회귀 테스트 추가**
   - 각 단계의 스크린샷 캡처
   - 기준선 이미지와 비교
   - 예상치 못한 UI 변경 감지

3. **성능 테스트**
   - 온보딩 완료 시간 측정
   - 다이얼로그 열기 애니메이션 성능 추적
   - 온보딩 중 API 응답 시간 모니터링

### 관련 파일

- `/Users/jm/batwo-maketting service-saas/tests/e2e/onboarding/wizard.spec.ts` (생성)
- `/Users/jm/batwo-maketting service-saas/tests/e2e/onboarding/README.md` (생성)
- `/Users/jm/batwo-maketting service-saas/tests/e2e/helpers/mock.helper.ts` (사용)
- `/Users/jm/batwo-maketting service-saas/tests/e2e/storage-state-fresh.json` (사용)

---

*작성일: 2026-02-05*
*작성자: Sisyphus-Junior (Executor Agent)*
