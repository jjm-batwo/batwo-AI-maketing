# E2E Test Helpers

E2E 테스트에서 사용하는 헬퍼 클래스 모음입니다.

## 📁 파일 구조

```
tests/e2e/helpers/
├── api.helper.ts       # API 호출 및 데이터 시딩/정리
├── mock.helper.ts      # Mock 데이터 생성
└── README.md          # 이 문서
```

## 🔧 ApiHelper

API 호출, 데이터 시딩, API 응답 모킹을 담당하는 헬퍼 클래스입니다.

### 주요 기능

#### 1. 테스트 데이터 시딩

```typescript
import { ApiHelper } from '../helpers/api.helper'

const apiHelper = new ApiHelper()

await apiHelper.seedTestData({
  users: [
    { email: 'test@example.com', name: 'Test User', password: 'password123' }
  ],
  campaigns: [
    { name: '테스트 캠페인', objective: 'OUTCOME_SALES', budget: 50000, status: 'ACTIVE' }
  ]
})
```

#### 2. 테스트 데이터 정리

```typescript
await apiHelper.cleanupTestData()
```

#### 3. API 응답 모킹

```typescript
import { test } from '@playwright/test'

test('캠페인 목록 조회', async ({ page }) => {
  const apiHelper = new ApiHelper()

  // Mock API 응답 설정
  await apiHelper.mockApiResponse(page, '/api/campaigns', {
    campaigns: [
      { id: '1', name: '테스트 캠페인', status: 'ACTIVE' }
    ]
  })

  await page.goto('/campaigns')
  // 모킹된 데이터로 테스트 진행
})
```

#### 4. API 호출 대기

```typescript
// 특정 API 호출이 완료될 때까지 대기
const response = await apiHelper.waitForApi(page, '/api/campaigns/sync')

// 여러 API 호출 대기
const responses = await apiHelper.waitForApiCalls(page, '/api/campaigns', 3)
```

#### 5. API 에러 모킹

```typescript
await apiHelper.mockApiError(page, '/api/campaigns', 500, 'Internal Server Error')
```

### API

| 메서드 | 설명 | 반환 |
|--------|------|------|
| `seedTestData(data)` | 테스트 데이터 시딩 | `Promise<void>` |
| `cleanupTestData()` | 테스트 데이터 정리 | `Promise<void>` |
| `mockApiResponse(page, route, response)` | API 응답 모킹 | `Promise<void>` |
| `waitForApi(page, urlPattern)` | API 호출 대기 | `Promise<Response>` |
| `waitForApiCalls(page, urlPattern, count)` | 여러 API 호출 대기 | `Promise<Response[]>` |
| `mockApiError(page, route, status, error)` | API 에러 모킹 | `Promise<void>` |
| `clearApiMocks(page)` | 모든 API 모킹 해제 | `Promise<void>` |

---

## 🎭 MockHelper

E2E 테스트에서 사용할 Mock 데이터를 생성하는 헬퍼 클래스입니다.

### 주요 기능

#### 1. Meta 광고 계정 Mock

```typescript
import { MockHelper } from '../helpers/mock.helper'

const metaAccounts = MockHelper.metaAccounts()
// [{ id: 'act_123456789', name: 'Test Ad Account 1', ... }, ...]
```

#### 2. 캠페인 Mock

```typescript
const campaigns = MockHelper.campaigns()
// [{ id: '120210000000001', name: '신규 고객 확보 캠페인', ... }, ...]
```

#### 3. KPI 데이터 Mock

```typescript
const kpi = MockHelper.kpiData()
// { impressions: 125340, clicks: 3456, spend: 89500, ... }
```

#### 4. AI 인사이트 Mock

```typescript
const insights = MockHelper.aiInsights()
// [{ id: 'insight_001', type: 'optimization', ... }, ...]
```

#### 5. 할당량 상태 Mock

```typescript
const quota = MockHelper.quotaStatus()
// { campaignCreation: { used: 2, limit: 5, ... }, ... }
```

### 랜덤 데이터 생성

```typescript
import { MockDataGenerator } from '../helpers/mock.helper'

const campaignName = MockDataGenerator.randomCampaignName()
// "신규 캠페인 1738747200000"

const budget = MockDataGenerator.randomBudget()
// 45000

const kpi = MockDataGenerator.randomKPI()
// { impressions: 42351, clicks: 1234, ... }
```

### API

#### MockHelper 정적 메서드

