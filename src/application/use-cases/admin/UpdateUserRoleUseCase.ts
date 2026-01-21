import { IUserRepository } from '@domain/repositories/IUserRepository'
import { GlobalRole, canManageRole, isAdmin } from '@domain/value-objects/GlobalRole'

export interface UpdateUserRoleInput {
  adminUserId: string
  targetUserId: string
  newRole: GlobalRole
}

export interface UpdateUserRoleResult {
  success: boolean
  userId: string
  previousRole: GlobalRole
  newRole: GlobalRole
  message: string
}

export class UpdateUserRoleUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserRoleInput): Promise<UpdateUserRoleResult> {
    // Get admin user to verify permissions
    const adminUser = await this.userRepository.findById(input.adminUserId)
    if (!adminUser) {
      throw new Error('Admin user not found')
    }

    const adminRole = adminUser.globalRole as GlobalRole
    if (!isAdmin(adminRole)) {
      throw new Error('Unauthorized: Only admins can update user roles')
    }

    // Get target user
    const targetUser = await this.userRepository.findById(input.targetUserId)
    if (!targetUser) {
      throw new Error('Target user not found')
    }

    const previousRole = targetUser.globalRole as GlobalRole

    // Check if admin can manage this role change
    if (!canManageRole(adminRole, previousRole)) {
      throw new Error(`Unauthorized: Cannot manage users with role ${previousRole}`)
    }

    if (!canManageRole(adminRole, input.newRole)) {
      throw new Error(`Unauthorized: Cannot assign role ${input.newRole}`)
    }

    // Prevent demoting the last SUPER_ADMIN
    if (previousRole === GlobalRole.SUPER_ADMIN && input.newRole !== GlobalRole.SUPER_ADMIN) {
      const superAdminCount = await this.userRepository.countByRole(GlobalRole.SUPER_ADMIN)
      if (superAdminCount <= 1) {
        throw new Error('Cannot demote the last SUPER_ADMIN')
      }
    }

    // Update the role
    await this.userRepository.updateRole(input.targetUserId, input.newRole)

    return {
      success: true,
      userId: input.targetUserId,
      previousRole,
      newRole: input.newRole,
      message: `User role updated from ${previousRole} to ${input.newRole}`,
    }
  }
}
