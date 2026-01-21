import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'

export interface UserStatsDTO {
  total: number
  newThisWeek: number
  activeThisMonth: number
}

export interface RevenueStatsDTO {
  thisMonth: number
  lastMonth: number
  changePercent: number
  currency: string
}

export interface SubscriptionStatsDTO {
  total: number
  byPlan: Record<SubscriptionPlan, number>
  byStatus: Record<SubscriptionStatus, number>
  activeCount: number
  churnedThisMonth: number
}

export interface CampaignStatsDTO {
  total: number
  active: number
  paused: number
  completed: number
}

export interface RecentUserDTO {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

export interface RecentPaymentDTO {
  id: string
  userEmail: string
  amount: number
  currency: string
  status: string
  createdAt: Date
}

export interface PendingRefundDTO {
  id: string
  userEmail: string
  amount: number
  currency: string
  requestedAt: Date
}

export interface AdminDashboardDTO {
  userStats: UserStatsDTO
  revenueStats: RevenueStatsDTO
  subscriptionStats: SubscriptionStatsDTO
  campaignStats: CampaignStatsDTO
  recentUsers: RecentUserDTO[]
  recentPayments: RecentPaymentDTO[]
  pendingRefunds: PendingRefundDTO[]
}
