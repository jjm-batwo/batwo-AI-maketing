import { NextRequest, NextResponse } from 'next/server'
import {
  requireAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import { prisma } from '@/lib/prisma'
import { startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek, subWeeks, format, eachDayOfInterval } from 'date-fns'

// 서비스 분석 데이터 조회 (관리자용)
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // week, month, quarter

    const now = new Date()
    let startDate: Date
    let endDate: Date
    let previousStartDate: Date
    let previousEndDate: Date

    if (period === 'week') {
      startDate = startOfWeek(now, { weekStartsOn: 1 })
      endDate = endOfWeek(now, { weekStartsOn: 1 })
      previousStartDate = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
      previousEndDate = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 })
    } else if (period === 'quarter') {
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
      startDate = quarterStart
      endDate = now
      previousStartDate = subMonths(quarterStart, 3)
      previousEndDate = subMonths(now, 3)
    } else {
      // month (default)
      startDate = startOfMonth(now)
      endDate = endOfMonth(now)
      previousStartDate = startOfMonth(subMonths(now, 1))
      previousEndDate = endOfMonth(subMonths(now, 1))
    }

    // 사용자 통계
    const [totalUsers, newUsers, previousNewUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: { gte: previousStartDate, lte: previousEndDate },
        },
      }),
    ])

    // 구독 통계
    const [activeSubscriptions, subscriptionsByPlan] = await Promise.all([
      prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),
      prisma.subscription.groupBy({
        by: ['plan'],
        _count: { plan: true },
        where: { status: 'ACTIVE' },
      }),
    ])

    // 매출 통계
    const [currentRevenue, previousRevenue] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          paidAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: {
          status: 'PAID',
          paidAt: { gte: previousStartDate, lte: previousEndDate },
        },
      }),
    ])

    // 환불 통계
    const [refundAmount, refundCount] = await Promise.all([
      prisma.invoice.aggregate({
        _sum: { refundAmount: true },
        where: {
          status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
          refundedAt: { gte: startDate, lte: endDate },
        },
      }),
      prisma.invoice.count({
        where: {
          status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
          refundedAt: { gte: startDate, lte: endDate },
        },
      }),
    ])

    // 캠페인 통계
    const [totalCampaigns, activeCampaigns] = await Promise.all([
      prisma.campaign.count(),
      prisma.campaign.count({
        where: { status: 'ACTIVE' },
      }),
    ])

    // 일별 가입자 추이 (최근 14일)
    const twoWeeksAgo = subWeeks(now, 2)
    const dailySignups = await prisma.user.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      where: {
        createdAt: { gte: twoWeeksAgo },
      },
    })

    // 일별 데이터 형식화
    const days = eachDayOfInterval({ start: twoWeeksAgo, end: now })
    const signupsByDay = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const count = dailySignups.filter(
        (s) => format(new Date(s.createdAt), 'yyyy-MM-dd') === dayStr
      ).reduce((sum, s) => sum + s._count.id, 0)
      return {
        date: dayStr,
        label: format(day, 'MM/dd'),
        count,
      }
    })

    // 일별 매출 추이
    const dailyRevenue = await prisma.invoice.groupBy({
      by: ['paidAt'],
      _sum: { amount: true },
      where: {
        status: 'PAID',
        paidAt: { gte: twoWeeksAgo },
      },
    })

    const revenueByDay = days.map((day) => {
      const dayStr = format(day, 'yyyy-MM-dd')
      const sum = dailyRevenue.filter(
        (r) => r.paidAt && format(new Date(r.paidAt), 'yyyy-MM-dd') === dayStr
      ).reduce((total, r) => total + (r._sum.amount || 0), 0)
      return {
        date: dayStr,
        label: format(day, 'MM/dd'),
        amount: sum,
      }
    })

    // 플랜별 분포
    const planDistribution = subscriptionsByPlan.map((item) => ({
      plan: item.plan,
      count: item._count.plan,
    }))

    // 성장률 계산
    const revenueGrowth = previousRevenue._sum.amount
      ? ((currentRevenue._sum.amount || 0) - previousRevenue._sum.amount) / previousRevenue._sum.amount * 100
      : 0
    const userGrowth = previousNewUsers
      ? ((newUsers - previousNewUsers) / previousNewUsers) * 100
      : 0

    return NextResponse.json({
      period,
      users: {
        total: totalUsers,
        new: newUsers,
        growth: Math.round(userGrowth * 10) / 10,
      },
      subscriptions: {
        active: activeSubscriptions,
        planDistribution,
      },
      revenue: {
        current: currentRevenue._sum.amount || 0,
        previous: previousRevenue._sum.amount || 0,
        growth: Math.round(revenueGrowth * 10) / 10,
      },
      refunds: {
        amount: refundAmount._sum.refundAmount || 0,
        count: refundCount,
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
      },
      charts: {
        signups: signupsByDay,
        revenue: revenueByDay,
      },
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
