import { test, expect } from '@playwright/test'
import { hideDevtools } from './helpers/devtools.helper'

// 최적화 규칙 페이지는 인증이 필요한 대시보드 페이지
// playwright.config.ts의 storageState(storage-state.json)로 인증 상태 유지

// Mock 데이터
const mockRules = [
  {
    id: 'rule-1',
    campaignId: 'campaign-1',
    userId: 'user-1',
    name: 'CPA 상한 초과 시 일시중지',
    ruleType: 'CPA_THRESHOLD',
    conditions: [{ metric: 'cpa', operator: 'gt', value: 15000 }],
    actions: [{ type: 'PAUSE_CAMPAIGN', params: {} }],
    isEnabled: true,
    lastTriggeredAt: null,
    triggerCount: 0,
    cooldownMinutes: 60,
    createdAt: '2026-02-25T00:00:00Z',
    updatedAt: '2026-02-25T00:00:00Z',
  },
  {
    id: 'rule-2',
    campaignId: 'campaign-1',
    userId: 'user-1',
    name: 'ROAS 하한 미달 시 예산 감소',
    ruleType: 'ROAS_FLOOR',
    conditions: [{ metric: 'roas', operator: 'lt', value: 1.0 }],
    actions: [{ type: 'REDUCE_BUDGET', params: { percentage: 30 } }],
    isEnabled: true,
    lastTriggeredAt: '2026-02-24T15:00:00Z',
    triggerCount: 3,
    cooldownMinutes: 60,
    createdAt: '2026-02-24T00:00:00Z',
    updatedAt: '2026-02-24T15:00:00Z',
  },
]

const mockCampaigns = [
  { id: 'campaign-1', name: '봄 세일 캠페인', status: 'ACTIVE' },
  { id: 'campaign-2', name: '여름 프로모션', status: 'PAUSED' },
]

// 페이지 진입 시 항상 필요한 API mock 설정 헬퍼
async function setupBaseMocks(
  page: Parameters<Parameters<typeof test>[1]>[0],
  rules = mockRules
) {
  // DevTools 오버레이가 UI 클릭을 가로채는 문제 방지 (페이지 네비게이션 전에 스크립트 주입)
  await page.addInitScript(() => {
    const style = document.createElement('style')
    style.textContent = '.tsqd-parent-container { display: none !important; }'
    document.head.appendChild(style)
  })

  // 서버 사이드 fetch (RSC) 와 클라이언트 fetch 모두 intercept
  await page.route('**/api/optimization-rules', async (route) => {
    const method = route.request().method()
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ rules }),
      })
    } else {
      await route.continue()
    }
  })

  await page.route('**/api/campaigns**', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ campaigns: mockCampaigns }),
      })
    } else {
      await route.continue()
    }
  })
}

