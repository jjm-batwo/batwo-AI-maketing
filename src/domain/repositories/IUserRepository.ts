import { GlobalRole } from '@domain/value-objects/GlobalRole'
import { SubscriptionPlan, SubscriptionStatus } from '@domain/value-objects'

export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  emailVerified: Date | null
  globalRole: GlobalRole
  createdAt: Date
  updatedAt: Date
}

export interface UserWithSubscription extends User {
  subscription: {
    id: string
    plan: SubscriptionPlan
    status: SubscriptionStatus
    currentPeriodEnd: Date
  } | null
}

export interface UserWithDetails extends UserWithSubscription {
  campaignCount: number
  totalSpend: number
  lastLoginAt: Date | null
}

export interface UserFullDetails extends User {
  subscription: {
    id: string
    plan: SubscriptionPlan
    status: SubscriptionStatus
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelledAt: Date | null
    createdAt: Date
  } | null
  teams: Array<{
    id: string
    name: string
    role: string
    joinedAt: Date
  }>
  campaigns: Array<{
    id: string
    name: string
    status: string
    createdAt: Date
  }>
  invoices: Array<{
    id: string
    amount: number
    currency: string
    status: string
    paidAt: Date | null
    createdAt: Date
  }>
  lastActiveAt: Date | null
}

export interface AdminUserFilters {
  search?: string
  globalRole?: GlobalRole
  subscriptionPlan?: SubscriptionPlan
  subscriptionStatus?: SubscriptionStatus
  createdAtFrom?: Date
  createdAtTo?: Date
  sortBy?: 'createdAt' | 'email' | 'name'
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface IUserRepository {
  // Basic CRUD
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>
  update(id: string, data: Partial<Omit<User, 'id' | 'createdAt'>>): Promise<User>
  delete(id: string): Promise<void>

  // Admin statistics
  count(): Promise<number>
  countCreatedAfter(date: Date): Promise<number>
  countActiveAfter(date: Date): Promise<number>

  // Admin queries
  findRecent(limit: number): Promise<UserWithSubscription[]>
  findForAdmin(
    filters: AdminUserFilters & { page: number; limit: number }
  ): Promise<PaginatedResult<UserWithDetails>>
  findByIdWithDetails(id: string): Promise<UserWithDetails | null>
  findByIdWithFullDetails(id: string): Promise<UserFullDetails | null>

  // Role management
  countByRole(role: GlobalRole): Promise<number>
  updateRole(userId: string, role: GlobalRole): Promise<void>
}
