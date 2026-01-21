import { Subscription } from '../entities/Subscription'
import { SubscriptionPlan } from '../value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '../value-objects/SubscriptionStatus'
import { PaginationOptions, PaginatedResult } from './ICampaignRepository'

export interface SubscriptionFilters {
  userId?: string
  plan?: SubscriptionPlan | SubscriptionPlan[]
  status?: SubscriptionStatus | SubscriptionStatus[]
  currentPeriodEndBefore?: Date
  currentPeriodEndAfter?: Date
}

export interface SubscriptionStats {
  total: number
  byPlan: Record<SubscriptionPlan, number>
  byStatus: Record<SubscriptionStatus, number>
  activeCount: number
  churnedThisMonth: number
}

export interface ISubscriptionRepository {
  save(subscription: Subscription): Promise<Subscription>
  findById(id: string): Promise<Subscription | null>
  findByUserId(userId: string): Promise<Subscription | null>
  findByFilters(
    filters: SubscriptionFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Subscription>>
  update(subscription: Subscription): Promise<Subscription>
  delete(id: string): Promise<void>
  getStats(): Promise<SubscriptionStats>
  findExpiringSoon(days: number): Promise<Subscription[]>
  findPastDue(): Promise<Subscription[]>
}
