import { describe, it, expect } from 'vitest'
import {
  GlobalRole,
  GLOBAL_ROLE_PERMISSIONS,
  isAdmin,
  isSuperAdmin,
  canAccessAdminPanel,
  canManageUsers,
  canManageAdmins,
  canProcessRefunds,
  canViewPayments,
  getRoleLabel,
  getRoleDescription,
  getAllGlobalRoles,
  ROLE_HIERARCHY,
  hasHigherOrEqualRole,
} from '@domain/value-objects/GlobalRole'

describe('GlobalRole', () => {
  describe('enum values', () => {
    it('should have USER role', () => {
      expect(GlobalRole.USER).toBe('USER')
    })

    it('should have ADMIN role', () => {
      expect(GlobalRole.ADMIN).toBe('ADMIN')
    })

    it('should have SUPER_ADMIN role', () => {
      expect(GlobalRole.SUPER_ADMIN).toBe('SUPER_ADMIN')
    })
  })

  describe('role hierarchy', () => {
    it('should have correct hierarchy values', () => {
      expect(ROLE_HIERARCHY[GlobalRole.USER]).toBe(0)
      expect(ROLE_HIERARCHY[GlobalRole.ADMIN]).toBe(1)
      expect(ROLE_HIERARCHY[GlobalRole.SUPER_ADMIN]).toBe(2)
    })

    it('should correctly compare roles with hasHigherOrEqualRole', () => {
      expect(hasHigherOrEqualRole(GlobalRole.SUPER_ADMIN, GlobalRole.ADMIN)).toBe(true)
      expect(hasHigherOrEqualRole(GlobalRole.ADMIN, GlobalRole.ADMIN)).toBe(true)
      expect(hasHigherOrEqualRole(GlobalRole.ADMIN, GlobalRole.USER)).toBe(true)
      expect(hasHigherOrEqualRole(GlobalRole.USER, GlobalRole.ADMIN)).toBe(false)
      expect(hasHigherOrEqualRole(GlobalRole.ADMIN, GlobalRole.SUPER_ADMIN)).toBe(false)
    })
  })

  describe('permissions', () => {
    it('should have correct permissions for USER role', () => {
      const permissions = GLOBAL_ROLE_PERMISSIONS[GlobalRole.USER]
      expect(permissions.canAccessAdminPanel).toBe(false)
      expect(permissions.canManageUsers).toBe(false)
      expect(permissions.canManageAdmins).toBe(false)
      expect(permissions.canProcessRefunds).toBe(false)
      expect(permissions.canViewPayments).toBe(false)
      expect(permissions.canViewAnalytics).toBe(false)
      expect(permissions.canManageSettings).toBe(false)
    })

    it('should have correct permissions for ADMIN role', () => {
      const permissions = GLOBAL_ROLE_PERMISSIONS[GlobalRole.ADMIN]
      expect(permissions.canAccessAdminPanel).toBe(true)
      expect(permissions.canManageUsers).toBe(true)
      expect(permissions.canManageAdmins).toBe(false)
      expect(permissions.canProcessRefunds).toBe(true)
      expect(permissions.canViewPayments).toBe(true)
      expect(permissions.canViewAnalytics).toBe(true)
      expect(permissions.canManageSettings).toBe(false)
    })

    it('should have correct permissions for SUPER_ADMIN role', () => {
      const permissions = GLOBAL_ROLE_PERMISSIONS[GlobalRole.SUPER_ADMIN]
      expect(permissions.canAccessAdminPanel).toBe(true)
      expect(permissions.canManageUsers).toBe(true)
      expect(permissions.canManageAdmins).toBe(true)
      expect(permissions.canProcessRefunds).toBe(true)
      expect(permissions.canViewPayments).toBe(true)
      expect(permissions.canViewAnalytics).toBe(true)
      expect(permissions.canManageSettings).toBe(true)
    })
  })

  describe('helper functions', () => {
    describe('isAdmin', () => {
      it('should return false for USER', () => {
        expect(isAdmin(GlobalRole.USER)).toBe(false)
      })

      it('should return true for ADMIN', () => {
        expect(isAdmin(GlobalRole.ADMIN)).toBe(true)
      })

      it('should return true for SUPER_ADMIN', () => {
        expect(isAdmin(GlobalRole.SUPER_ADMIN)).toBe(true)
      })
    })

    describe('isSuperAdmin', () => {
      it('should return false for USER', () => {
        expect(isSuperAdmin(GlobalRole.USER)).toBe(false)
      })

      it('should return false for ADMIN', () => {
        expect(isSuperAdmin(GlobalRole.ADMIN)).toBe(false)
      })

      it('should return true for SUPER_ADMIN', () => {
        expect(isSuperAdmin(GlobalRole.SUPER_ADMIN)).toBe(true)
      })
    })

    describe('canAccessAdminPanel', () => {
      it('should return false for USER', () => {
        expect(canAccessAdminPanel(GlobalRole.USER)).toBe(false)
      })

      it('should return true for ADMIN', () => {
        expect(canAccessAdminPanel(GlobalRole.ADMIN)).toBe(true)
      })

      it('should return true for SUPER_ADMIN', () => {
        expect(canAccessAdminPanel(GlobalRole.SUPER_ADMIN)).toBe(true)
      })
    })

    describe('canManageUsers', () => {
      it('should return false for USER', () => {
        expect(canManageUsers(GlobalRole.USER)).toBe(false)
      })

      it('should return true for ADMIN', () => {
        expect(canManageUsers(GlobalRole.ADMIN)).toBe(true)
      })

      it('should return true for SUPER_ADMIN', () => {
        expect(canManageUsers(GlobalRole.SUPER_ADMIN)).toBe(true)
      })
    })

    describe('canManageAdmins', () => {
      it('should return false for USER', () => {
        expect(canManageAdmins(GlobalRole.USER)).toBe(false)
      })

      it('should return false for ADMIN', () => {
        expect(canManageAdmins(GlobalRole.ADMIN)).toBe(false)
      })

      it('should return true for SUPER_ADMIN', () => {
        expect(canManageAdmins(GlobalRole.SUPER_ADMIN)).toBe(true)
      })
    })

    describe('canProcessRefunds', () => {
      it('should return false for USER', () => {
        expect(canProcessRefunds(GlobalRole.USER)).toBe(false)
      })

      it('should return true for ADMIN', () => {
        expect(canProcessRefunds(GlobalRole.ADMIN)).toBe(true)
      })

      it('should return true for SUPER_ADMIN', () => {
        expect(canProcessRefunds(GlobalRole.SUPER_ADMIN)).toBe(true)
      })
    })

    describe('canViewPayments', () => {
      it('should return false for USER', () => {
        expect(canViewPayments(GlobalRole.USER)).toBe(false)
      })

      it('should return true for ADMIN', () => {
        expect(canViewPayments(GlobalRole.ADMIN)).toBe(true)
      })

      it('should return true for SUPER_ADMIN', () => {
        expect(canViewPayments(GlobalRole.SUPER_ADMIN)).toBe(true)
      })
    })
  })

  describe('labels and descriptions', () => {
    describe('getRoleLabel', () => {
      it('should return correct label for USER', () => {
        expect(getRoleLabel(GlobalRole.USER)).toBe('일반 사용자')
      })

      it('should return correct label for ADMIN', () => {
        expect(getRoleLabel(GlobalRole.ADMIN)).toBe('관리자')
      })

      it('should return correct label for SUPER_ADMIN', () => {
        expect(getRoleLabel(GlobalRole.SUPER_ADMIN)).toBe('최고 관리자')
      })
    })

    describe('getRoleDescription', () => {
      it('should return correct description for USER', () => {
        expect(getRoleDescription(GlobalRole.USER)).toBe('일반 서비스 사용자')
      })

      it('should return correct description for ADMIN', () => {
        expect(getRoleDescription(GlobalRole.ADMIN)).toBe(
          '회원 관리, 결제/환불 처리, 분석 조회 권한'
        )
      })

      it('should return correct description for SUPER_ADMIN', () => {
        expect(getRoleDescription(GlobalRole.SUPER_ADMIN)).toBe(
          '모든 권한 (관리자 관리, 시스템 설정 포함)'
        )
      })
    })
  })

  describe('getAllGlobalRoles', () => {
    it('should return all global roles', () => {
      const roles = getAllGlobalRoles()
      expect(roles).toContain(GlobalRole.USER)
      expect(roles).toContain(GlobalRole.ADMIN)
      expect(roles).toContain(GlobalRole.SUPER_ADMIN)
      expect(roles.length).toBe(3)
    })
  })
})
