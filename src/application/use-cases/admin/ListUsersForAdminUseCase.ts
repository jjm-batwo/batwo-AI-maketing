import { IUserRepository, UserWithDetails } from '@domain/repositories/IUserRepository'
import { GlobalRole } from '@domain/value-objects/GlobalRole'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'
import { UserListDTO, AdminUserDTO } from '@application/dto/admin/UserListDTO'

export interface ListUsersForAdminInput {
  adminUserId: string
  page?: number
  limit?: number
  search?: string
  globalRole?: GlobalRole
  subscriptionPlan?: SubscriptionPlan
  subscriptionStatus?: SubscriptionStatus
  sortBy?: 'createdAt' | 'email' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export type { UserWithDetails }

export class ListUsersForAdminUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(input: ListUsersForAdminInput): Promise<UserListDTO> {
    const page = input.page || 1
    const limit = input.limit || 20
    const sortBy = input.sortBy || 'createdAt'
    const sortOrder = input.sortOrder || 'desc'

    const result = await this.userRepository.findForAdmin({
      search: input.search,
      globalRole: input.globalRole,
      subscriptionPlan: input.subscriptionPlan,
      subscriptionStatus: input.subscriptionStatus,
      page,
      limit,
      sortBy,
      sortOrder,
    })

    const users: AdminUserDTO[] = result.data.map((user: UserWithDetails) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      globalRole: user.globalRole,
      subscription: user.subscription,
      campaignCount: user.campaignCount,
      totalSpend: user.totalSpend,
      currency: 'KRW',
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }))

    return {
      data: users,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }
  }
}
