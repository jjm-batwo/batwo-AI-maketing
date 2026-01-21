import { ISubscriptionRepository } from '@domain/repositories/ISubscriptionRepository'
import { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import { IUserRepository } from '@domain/repositories/IUserRepository'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { InvoiceStatus } from '@domain/value-objects/InvoiceStatus'
import {
  AdminDashboardDTO,
  UserStatsDTO,
  RevenueStatsDTO,
  SubscriptionStatsDTO,
  CampaignStatsDTO,
  RecentUserDTO,
  RecentPaymentDTO,
  PendingRefundDTO,
} from '@application/dto/admin/AdminDashboardDTO'

export interface GetAdminDashboardStatsInput {
  adminUserId: string
}

export class GetAdminDashboardStatsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly invoiceRepository: IInvoiceRepository,
    private readonly campaignRepository: ICampaignRepository
  ) {}

  async execute(_input: GetAdminDashboardStatsInput): Promise<AdminDashboardDTO> {
    const [
      userStats,
      subscriptionStats,
      paymentStats,
      campaignStats,
      recentUsers,
      recentPayments,
      pendingRefunds,
    ] = await Promise.all([
      this.getUserStats(),
      this.subscriptionRepository.getStats(),
      this.invoiceRepository.getPaymentStats(),
      this.getCampaignStats(),
      this.getRecentUsers(),
      this.getRecentPayments(),
      this.getPendingRefunds(),
    ])

    const revenueStats = this.calculateRevenueStats(paymentStats)

    return {
      userStats,
      revenueStats,
      subscriptionStats,
      campaignStats,
      recentUsers,
      recentPayments,
      pendingRefunds,
    }
  }

  private async getUserStats(): Promise<UserStatsDTO> {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [total, newThisWeek, activeThisMonth] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.countCreatedAfter(oneWeekAgo),
      this.userRepository.countActiveAfter(oneMonthAgo),
    ])

    return {
      total,
      newThisWeek,
      activeThisMonth,
    }
  }

  private calculateRevenueStats(paymentStats: {
    revenueThisMonth: number
    revenueLastMonth: number
  }): RevenueStatsDTO {
    const changePercent =
      paymentStats.revenueLastMonth > 0
        ? ((paymentStats.revenueThisMonth - paymentStats.revenueLastMonth) /
            paymentStats.revenueLastMonth) *
          100
        : paymentStats.revenueThisMonth > 0
          ? 100
          : 0

    return {
      thisMonth: paymentStats.revenueThisMonth,
      lastMonth: paymentStats.revenueLastMonth,
      changePercent: Math.round(changePercent * 10) / 10,
      currency: 'KRW',
    }
  }

  private async getCampaignStats(): Promise<CampaignStatsDTO> {
    const [total, active, paused, completed] = await Promise.all([
      this.campaignRepository.findByFilters({}, { page: 1, limit: 1 }).then((r) => r.total),
      this.campaignRepository
        .findByFilters({ status: CampaignStatus.ACTIVE }, { page: 1, limit: 1 })
        .then((r) => r.total),
      this.campaignRepository
        .findByFilters({ status: CampaignStatus.PAUSED }, { page: 1, limit: 1 })
        .then((r) => r.total),
      this.campaignRepository
        .findByFilters({ status: CampaignStatus.COMPLETED }, { page: 1, limit: 1 })
        .then((r) => r.total),
    ])

    return { total, active, paused, completed }
  }

  private async getRecentUsers(): Promise<RecentUserDTO[]> {
    const users = await this.userRepository.findRecent(5)
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name ?? null,
      createdAt: u.createdAt,
    }))
  }

  private async getRecentPayments(): Promise<RecentPaymentDTO[]> {
    const invoices = await this.invoiceRepository.findRecentPayments(5)
    return invoices.map((invoice) => ({
      id: invoice.id,
      userEmail: '', // Will be populated by infrastructure layer
      amount: invoice.amount.amount,
      currency: invoice.amount.currency,
      status: invoice.status,
      createdAt: invoice.createdAt,
    }))
  }

  private async getPendingRefunds(): Promise<PendingRefundDTO[]> {
    const invoices = await this.invoiceRepository.findByFilters(
      { status: [InvoiceStatus.PARTIALLY_REFUNDED] },
      { page: 1, limit: 10 }
    )
    return invoices.data.map((invoice) => ({
      id: invoice.id,
      userEmail: '', // Will be populated by infrastructure layer
      amount: invoice.remainingRefundableAmount().amount,
      currency: invoice.amount.currency,
      requestedAt: invoice.updatedAt,
    }))
  }
}
