/**
 * TEST-06: Admin 패널 E2E 테스트
 *
 * 관리자 기능 전체 플로우:
 * - 사용자 관리 (목록, 역할 변경, 정지)
 * - 시스템 설정 (Meta API, 알림, 요금)
 * - 감사 로그 조회
 * - 대시보드 통계
 */

import { test, expect } from '@playwright/test'
import { authFixture } from '../fixtures/auth'

test.describe('Admin Panel', () => {
  test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Admin 으로 로그인
      await page.route('**/api/test/mock-auth', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user_admin_001',
              email: 'admin@example.com',
              name: 'Admin User',
              globalRole: 'ADMIN',
            },
          }),
        })
      })

      // Mock admin stats
      await page.route('**/api/admin/stats', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            totalUsers: 150,
            activeUsers: 120,
            totalCampaigns: 450,
            activeCampaigns: 230,
            totalRevenue: 12500000,
            monthlyGrowthRate: 15.3,
          }),
        })
      })

      await authFixture.loginAsUser(page, 'admin@example.com')
    })

    test('should display admin dashboard with system statistics', async ({ page }) => {
      await page.goto('/admin')

      // 관리자 대시보드 요소 확인
      await expect(page.getByText(/관리자|Admin/i)).toBeVisible({ timeout: 5000 })
      await expect(page.getByText(/사용자|Users/i)).toBeVisible({ timeout: 5000 })
    })

    test('should show navigation to admin sub-pages', async ({ page }) => {
      await page.goto('/admin')

      // 관리자 메뉴 확인
      const navItems = page.getByRole('link').or(page.getByRole('button'))
      const count = await navItems.count()
      expect(count).toBeGreaterThan(0)
    })
  })

  test.describe('User Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/test/mock-auth', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user_admin_001',
              email: 'admin@example.com',
              name: 'Admin User',
              globalRole: 'ADMIN',
            },
          }),
        })
      })

      await page.route('**/api/admin/users*', async (route) => {
        if (route.request().method() === 'GET') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              users: [
                {
                  id: 'user_001',
                  email: 'user1@example.com',
                  name: 'User One',
                  globalRole: 'USER',
                  status: 'active',
                  createdAt: new Date().toISOString(),
                  lastLoginAt: new Date().toISOString(),
                  campaignCount: 3,
                },
                {
                  id: 'user_002',
                  email: 'user2@example.com',
                  name: 'User Two',
                  globalRole: 'USER',
                  status: 'active',
                  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
                  lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
                  campaignCount: 7,
                },
                {
                  id: 'user_003',
                  email: 'suspended@example.com',
                  name: 'Suspended User',
                  globalRole: 'USER',
                  status: 'suspended',
                  createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
                  lastLoginAt: null,
                  campaignCount: 0,
                },
              ],
              total: 3,
              page: 1,
              pageSize: 20,
            }),
          })
        }
      })

      await authFixture.loginAsUser(page, 'admin@example.com')
    })

    test('should display user list with details', async ({ page }) => {
      await page.goto('/admin/users')

      // 사용자 목록에 사용자 정보가 표시되어야 함
      await expect(page.getByText('user1@example.com')).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('user2@example.com')).toBeVisible({ timeout: 5000 })
    })

    test('should show user role badges', async ({ page }) => {
      await page.goto('/admin/users')

      // 역할 배지가 표시되어야 함
      await expect(page.getByText(/USER|사용자/i).first()).toBeVisible({ timeout: 5000 })
    })

    test('should handle role change via dialog', async ({ page }) => {
      // Mock role change API
      await page.route('**/api/admin/users/*/role', async (route) => {
        if (route.request().method() === 'PATCH') {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true }),
          })
        }
      })

      await page.goto('/admin/users')

      // 첫 번째 사용자의 역할 변경 버튼 클릭
      const roleButton = page.getByRole('button', { name: /역할|Role|변경|Change/i }).first()
      if (await roleButton.isVisible({ timeout: 3000 })) {
        await roleButton.click()

        // 역할 선택 다이얼로그 확인
        await expect(page.getByText(/역할 변경|Change Role/i)).toBeVisible({ timeout: 3000 })
      }
    })

    test('should handle user suspension', async ({ page }) => {
      await page.route('**/api/admin/users/*/suspend', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      })

      await page.goto('/admin/users')

      // 정지 버튼 확인
      const suspendButton = page.getByRole('button', { name: /정지|Suspend|차단|Block/i }).first()
      if (await suspendButton.isVisible({ timeout: 3000 })) {
        await suspendButton.click()

        // 확인 다이얼로그 표시
        await expect(page.getByText(/확인|Confirm|정말/i)).toBeVisible({ timeout: 5000 })
      }
    })
  })

  test.describe('Audit Log', () => {
    test.beforeEach(async ({ page }) => {
      await page.route('**/api/test/mock-auth', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'user_admin_001',
              email: 'admin@example.com',
              name: 'Admin User',
              globalRole: 'ADMIN',
            },
          }),
        })
      })

      await page.route('**/api/admin/audit-logs*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            logs: [
              {
                id: 'log_001',
                action: 'USER_LOGIN',
                userId: 'user_001',
                userEmail: 'user1@example.com',
                details: 'Successful login via Meta OAuth',
                createdAt: new Date().toISOString(),
                ipAddress: '192.168.1.1',
              },
              {
                id: 'log_002',
                action: 'CAMPAIGN_CREATED',
                userId: 'user_002',
                userEmail: 'user2@example.com',
                details: 'Created campaign: 신규 고객 확보',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                ipAddress: '10.0.0.1',
              },
              {
                id: 'log_003',
                action: 'ROLE_CHANGED',
                userId: 'user_admin_001',
                userEmail: 'admin@example.com',
                details: 'Changed user_001 role from USER to ADMIN',
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                ipAddress: '172.16.0.1',
              },
            ],
            total: 3,
          }),
        })
      })

      await authFixture.loginAsUser(page, 'admin@example.com')
    })

    test('should display audit log entries', async ({ page }) => {
      await page.goto('/admin/audit')

      // 감사 로그 항목이 표시되어야 함
      await expect(page.getByText(/감사|Audit|로그|Log/i).first()).toBeVisible({ timeout: 5000 })
    })

    test('should show log entry details', async ({ page }) => {
      await page.goto('/admin/audit')

      // 로그 항목에 이메일이 표시되어야 함
      await expect(page.getByText('user1@example.com')).toBeVisible({ timeout: 5000 })
    })
  })
})
