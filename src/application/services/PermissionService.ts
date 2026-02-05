/**
 * PermissionService
 *
 * Implements permission checking using TeamRole domain entities.
 */

import { IPermissionService } from '../ports/IPermissionService'
import { Permission } from '@/domain/value-objects/Permission'
import { TeamRoleEntity, TeamRoleName } from '@/domain/entities/TeamRole'
import { PrismaClient } from '@/generated/prisma'

// Map database TeamRole enum to domain TeamRoleName
type DatabaseTeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

export class PermissionService implements IPermissionService {
  constructor(private readonly prisma: PrismaClient) {}

  async checkPermission(userId: string, teamId: string, permissionStr: string): Promise<boolean> {
    // 1. Get the team member record
    const teamMember = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    })

    if (!teamMember) return false

    // 2. Create TeamRole entity based on role
    const role = this.getRoleEntity(this.mapDatabaseRoleToTeamRoleName(teamMember.role))

    // 3. Parse permission string and check
    try {
      const permission = Permission.fromString(permissionStr)
      return role.hasPermission(permission)
    } catch {
      return false
    }
  }

  async getUserPermissions(userId: string, teamId: string): Promise<string[]> {
    const teamMember = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    })

    if (!teamMember) return []

    const role = this.getRoleEntity(this.mapDatabaseRoleToTeamRoleName(teamMember.role))
    return role.permissions.map(p => p.toString())
  }

  async getUserRole(userId: string, teamId: string): Promise<TeamRoleName | null> {
    const teamMember = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    })

    if (!teamMember) return null

    return this.mapDatabaseRoleToTeamRoleName(teamMember.role)
  }

  async canManageRole(userId: string, teamId: string, targetRole: TeamRoleName): Promise<boolean> {
    const userRole = await this.getUserRole(userId, teamId)
    if (!userRole) return false

    const userRoleEntity = this.getRoleEntity(userRole)
    const targetRoleEntity = this.getRoleEntity(targetRole)

    return userRoleEntity.canManageRole(targetRoleEntity)
  }

  private mapDatabaseRoleToTeamRoleName(dbRole: string): TeamRoleName {
    const role = dbRole as DatabaseTeamRole
    switch (role) {
      case 'OWNER':
        return 'owner'
      case 'ADMIN':
        return 'admin'
      case 'MEMBER':
        return 'editor' // Map MEMBER to editor
      case 'VIEWER':
        return 'viewer'
      default:
        return 'viewer' // Default to most restrictive role
    }
  }

  private getRoleEntity(roleName: TeamRoleName): TeamRoleEntity {
    switch (roleName) {
      case 'owner':
        return TeamRoleEntity.createOwner()
      case 'admin':
        return TeamRoleEntity.createAdmin()
      case 'editor':
        return TeamRoleEntity.createEditor()
      case 'viewer':
        return TeamRoleEntity.createViewer()
    }
  }
}
