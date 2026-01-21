import { GlobalRole } from '@domain/value-objects/GlobalRole'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'

export interface AdminUserDTO {
  id: string
  email: string
  name: string | null
  globalRole: GlobalRole
  subscription: {
    plan: SubscriptionPlan
    status: SubscriptionStatus
    currentPeriodEnd: Date
  } | null
  campaignCount: number
  totalSpend: number
  currency: string
  createdAt: Date
  lastLoginAt: Date | null
}

export interface UserListDTO {
  data: AdminUserDTO[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface UserDetailDTO extends AdminUserDTO {
  emailVerified: Date | null
  metaAccountConnected: boolean
  teams: {
    id: string
    name: string
    role: string
  }[]
  recentCampaigns: {
    id: string
    name: string
    status: string
    createdAt: Date
  }[]
  recentInvoices: {
    id: string
    amount: number
    status: string
    createdAt: Date
  }[]
}
