import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionService } from '@/application/services/PermissionService'
import { PrismaClient } from '@/generated/prisma'

describe('PermissionService', () => {
  let service: PermissionService
  let mockPrisma: {
    teamMember: {
      findUnique: ReturnType<typeof vi.fn>
    }
  }

  beforeEach(() => {
    mockPrisma = {
      teamMember: {
        findUnique: vi.fn(),
      },
    }

    service = new PermissionService(mockPrisma as unknown as PrismaClient)
  })

  describe('checkPermission', () => {
    it('should return true for valid permission', async () => {
      // Owner has campaign:create permission
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'OWNER',
        permissions: [],
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.checkPermission('user-1', 'team-1', 'campaign:create')

      expect(result).toBe(true)
      expect(mockPrisma.teamMember.findUnique).toHaveBeenCalledWith({
        where: { teamId_userId: { teamId: 'team-1', userId: 'user-1' } },
      })
    })

    it('should return false for invalid permission', async () => {
      // Viewer does not have campaign:create permission
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'VIEWER',
        permissions: [],
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.checkPermission('user-1', 'team-1', 'campaign:create')

      expect(result).toBe(false)
    })

    it('should return false for non-member', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue(null)

      const result = await service.checkPermission('user-1', 'team-1', 'campaign:create')

      expect(result).toBe(false)
    })

    it('should return false for invalid permission format', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'OWNER',
        permissions: [],
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.checkPermission('user-1', 'team-1', 'invalid-format')

      expect(result).toBe(false)
    })

    it('should handle MEMBER role as editor', async () => {
      // MEMBER (editor) has campaign:create permission
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'MEMBER',
        permissions: [],
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.checkPermission('user-1', 'team-1', 'campaign:create')

      expect(result).toBe(true)
    })
  })

  describe('getUserPermissions', () => {
    it('should return all permissions for role', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'VIEWER',
        permissions: [],
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.getUserPermissions('user-1', 'team-1')

      expect(result).toEqual([
        'dashboard:read',
        'campaign:read',
        'report:read',
      ])
    })

    it('should return empty array for non-member', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue(null)

      const result = await service.getUserPermissions('user-1', 'team-1')

      expect(result).toEqual([])
    })

    it('should return all owner permissions', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'OWNER',
        permissions: [],
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.getUserPermissions('user-1', 'team-1')

      // Owner has all permissions
      expect(result.length).toBeGreaterThan(10)
      expect(result).toContain('team:delete')
      expect(result).toContain('member:manage')
      expect(result).toContain('campaign:manage')
    })
  })

  describe('getUserRole', () => {
    it('should return correct role name in lowercase', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'OWNER',
        permissions: [],
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.getUserRole('user-1', 'team-1')

      expect(result).toBe('owner')
    })

    it('should return null for non-member', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue(null)

      const result = await service.getUserRole('user-1', 'team-1')

      expect(result).toBe(null)
    })

    it('should map MEMBER to editor', async () => {
      mockPrisma.teamMember.findUnique.mockResolvedValue({
        id: 'member-1',
        teamId: 'team-1',
        userId: 'user-1',
        email: 'user@example.com',
        role: 'MEMBER',
        permissions: [],
        invitedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await service.getUserRole('user-1', 'team-1')

      expect(result).toBe('editor')
    })
  })
})
