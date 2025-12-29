import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { QuotaService } from '@application/services/QuotaService'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const quotaService = container.resolve<QuotaService>(DI_TOKENS.QuotaService)

    const quotaStatus = await quotaService.getRemainingQuota(user.id)
    const limits = quotaService.getQuotaLimits()

    // Calculate reset dates
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const nextWeekStart = new Date(weekStart)
    nextWeekStart.setDate(weekStart.getDate() + 7)

    const tomorrow = new Date(now)
    tomorrow.setDate(now.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    // Transform to API response format
    const response = {
      usage: {
        campaigns: {
          used: quotaStatus.CAMPAIGN_CREATE.used,
          limit: quotaStatus.CAMPAIGN_CREATE.limit,
          remaining: quotaStatus.CAMPAIGN_CREATE.remaining,
          period: quotaStatus.CAMPAIGN_CREATE.period,
        },
        aiCopyGen: {
          used: quotaStatus.AI_COPY_GEN.used,
          limit: quotaStatus.AI_COPY_GEN.limit,
          remaining: quotaStatus.AI_COPY_GEN.remaining,
          period: quotaStatus.AI_COPY_GEN.period,
        },
        aiAnalysis: {
          used: quotaStatus.AI_ANALYSIS.used,
          limit: quotaStatus.AI_ANALYSIS.limit,
          remaining: quotaStatus.AI_ANALYSIS.remaining,
          period: quotaStatus.AI_ANALYSIS.period,
        },
      },
      plan: 'FREE' as const,
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
