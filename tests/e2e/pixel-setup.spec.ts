import { test, expect } from '@playwright/test'

// Helper to mock dashboard API responses
async function mockDashboardAPIs(page: import('@playwright/test').Page) {
  // Mock dashboard KPI API
  await page.route('**/api/dashboard/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        summary: {
          totalSpend: 1000000,
          totalConversions: 50,
          averageRoas: 2.5,
          averageCtr: 1.5,
          changes: { spend: 5, conversions: 10, roas: 15, ctr: 5 },
        },
        chartData: [],
      }),
    })
  })

  // Mock campaigns API
  await page.route('**/api/campaigns**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ campaigns: [] }),
    })
  })
}

test.describe('Pixel Setup Flow', () => {
  test.describe('Onboarding Wizard - Pixel Step', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authenticated session with Meta connected
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              metaAccessToken: 'mock-meta-token',
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        })
      })

      // Mock pixels API - PixelSelector expects { data: [...] } format
      await page.route('**/api/pixel', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: [
                {
                  id: 'pixel-1',
                  metaPixelId: '123456789012345',
                  name: 'Test Pixel 1',
                  isActive: true,
                  setupMethod: 'MANUAL',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
                {
                  id: 'pixel-2',
                  metaPixelId: '987654321098765',
                  name: 'Test Pixel 2',
                  isActive: true,
                  setupMethod: 'MANUAL',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                },
              ],
            }),
          })
        }
      })

      // Mock dashboard APIs
      await mockDashboardAPIs(page)

      // Clear onboarding status
      await page.addInitScript(() => {
        localStorage.removeItem('batwo_onboarding_completed')
      })
    })

    test('should display pixel setup step in onboarding', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to step 3 (pixel setup)
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Verify pixel setup step is visible - use specific locator for the step description
      await expect(page.getByText(/Meta 픽셀을 설치하여/i)).toBeVisible()
      // Check for 3/4 progress (step 3 of 4)
      await expect(page.getByText('3/4')).toBeVisible()
    })

    test('should show pixel selector on pixel step', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Wait for pixels to load
      await expect(page.getByText('Test Pixel 1')).toBeVisible()
      await expect(page.getByText('Test Pixel 2')).toBeVisible()
    })

    test('should show pixel benefits section', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Verify benefits section
      await expect(page.getByText(/픽셀 설치 효과/i)).toBeVisible()
      await expect(page.getByText(/웹사이트 방문자 행동 추적/i)).toBeVisible()
      await expect(page.getByText(/전환 이벤트 측정/i)).toBeVisible()
    })

    test('should show skip message', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      await expect(page.getByText(/나중에 설정에서도 가능합니다/i)).toBeVisible()
    })

    test('should allow skipping onboarding from pixel step', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Click skip button
      await page.getByRole('button', { name: /건너뛰기/i }).click()

      // Onboarding should be dismissed
      await expect(page.getByRole('dialog')).not.toBeVisible()
    })

    test('should navigate back to Meta connect step', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Click back button
      await page.getByRole('button', { name: /이전/i }).click()

      // Should be on Meta connect step
      await expect(page.getByText(/Meta 광고 계정 연결/i)).toBeVisible()
    })

    test('should proceed to completion step', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate through all steps
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Should be on completion step
      await expect(page.getByText(/설정이 완료되었습니다/i)).toBeVisible()
    })
  })

  test.describe('Pixel Selection', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authenticated session with Meta connected
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              metaAccessToken: 'mock-meta-token',
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        })
      })

      // Mock pixels API - PixelSelector expects { data: [...] } format
      await page.route('**/api/pixel', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'pixel-1',
                metaPixelId: '123456789012345',
                name: 'My Store Pixel',
                isActive: true,
                setupMethod: 'MANUAL',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        })
      })

      // Mock dashboard APIs
      await mockDashboardAPIs(page)

      // Clear onboarding
      await page.addInitScript(() => {
        localStorage.removeItem('batwo_onboarding_completed')
      })
    })

    test('should select a pixel and show script', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Wait for and click on pixel
      await page.getByText('My Store Pixel').click()

      // Should show script code
      await expect(page.getByText(/선택됨/i)).toBeVisible()
      await expect(page.getByText(/<script/i)).toBeVisible()
    })

    test('should allow selecting different pixel', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Select pixel
      await page.getByText('My Store Pixel').click()

      // Should be able to change selection
      await expect(page.getByText(/다른 픽셀 선택/i)).toBeVisible()
    })
  })

  test.describe('Script Copy Functionality', () => {
    test.beforeEach(async ({ page }) => {
      // Mock session
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              metaAccessToken: 'mock-meta-token',
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        })
      })

      // Mock pixels API - PixelSelector expects { data: [...] } format
      await page.route('**/api/pixel', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                id: 'pixel-test',
                metaPixelId: '111222333444555',
                name: 'Copy Test Pixel',
                isActive: true,
                setupMethod: 'MANUAL',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        })
      })

      // Mock dashboard APIs
      await mockDashboardAPIs(page)

      await page.addInitScript(() => {
        localStorage.removeItem('batwo_onboarding_completed')
      })
    })

    test('should show copy button after pixel selection', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Select pixel
      await page.getByText('Copy Test Pixel').click()

      // Copy button should be visible (aria-label: "코드 복사")
      await expect(page.getByRole('button', { name: /코드 복사/i })).toBeVisible()
    })

    test('should show installation instructions', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Select pixel
      await page.getByText('Copy Test Pixel').click()

      // Should show installation instructions
      await expect(page.getByText(/설치 방법/i)).toBeVisible()
      await expect(page.getByText(/<head>/i)).toBeVisible()
    })
  })

  test.describe('Without Meta Connection', () => {
    test('should show warning when Meta is not connected', async ({ page }) => {
      // Mock session without Meta token
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              name: 'Test User',
              email: 'test@example.com',
              // No metaAccessToken
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        })
      })

      // Mock dashboard APIs
      await mockDashboardAPIs(page)

      await page.addInitScript(() => {
        localStorage.removeItem('batwo_onboarding_completed')
      })

      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Should show warning about Meta connection
      await expect(page.getByText(/먼저 Meta 계정을 연결해주세요/i)).toBeVisible()
    })
  })

  test.describe('Progress Indicator', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/auth/session', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-id',
              metaAccessToken: 'mock-meta-token',
            },
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          }),
        })
      })

      // Mock pixels API - PixelSelector expects { data: [...] } format
      await page.route('**/api/pixel', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        })
      })

      // Mock dashboard APIs
      await mockDashboardAPIs(page)

      await page.addInitScript(() => {
        localStorage.removeItem('batwo_onboarding_completed')
      })
    })

    test('should show correct progress on pixel step', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step (step 3)
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Should show 3/4 progress
      await expect(page.getByText('3/4')).toBeVisible()
    })

    test('should have progress bar at 75% on pixel step', async ({ page }) => {
      await page.goto('/dashboard')

      // Navigate to pixel step
      await page.getByRole('button', { name: /다음/i }).click()
      await page.getByRole('button', { name: /다음/i }).click()

      // Progress bar should be visible
      const progressbar = page.getByRole('progressbar')
      await expect(progressbar).toBeVisible()
      await expect(progressbar).toHaveAttribute('aria-valuenow', '3')
      await expect(progressbar).toHaveAttribute('aria-valuemax', '4')
    })
  })
})
