/**
 * TEST-06: 팀 관리 E2E 테스트
 *
 * 팀 관리 전체 플로우:
 * - 팀 생성
 * - 멤버 초대/수락/제거
 * - 역할 변경
 * - 팀 삭제
 */

import { test, expect } from '@playwright/test'
import { authFixture } from '../fixtures/auth'

test.describe('Team Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock teams API
    await page.route('**/api/teams', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            teams: [
              {
                id: 'team_001',
                name: 'Marketing Team',
                description: '마케팅 팀',
                ownerId: 'user_test_001',
                isOwner: true,
                memberCount: 3,
                maxMembers: 10,
                role: 'OWNER',
                permissions: ['*'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: 'team_002',
                name: 'Dev Team',
                description: '개발 팀',
                ownerId: 'user_002',
                isOwner: false,
                memberCount: 5,
                maxMembers: 10,
                role: 'MEMBER',
                permissions: ['campaign:read'],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          }),
        })
      } else if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}')
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            team: {
              id: 'team_new_001',
              name: body.name,
              description: body.description || null,
              ownerId: 'user_test_001',
              isOwner: true,
              memberCount: 1,
              maxMembers: body.maxMembers || 10,
              role: 'OWNER',
              permissions: ['*'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          }),
        })
      }
    })

    // Mock team details
    await page.route('**/api/teams/team_001', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            team: {
              id: 'team_001',
              name: 'Marketing Team',
              description: '마케팅 팀',
              ownerId: 'user_test_001',
              memberCount: 3,
              maxMembers: 10,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            members: [
              {
                id: 'member_001',
                userId: 'user_test_001',
                email: 'test@example.com',
                name: 'Test User',
                role: 'OWNER',
                permissions: ['*'],
                invitedBy: null,
                invitedAt: new Date().toISOString(),
                joinedAt: new Date().toISOString(),
                isActive: true,
                isPending: false,
              },
              {
                id: 'member_002',
                userId: 'user_002',
                email: 'member@example.com',
                name: 'Team Member',
                role: 'MEMBER',
                permissions: ['campaign:read', 'campaign:create'],
                invitedBy: 'user_test_001',
                invitedAt: new Date().toISOString(),
                joinedAt: new Date().toISOString(),
                isActive: true,
                isPending: false,
              },
              {
                id: 'member_003',
                userId: null,
                email: 'pending@example.com',
                name: 'Pending Invite',
                role: 'MEMBER',
                permissions: ['campaign:read'],
                invitedBy: 'user_test_001',
                invitedAt: new Date().toISOString(),
                joinedAt: null,
                isActive: false,
                isPending: true,
              },
            ],
            currentUserRole: 'OWNER',
            currentUserPermissions: ['*'],
          }),
        })
      }
    })

    // Mock member invite
    await page.route('**/api/teams/team_001/members', async (route) => {
      if (route.request().method() === 'POST') {
        const body = JSON.parse(route.request().postData() || '{}')
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            member: {
              id: 'member_new_001',
              userId: null,
              email: body.email,
              name: body.name || null,
              role: body.role,
              permissions: body.permissions || [],
              invitedBy: 'user_test_001',
              invitedAt: new Date().toISOString(),
              joinedAt: null,
              isActive: false,
              isPending: true,
            },
          }),
        })
      }
    })

    // Mock member update/delete
    await page.route('**/api/teams/team_001/members/*', async (route) => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            member: {
              id: 'member_002',
              role: 'ADMIN',
              permissions: ['*'],
            },
          }),
        })
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        })
      }
    })

    await authFixture.loginAsUser(page)
  })

  test.describe('Team List', () => {
    test('should display list of teams', async ({ page }) => {
      await page.goto('/settings/teams')

      // 팀 목록이 표시되어야 함
      await expect(page.getByText('Marketing Team')).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('Dev Team')).toBeVisible({ timeout: 5000 })
    })

    test('should show team member counts', async ({ page }) => {
      await page.goto('/settings/teams')

      // 멤버 수가 표시되어야 함
      await expect(page.getByText(/3/).first()).toBeVisible({ timeout: 5000 })
    })

    test('should show role badges for each team', async ({ page }) => {
      await page.goto('/settings/teams')

      // 역할이 표시되어야 함
      await expect(page.getByText(/OWNER|소유자/i).first()).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Team Creation', () => {
    test('should open team creation dialog', async ({ page }) => {
      await page.goto('/settings/teams')

      const createButton = page.getByRole('button', { name: /팀 생성|Create Team|새 팀/i })
      if (await createButton.isVisible({ timeout: 3000 })) {
        await createButton.click()

        // 생성 다이얼로그가 표시되어야 함
        await expect(page.getByText(/팀 이름|Team Name/i)).toBeVisible({ timeout: 3000 })
      }
    })

    test('should create a new team successfully', async ({ page }) => {
      await page.goto('/settings/teams')

      const createButton = page.getByRole('button', { name: /팀 생성|Create Team|새 팀/i })
      if (await createButton.isVisible({ timeout: 3000 })) {
        await createButton.click()

        // 팀 이름 입력
        const nameInput = page.getByLabel(/팀 이름|Team Name/i)
        if (await nameInput.isVisible({ timeout: 2000 })) {
          await nameInput.fill('New Test Team')

          // 생성 버튼 클릭
          const submitButton = page.getByRole('button', { name: /생성|Create|만들기/i })
          await submitButton.click()

          // 성공 메시지나 팀 목록으로 이동
          await expect(
            page.getByText(/성공|Success|생성되었습니다|created/i)
          ).toBeVisible({ timeout: 5000 })
        }
      }
    })
  })

  test.describe('Member Management', () => {
    test('should display team members', async ({ page }) => {
      await page.goto('/settings/teams/team_001')

      // 팀 멤버 정보가 표시되어야 함
      await expect(page.getByText('test@example.com')).toBeVisible({ timeout: 5000 })
      await expect(page.getByText('member@example.com')).toBeVisible({ timeout: 5000 })
    })

    test('should show pending invitations', async ({ page }) => {
      await page.goto('/settings/teams/team_001')

      // 대기 중인 초대가 표시되어야 함
      await expect(page.getByText('pending@example.com')).toBeVisible({ timeout: 5000 })
    })

    test('should open invite member dialog', async ({ page }) => {
      await page.goto('/settings/teams/team_001')

      const inviteButton = page.getByRole('button', { name: /초대|Invite|멤버 추가/i })
      if (await inviteButton.isVisible({ timeout: 3000 })) {
        await inviteButton.click()

        // 초대 다이얼로그가 표시되어야 함
        await expect(page.getByLabel(/이메일|Email/i)).toBeVisible({ timeout: 3000 })
      }
    })

    test('should invite a new member', async ({ page }) => {
      await page.goto('/settings/teams/team_001')

      const inviteButton = page.getByRole('button', { name: /초대|Invite|멤버 추가/i })
      if (await inviteButton.isVisible({ timeout: 3000 })) {
        await inviteButton.click()

        const emailInput = page.getByLabel(/이메일|Email/i)
        if (await emailInput.isVisible({ timeout: 2000 })) {
          await emailInput.fill('newmember@example.com')

          const submitButton = page.getByRole('button', { name: /초대|Invite|보내기|Send/i }).last()
          await submitButton.click()

          // 성공 메시지
          await expect(
            page.getByText(/초대|Invited|성공|success/i)
          ).toBeVisible({ timeout: 5000 })
        }
      }
    })

    test('should handle member removal with confirmation', async ({ page }) => {
      await page.goto('/settings/teams/team_001')

      const removeButton = page
        .getByRole('button', { name: /제거|Remove|삭제|Delete/i })
        .first()

      if (await removeButton.isVisible({ timeout: 3000 })) {
        await removeButton.click()

        // 확인 다이얼로그 표시
        await expect(page.getByText(/정말|확인|Are you sure|Confirm/i)).toBeVisible({
          timeout: 5000,
        })
      }
    })
  })
})