| 메서드 | 설명 | 반환 타입 |
|--------|------|-----------|
| `metaAccounts()` | Meta 광고 계정 Mock | `MetaAccountMock[]` |
| `campaigns()` | 캠페인 Mock | `CampaignMock[]` |
| `kpiData()` | KPI 데이터 Mock | `KPIMock` |
| `insights(campaignId?)` | 인사이트 Mock | `InsightMock[]` |
| `metaPixels()` | 픽셀 Mock | `Array<{id, name, code}>` |
| `users()` | 사용자 Mock | `Array<{id, email, name, ...}>` |
| `aiCopyResponse()` | AI 카피 생성 응답 Mock | `{headline, primaryText, ...}` |
| `aiInsights()` | AI 인사이트 Mock | `Array<{id, type, title, ...}>` |
| `quotaStatus()` | 할당량 상태 Mock | `{campaignCreation, aiCopyGeneration, ...}` |
| `subscription()` | 구독 정보 Mock | `{id, plan, status, ...}` |

#### MockDataGenerator 메서드

| 메서드 | 설명 | 반환 타입 |
|--------|------|-----------|
| `randomCampaignName()` | 랜덤 캠페인 이름 | `string` |
| `randomBudget()` | 랜덤 예산 (10K-100K) | `number` |
| `randomDateRange(daysAgo)` | 랜덤 날짜 범위 | `{start, end}` |
| `randomKPI()` | 랜덤 KPI 데이터 | `KPIMock` |

---

## 📖 사용 예시

### 완전한 E2E 테스트 예시

```typescript
import { test, expect } from '@playwright/test'
import { ApiHelper, MockHelper } from '../fixtures'

test.describe('캠페인 관리', () => {
  let apiHelper: ApiHelper

  test.beforeEach(async ({ page }) => {
    apiHelper = new ApiHelper()

    // 테스트 데이터 시딩
    await apiHelper.seedTestData({
      users: [{ email: 'test@example.com', name: 'Test', password: 'pass' }]
    })

    // Meta API 모킹
    await apiHelper.mockApiResponse(page, '**/api/meta/accounts', {
      accounts: MockHelper.metaAccounts()
    })

    await apiHelper.mockApiResponse(page, '**/api/campaigns', {
      campaigns: MockHelper.campaigns()
    })
  })

  test.afterEach(async () => {
    await apiHelper.cleanupTestData()
  })

  test('캠페인 목록이 정상적으로 표시된다', async ({ page }) => {
    await page.goto('/campaigns')

    // Mock 데이터의 첫 번째 캠페인 이름 확인
    const mockCampaigns = MockHelper.campaigns()
    await expect(page.getByText(mockCampaigns[0].name)).toBeVisible()
  })

  test('캠페인 생성이 정상적으로 동작한다', async ({ page }) => {
    await page.goto('/campaigns')
    await page.getByRole('button', { name: '캠페인 생성' }).click()

    // API 응답 대기
    const responsePromise = apiHelper.waitForApi(page, '/api/campaigns')

    await page.getByLabel('캠페인 이름').fill('새 캠페인')
    await page.getByRole('button', { name: '생성' }).click()

    const response = await responsePromise
    expect(response.ok()).toBeTruthy()
  })
})
```

---

## 🧪 테스트 패턴

### 패턴 1: API 모킹으로 외부 의존성 제거

```typescript
test('Meta 연동 없이 캠페인 테스트', async ({ page }) => {
  const apiHelper = new ApiHelper()

  await apiHelper.mockApiResponse(page, '**/api/meta/**', MockHelper.metaAccounts())
  // 이제 실제 Meta API 없이 테스트 가능
})
```

### 패턴 2: 에러 시나리오 테스트

```typescript
test('API 에러 처리 확인', async ({ page }) => {
  const apiHelper = new ApiHelper()

  await apiHelper.mockApiError(page, '**/api/campaigns', 500, 'Server Error')

  await page.goto('/campaigns')
  await expect(page.getByText(/에러가 발생했습니다/)).toBeVisible()
})
```

### 패턴 3: 데이터 시딩으로 초기 상태 구성

```typescript
test('기존 캠페인이 있는 상태에서 시작', async ({ page }) => {
  const apiHelper = new ApiHelper()

  await apiHelper.seedTestData({
    campaigns: [
      { name: '기존 캠페인', objective: 'OUTCOME_SALES', budget: 50000, status: 'ACTIVE' }
    ]
  })

  await page.goto('/campaigns')
  // 시드된 데이터로 테스트
})
```

---

## 🔗 관련 문서

- [E2E 테스트 가이드](../../README.md)
- [Playwright 공식 문서](https://playwright.dev)
- [설계 문서](../../../docs/02-design/features/improvement-roadmap.design.md)
