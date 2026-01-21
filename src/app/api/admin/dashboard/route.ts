import { NextResponse } from 'next/server'
import {
  requireAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import {
  getUserRepository,
  getSubscriptionRepository,
  getInvoiceRepository,
  getCampaignRepository,
} from '@/lib/di/container'
import { UserWithSubscription } from '@domain/repositories/IUserRepository'
import { Invoice } from '@domain/entities/Invoice'

export async function GET() {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const userRepository = getUserRepository()
    const subscriptionRepository = getSubscriptionRepository()
    const invoiceRepository = getInvoiceRepository()
    const campaignRepository = getCampaignRepository()

    // 날짜 기준
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // 병렬로 통계 조회
    const [
      totalUsers,
      newUsers,
      activeUsers,
      subscriptionStats,
      invoiceStats,
      recentUsers,
      recentPayments,
      pendingRefunds,
    ] = await Promise.all([
      userRepository.count(),
      userRepository.countCreatedAfter(sevenDaysAgo),
      userRepository.countActiveAfter(thirtyDaysAgo),
      subscriptionRepository.getStats(),
      invoiceRepository.getPaymentStats(),
      userRepository.findRecent(5),
      invoiceRepository.findRecentPayments(5),
      invoiceRepository.findPendingRefunds(),
    ])

    // 캠페인 통계 (전체)
    const allCampaigns = await campaignRepository.findByFilters({}, { page: 1, limit: 1000 })
    const activeCampaigns = allCampaigns.data.filter(c => c.status === 'ACTIVE').length
    const pausedCampaigns = allCampaigns.data.filter(c => c.status === 'PAUSED').length
    const completedCampaigns = allCampaigns.data.filter(c => c.status === 'COMPLETED').length

    return NextResponse.json({
      users: {
        total: totalUsers,
        new: newUsers,
        active: activeUsers,
      },
      subscriptions: subscriptionStats,
      payments: invoiceStats,
      campaigns: {
        total: allCampaigns.total,
        active: activeCampaigns,
        paused: pausedCampaigns,
        completed: completedCampaigns,
      },
      recent: {
        users: recentUsers.map((u: UserWithSubscription) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          subscription: u.subscription,
        })),
        payments: recentPayments.map((p: Invoice) => ({
          id: p.id,
          amount: p.amount.amount,
          currency: p.amount.currency,
          status: p.status,
          paidAt: p.paidAt,
        })),
      },
      pendingRefunds: {
        count: pendingRefunds.length,
        items: pendingRefunds.slice(0, 5).map((r: Invoice) => ({
          id: r.id,
          amount: r.amount.amount,
          currency: r.amount.currency,
          refundReason: r.refundReason,
          createdAt: r.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
