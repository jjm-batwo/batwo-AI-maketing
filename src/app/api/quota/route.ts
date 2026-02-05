import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { QuotaService } from '@application/services/QuotaService'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const quotaService = container.resolve<QuotaService>(DI_TOKENS.QuotaService)
    const fullStatus = await quotaService.getFullQuotaStatus(user.id)
    const limits = quotaService.getQuotaLimits(fullStatus.plan)

    // Calculate reset dates
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const nextWeekStart = new Date(weekStart)
    nextWeekStart.setDate(weekStart.getDate() + 7)

    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const response = {
      usage: {
        campaigns: {
          used: fullStatus.quotas.CAMPAIGN_CREATE.used,
          limit: fullStatus.quotas.CAMPAIGN_CREATE.limit,
          remaining: fullStatus.quotas.CAMPAIGN_CREATE.remaining,
          period: fullStatus.quotas.CAMPAIGN_CREATE.period,
        },
        aiCopyGen: {
          used: fullStatus.quotas.AI_COPY_GEN.used,
          limit: fullStatus.quotas.AI_COPY_GEN.limit,
          remaining: fullStatus.quotas.AI_COPY_GEN.remaining,
          period: fullStatus.quotas.AI_COPY_GEN.period,
        },
        aiAnalysis: {
          used: fullStatus.quotas.AI_ANALYSIS.used,
          limit: fullStatus.quotas.AI_ANALYSIS.limit,
          remaining: fullStatus.quotas.AI_ANALYSIS.remaining,
          period: fullStatus.quotas.AI_ANALYSIS.period,
        },
      },
      plan: fullStatus.plan,
      trial: fullStatus.trial,
      resetDates: {
        weekly: nextWeekStart.toISOString().split('T')[0],
        daily: tomorrow.toISOString().split('T')[0],
      },
      limits,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to fetch quota:', error)
    return NextResponse.json(
      { message: 'Failed to fetch quota' },
      { status: 500 }
    )
  }
}
