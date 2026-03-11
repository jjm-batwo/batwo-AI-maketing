/**
 * Admin Middleware 단위 테스트
 *
 * requireAdmin(), requireSuperAdmin(), handleAdminAuth() 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// auth() 모킹
vi.mock('@infrastructure/auth/auth', () => ({
    auth: vi.fn(),
}))

import { auth } from '@infrastructure/auth/auth'
import {
    requireAdmin,
    requireSuperAdmin,
    handleAdminAuth,
    unauthorizedResponse,
    forbiddenResponse,
} from '@infrastructure/auth/adminMiddleware'
import { GlobalRole } from '@domain/value-objects/GlobalRole'

const mockAuth = vi.mocked(auth)

describe('adminMiddleware', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('requireAdmin', () => {
        it('세션이 없으면 unauthorized를 반환한다', async () => {
            mockAuth.mockResolvedValue(null)

            const result = await requireAdmin()

            expect(result.authorized).toBe(false)
            expect(result.error).toContain('Not logged in')
        })

        it('USER 역할이면 forbidden을 반환한다', async () => {
            mockAuth.mockResolvedValue({
                user: { id: 'user1', globalRole: GlobalRole.USER },
                expires: new Date(Date.now() + 86400000).toISOString(),
            } as any)

            const result = await requireAdmin()

            expect(result.authorized).toBe(false)
            expect(result.error).toContain('Admin access required')
        })

        it('ADMIN 역할이면 authorized를 반환한다', async () => {
            mockAuth.mockResolvedValue({
                user: { id: 'admin1', globalRole: GlobalRole.ADMIN },
                expires: new Date(Date.now() + 86400000).toISOString(),
            } as any)

            const result = await requireAdmin()

            expect(result.authorized).toBe(true)
            expect(result.userId).toBe('admin1')
            expect(result.globalRole).toBe(GlobalRole.ADMIN)
        })

        it('SUPER_ADMIN 역할도 admin으로 인정한다', async () => {
            mockAuth.mockResolvedValue({
                user: { id: 'super1', globalRole: GlobalRole.SUPER_ADMIN },
                expires: new Date(Date.now() + 86400000).toISOString(),
            } as any)

            const result = await requireAdmin()

            expect(result.authorized).toBe(true)
        })
    })

    describe('requireSuperAdmin', () => {
        it('ADMIN 역할이면 forbidden을 반환한다', async () => {
            mockAuth.mockResolvedValue({
                user: { id: 'admin1', globalRole: GlobalRole.ADMIN },
                expires: new Date(Date.now() + 86400000).toISOString(),
            } as any)

            const result = await requireSuperAdmin()

            expect(result.authorized).toBe(false)
            expect(result.error).toContain('Super Admin access required')
        })

        it('SUPER_ADMIN 역할이면 authorized를 반환한다', async () => {
            mockAuth.mockResolvedValue({
                user: { id: 'super1', globalRole: GlobalRole.SUPER_ADMIN },
                expires: new Date(Date.now() + 86400000).toISOString(),
            } as any)

            const result = await requireSuperAdmin()

            expect(result.authorized).toBe(true)
            expect(result.userId).toBe('super1')
        })
    })

    describe('handleAdminAuth', () => {
        it('authorized이면 null을 반환한다', () => {
            const result = handleAdminAuth({
                authorized: true,
                userId: 'admin1',
                globalRole: GlobalRole.ADMIN,
            })

            expect(result).toBeNull()
        })

        it('Not logged in이면 401을 반환한다', () => {
            const result = handleAdminAuth({
                authorized: false,
                userId: '',
                globalRole: GlobalRole.USER,
                error: 'Unauthorized: Not logged in',
            })

            expect(result).not.toBeNull()
            expect(result!.status).toBe(401)
        })

        it('권한 부족이면 403을 반환한다', () => {
            const result = handleAdminAuth({
                authorized: false,
                userId: 'user1',
                globalRole: GlobalRole.USER,
                error: 'Forbidden: Admin access required',
            })

            expect(result).not.toBeNull()
            expect(result!.status).toBe(403)
        })
    })

    describe('응답 헬퍼', () => {
        it('unauthorizedResponse는 401을 반환한다', () => {
            const response = unauthorizedResponse()
            expect(response.status).toBe(401)
        })

        it('forbiddenResponse는 403을 반환한다', () => {
            const response = forbiddenResponse()
            expect(response.status).toBe(403)
        })
    })
})
