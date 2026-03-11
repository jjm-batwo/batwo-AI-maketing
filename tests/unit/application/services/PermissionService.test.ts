import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PermissionService } from '@/application/services/PermissionService'
import type { IPermissionRepository } from '@/domain/repositories/IPermissionRepository'

describe('PermissionService', () => {
  let service: PermissionService
  let mockRepository: {
    findTeamMember: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      findTeamMember: vi.fn(),
    }

    service = new PermissionService(mockRepository as IPermissionRepository)
  })

  describe('checkPermission', () => {
    it('should return true for valid permission', async () => {
      // Owner has campaign:create permission
      mockRepository.findTeamMember.mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-1',
        role: 'OWNER',
      })

      const result = await service.checkPermission('user-1', 'team-1', 'campaign:create')

      expect(result).toBe(true)
      expect(mockRepository.findTeamMember).toHaveBeenCalledWith('team-1', 'user-1')
    })

    it('should return false for invalid permission', async () => {
      // Viewer does not have campaign:create permission
      mockRepository.findTeamMember.mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-1',
        role: 'VIEWER',
      })

      const result = await service.checkPermission('user-1', 'team-1', 'campaign:create')

      expect(result).toBe(false)
    })

    it('should return false for non-member', async () => {
      mockRepository.findTeamMember.mockResolvedValue(null)

      const result = await service.checkPermission('user-1', 'team-1', 'campaign:create')

      expect(result).toBe(false)
    })

    it('should return false for invalid permission format', async () => {
      mockRepository.findTeamMember.mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-1',
        role: 'OWNER',
      })

      const result = await service.checkPermission('user-1', 'team-1', 'invalid-format')

      expect(result).toBe(false)
    })

    it('should handle MEMBER role as editor', async () => {
      // MEMBER (editor) has campaign:create permission
      mockRepository.findTeamMember.mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-1',
        role: 'MEMBER',
      })

      const result = await service.checkPermission('user-1', 'team-1', 'campaign:create')

      expect(result).toBe(true)
    })
  })

  describe('getUserPermissions', () => {
    it('should return all permissions for role', async () => {
      mockRepository.findTeamMember.mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-1',
        role: 'VIEWER',
      })

      const result = await service.getUserPermissions('user-1', 'team-1')

      expect(result).toEqual([
        'dashboard:read',
        'campaign:read',
        'report:read',
      ])
    })

    it('should return empty array for non-member', async () => {
      mockRepository.findTeamMember.mockResolvedValue(null)

      const result = await service.getUserPermissions('user-1', 'team-1')

      expect(result).toEqual([])
    })

    it('should return all owner permissions', async () => {
      mockRepository.findTeamMember.mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-1',
        role: 'OWNER',
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
      mockRepository.findTeamMember.mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-1',
        role: 'OWNER',
      })

      const result = await service.getUserRole('user-1', 'team-1')

      expect(result).toBe('owner')
    })

    it('should return null for non-member', async () => {
      mockRepository.findTeamMember.mockResolvedValue(null)

      const result = await service.getUserRole('user-1', 'team-1')

      expect(result).toBe(null)
    })

    it('should map MEMBER to editor', async () => {
      mockRepository.findTeamMember.mockResolvedValue({
        teamId: 'team-1',
        userId: 'user-1',
        role: 'MEMBER',
      })

      const result = await service.getUserRole('user-1', 'team-1')

      expect(result).toBe('editor')
    })
  })
})