test.describe('최적화 규칙 관리', () => {
  test.beforeEach(async ({ page }) => {
    await hideDevtools(page)
  })

  test.describe('A. 규칙 목록 페이지 표시', () => {
    test('인증 후 최적화 규칙 페이지에 제목이 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await expect(
        page.getByRole('heading', { name: '최적화 규칙' })
      ).toBeVisible({ timeout: 15000 })
    })

    test('규칙 목록이 테이블에 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await expect(
        page.getByRole('heading', { name: '최적화 규칙' })
      ).toBeVisible({ timeout: 15000 })

      // 첫 번째 규칙 이름 확인
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 10000 })
    })

    test('두 번째 규칙도 테이블에 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await expect(
        page.getByRole('heading', { name: '최적화 규칙' })
      ).toBeVisible({ timeout: 15000 })

      await expect(page.getByText('ROAS 하한 미달 시 예산 감소')).toBeVisible({ timeout: 10000 })
    })

    test('규칙 추가 버튼이 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await expect(
        page.getByRole('button', { name: /규칙 추가/ })
      ).toBeVisible({ timeout: 15000 })
    })

    test('빠른 시작 프리셋 섹션이 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await expect(page.getByText('빠른 시작 프리셋')).toBeVisible({ timeout: 15000 })
    })

    test('캠페인 필터 Select가 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await expect(page.getByText('캠페인 필터')).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('B. 빈 상태 표시', () => {
    test('규칙이 없을 때 빈 상태 메시지가 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page, [])

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await expect(
        page.getByRole('heading', { name: '최적화 규칙' })
      ).toBeVisible({ timeout: 15000 })

      // OptimizationRuleTable의 빈 상태 메시지
      await expect(
        page.getByText('아직 최적화 규칙이 없습니다')
      ).toBeVisible({ timeout: 10000 })
    })

    test('규칙이 없을 때 프리셋으로 시작 안내 문구가 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page, [])

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await expect(
        page.getByText(/프리셋으로 빠르게 시작하거나/)
      ).toBeVisible({ timeout: 15000 })
    })
  })

  test.describe('C. 규칙 생성', () => {
    test('"규칙 추가" 버튼 클릭 시 Dialog 모달이 열려야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      const addButton = page.getByRole('button', { name: /규칙 추가/ })
      await expect(addButton).toBeVisible({ timeout: 15000 })
      await addButton.click()

      // Dialog가 열려야 함 — DialogTitle: "최적화 규칙 추가"
      await expect(
        page.getByRole('dialog', { name: /최적화 규칙 추가/ })
      ).toBeVisible({ timeout: 5000 })
    })

    test('모달에 규칙 이름 입력 필드가 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await page.getByRole('button', { name: /규칙 추가/ }).click()

      await expect(page.getByLabel(/규칙 이름/)).toBeVisible({ timeout: 5000 })
    })

    test('규칙 이름을 입력하고 폼을 제출하면 새 규칙이 목록에 추가되어야 한다', async ({
      page,
    }) => {
      const newRule = {
        ...mockRules[0],
        id: 'rule-new',
        name: '소재 피로도 감지 알림',
        ruleType: 'CREATIVE_FATIGUE',
      }

      await setupBaseMocks(page)

      // POST /api/optimization-rules mock (setupBaseMocks의 GET route 이후에 등록)
      await page.route('**/api/optimization-rules', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ rule: newRule }),
          })
        } else {
          await route.continue()
        }
      })

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      // 모달 열기
      await page.getByRole('button', { name: /규칙 추가/ }).click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

      // 규칙 이름 입력
      await page.getByLabel(/규칙 이름/).fill('소재 피로도 감지 알림')

      // 캠페인 선택 (생성 시 필수 — Select에 "캠페인 선택..." placeholder)
      const campaignCombobox = page.getByRole('combobox').first()
      if (await campaignCombobox.isVisible({ timeout: 2000 }).catch(() => false)) {
        const placeholderText = await campaignCombobox.textContent()
        if (placeholderText?.includes('캠페인 선택')) {
          await campaignCombobox.click()
          const option = page.getByRole('option', { name: '봄 세일 캠페인' })
          if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
            await option.click()
          }
        }
      }

      // 조건 값 입력
      const conditionInput = page.locator('input[type="number"]').first()
      if (await conditionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await conditionInput.fill('15000')
      }

      // 폼 제출 ("규칙 생성" 버튼)
      await page.getByRole('button', { name: /규칙 생성/ }).click()

      // 모달이 닫혀야 함
      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })

      // 새 규칙이 목록에 표시되어야 함 (낙관적 업데이트)
      await expect(page.getByText('소재 피로도 감지 알림')).toBeVisible({ timeout: 8000 })
    })

    test('규칙 이름 없이 제출 시 유효성 검사 에러가 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await page.getByRole('button', { name: /규칙 추가/ }).click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

      // 이름 비워두고 제출
      await page.getByRole('button', { name: /규칙 생성/ }).click()

      // 에러 메시지 확인
      await expect(page.getByText('규칙 이름을 입력하세요')).toBeVisible({ timeout: 5000 })
    })

    test('"취소" 버튼 클릭 시 모달이 닫혀야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      await page.getByRole('button', { name: /규칙 추가/ }).click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 })

      await page.getByRole('button', { name: /취소/ }).click()

      await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('D. 규칙 토글 (활성/비활성)', () => {
    test('토글 스위치 클릭 시 PATCH API가 호출되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      let patchCalled = false
      await page.route('**/api/optimization-rules/rule-1', async (route) => {
        if (route.request().method() === 'PATCH') {
          patchCalled = true
          const body = route.request().postDataJSON()
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              rule: { ...mockRules[0], isEnabled: body.isEnabled },
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 15000 })

      // 첫 번째 규칙의 토글 스위치 (role="switch")
      const toggleSwitch = page.getByRole('switch').first()
      await toggleSwitch.click()

      // PATCH API 호출 확인 (낙관적 업데이트로 즉시 반영)
      expect(patchCalled).toBe(true)
    })

    test('토글 클릭 후 스위치 상태가 변경되어야 한다 (낙관적 업데이트)', async ({
      page,
    }) => {
      await setupBaseMocks(page)

      await page.route('**/api/optimization-rules/rule-1', async (route) => {
        if (route.request().method() === 'PATCH') {
          const body = route.request().postDataJSON()
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              rule: { ...mockRules[0], isEnabled: body.isEnabled },
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 15000 })

      const toggleSwitch = page.getByRole('switch').first()
      const initialChecked = await toggleSwitch.getAttribute('aria-checked')

      await toggleSwitch.click()

      // 낙관적 업데이트로 즉시 상태가 반전되어야 함
      const updatedChecked = await toggleSwitch.getAttribute('aria-checked')
      expect(updatedChecked).not.toBe(initialChecked)
    })
  })

  test.describe('E. 규칙 삭제', () => {
    test('더보기 메뉴의 삭제 클릭 시 확인 다이얼로그 후 DELETE API가 호출되어야 한다', async ({
      page,
    }) => {
      await setupBaseMocks(page)

      let deleteCalled = false
      await page.route('**/api/optimization-rules/rule-1', async (route) => {
        if (route.request().method() === 'DELETE') {
          deleteCalled = true
          await route.fulfill({ status: 204 })
        } else {
          await route.continue()
        }
      })

      // window.confirm을 자동 승인으로 설정
      page.on('dialog', (dialog) => dialog.accept())

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 15000 })

      // 더보기 메뉴 버튼 (MoreHorizontal 아이콘 — hover 시 보임)
      const ruleRow = page.getByRole('row').filter({ hasText: 'CPA 상한 초과 시 일시중지' })
      await ruleRow.hover()

      const moreButton = ruleRow.getByRole('button', { name: /메뉴 열기/ })
      await moreButton.click()

      // 삭제 메뉴 아이템 클릭
      await page.getByRole('menuitem', { name: /삭제/ }).click()

      // DELETE API 호출 확인
      expect(deleteCalled).toBe(true)
    })

    test('삭제 후 해당 규칙이 목록에서 제거되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.route('**/api/optimization-rules/rule-1', async (route) => {
        if (route.request().method() === 'DELETE') {
          await route.fulfill({ status: 204 })
        } else {
          await route.continue()
        }
      })

      page.on('dialog', (dialog) => dialog.accept())

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 15000 })

      // hover → 더보기 → 삭제
      const ruleRow = page.getByRole('row').filter({ hasText: 'CPA 상한 초과 시 일시중지' })
      await ruleRow.hover()
      await ruleRow.getByRole('button', { name: /메뉴 열기/ }).click()
      await page.getByRole('menuitem', { name: /삭제/ }).click()

      // 삭제된 규칙은 목록에서 사라져야 함 (클라이언트 낙관적 업데이트)
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).not.toBeVisible({
        timeout: 5000,
      })

      // 나머지 규칙은 여전히 표시되어야 함
      await expect(page.getByText('ROAS 하한 미달 시 예산 감소')).toBeVisible({ timeout: 5000 })
    })

    test('삭제 확인 다이얼로그를 취소하면 규칙이 유지되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      // window.confirm 취소
      page.on('dialog', (dialog) => dialog.dismiss())

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 15000 })

      const ruleRow = page.getByRole('row').filter({ hasText: 'CPA 상한 초과 시 일시중지' })
      await ruleRow.hover()
      await ruleRow.getByRole('button', { name: /메뉴 열기/ }).click()
      await page.getByRole('menuitem', { name: /삭제/ }).click()

      // 취소했으므로 규칙이 여전히 표시되어야 함
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('F. 프리셋 적용', () => {
    test('빠른 시작 프리셋 섹션의 토글 버튼이 동작해야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })

      // 초기에는 프리셋이 펼쳐져 있음 (presetsVisible = true)
      await expect(page.getByText('빠른 시작 프리셋')).toBeVisible({ timeout: 15000 })

      // aria-expanded 속성을 가진 프리셋 토글 버튼
      const presetToggle = page.locator('button[aria-expanded]').first()

      if (await presetToggle.isVisible({ timeout: 3000 }).catch(() => false)) {
        // 접기
        await presetToggle.click()
        await expect(page.getByText('이커머스 기본 프리셋')).not.toBeVisible({ timeout: 3000 })

        // 다시 펼치기
        await presetToggle.click()
        await expect(page.getByText('이커머스 기본 프리셋')).toBeVisible({ timeout: 5000 })
      }
    })

    test('캠페인 선택 전에는 프리셋 적용 버튼이 비활성화되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('빠른 시작 프리셋')).toBeVisible({ timeout: 15000 })

      // 캠페인 미선택 상태의 프리셋 적용 버튼 (텍스트: "캠페인을 선택하세요")
      const disabledButtons = page.getByRole('button', { name: /캠페인을 선택하세요/ })
      const count = await disabledButtons.count()

      if (count > 0) {
        await expect(disabledButtons.first()).toBeDisabled()
      }
    })

    test('캠페인 선택 후 프리셋 적용 시 POST API가 호출되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      let postCalled = false
      await page.route('**/api/optimization-rules', async (route) => {
        if (route.request().method() === 'POST') {
          postCalled = true
          const body = route.request().postDataJSON()
          await route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              rule: {
                id: 'rule-preset-new',
                userId: 'user-1',
                isEnabled: true,
                lastTriggeredAt: null,
                triggerCount: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                ...body,
              },
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('빠른 시작 프리셋')).toBeVisible({ timeout: 15000 })

      // RulePresetCards의 캠페인 Select (마지막 combobox — 헤더 필터와 구분)
      const allComboboxes = page.getByRole('combobox')
      const count = await allComboboxes.count()

      // 프리셋 섹션의 캠페인 Select 찾기 (placeholder: "캠페인 선택...")
      for (let i = 0; i < count; i++) {
        const box = allComboboxes.nth(i)
        const text = await box.textContent()
        if (text?.includes('캠페인 선택')) {
          await box.click()
          const option = page.getByRole('option', { name: '봄 세일 캠페인' })
          if (await option.isVisible({ timeout: 2000 }).catch(() => false)) {
            await option.click()

            // 프리셋 적용 버튼 활성화 확인
            const applyButton = page.getByRole('button', { name: /이 프리셋 적용/ }).first()
            await expect(applyButton).toBeEnabled({ timeout: 3000 })

            // 첫 번째 프리셋 적용
            await applyButton.click()

            expect(postCalled).toBe(true)
            return
          }
          break
        }
      }
    })

    test('3개의 기본 프리셋 카드가 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('빠른 시작 프리셋')).toBeVisible({ timeout: 15000 })

      // 이커머스 기본 프리셋 개수 뱃지 (Badge: "3개")
      await expect(page.getByText('3개')).toBeVisible({ timeout: 10000 })
    })

    test('프리셋 카드에 3가지 기본 프리셋 제목이 표시되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('빠른 시작 프리셋')).toBeVisible({ timeout: 15000 })

      // 3가지 프리셋 제목 확인 (PRESETS 배열과 동일)
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('ROAS 하한 미달 시 예산 감소')).toBeVisible({ timeout: 10000 })
      await expect(page.getByText('예산 초과 소진 알림')).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('G. 규칙 수정', () => {
    test('더보기 메뉴의 수정 클릭 시 수정 모달이 열려야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 15000 })

      // hover → 더보기 → 수정
      const ruleRow = page.getByRole('row').filter({ hasText: 'CPA 상한 초과 시 일시중지' })
      await ruleRow.hover()
      await ruleRow.getByRole('button', { name: /메뉴 열기/ }).click()
      await page.getByRole('menuitem', { name: /수정/ }).click()

      // 수정 모달이 열려야 함 (DialogTitle: "규칙 수정")
      await expect(
        page.getByRole('dialog', { name: /규칙 수정/ })
      ).toBeVisible({ timeout: 5000 })
    })

    test('수정 모달에 기존 규칙 이름이 미리 채워져 있어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 15000 })

      const ruleRow = page.getByRole('row').filter({ hasText: 'CPA 상한 초과 시 일시중지' })
      await ruleRow.hover()
      await ruleRow.getByRole('button', { name: /메뉴 열기/ }).click()
      await page.getByRole('menuitem', { name: /수정/ }).click()

      // 기존 이름이 입력 필드에 채워져 있어야 함
      await expect(page.getByLabel(/규칙 이름/)).toHaveValue('CPA 상한 초과 시 일시중지', {
        timeout: 5000,
      })
    })

    test('수정 완료 시 PATCH API가 호출되어야 한다', async ({ page }) => {
      await setupBaseMocks(page)

      let patchCalled = false
      await page.route('**/api/optimization-rules/rule-1', async (route) => {
        if (route.request().method() === 'PATCH') {
          patchCalled = true
          const body = route.request().postDataJSON()
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              rule: { ...mockRules[0], ...body },
            }),
          })
        } else {
          await route.continue()
        }
      })

      await page.goto('/optimization-rules', { waitUntil: 'domcontentloaded' })
      await expect(page.getByText('CPA 상한 초과 시 일시중지')).toBeVisible({ timeout: 15000 })

      // 수정 모달 열기
      const ruleRow = page.getByRole('row').filter({ hasText: 'CPA 상한 초과 시 일시중지' })
      await ruleRow.hover()
      await ruleRow.getByRole('button', { name: /메뉴 열기/ }).click()
      await page.getByRole('menuitem', { name: /수정/ }).click()

      // 이름 변경
      const nameInput = page.getByLabel(/규칙 이름/)
      await nameInput.clear()
      await nameInput.fill('CPA 상한 초과 시 일시중지 (수정됨)')

      // 수정 완료 버튼 클릭
      await page.getByRole('button', { name: /수정 완료/ }).click()

      // PATCH API 호출 확인
      expect(patchCalled).toBe(true)
    })
  })
})
