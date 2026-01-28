/**
 * 트렌드 알림 Cron Job
 *
 * GET /api/cron/trend-alerts
 * - 매주 월요일 주간 마케팅 기회 요약 이메일 발송
 *
 * Vercel Cron 설정 (vercel.json):
 * {
 *   "path": "/api/cron/trend-alerts",
 *   "schedule": "0 0 * * 1"  // 매주 월요일 00:00 UTC (한국 시간 09:00)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { TrendAlertService } from '@/application/services/TrendAlertService'
import { getEmailService, getUserRepository } from '@/lib/di/container'
import { validateCronAuth } from '@/lib/middleware/cronAuth'

const trendAlertService = new TrendAlertService()

interface TrendAlertResult {
  userId: string
  email: string
  industry: string
  eventCount: number
  urgentCount: number
  sent: boolean
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    // Vercel Cron 요청 검증
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response
    }

    // 활성 캠페인이 있는 모든 사용자 조회 using repository
    const userRepository = getUserRepository()
    const usersWithCampaigns = await userRepository.findUsersWithActiveCampaigns()

    if (usersWithCampaigns.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users with active campaigns found',
        processed: 0,
      })
    }

    const emailService = getEmailService()
    const results: TrendAlertResult[] = []

    // 각 사용자에게 트렌드 알림 발송
    for (const user of usersWithCampaigns) {
      // FUTURE: User 모델에 industry 필드 추가 후 실제 업종 정보 사용
      const industry = 'ecommerce'

      try {
        // 주간 요약 생성
        const digest = trendAlertService.getWeeklyOpportunityDigest(user.id, industry)

        // 이메일 발송 (긴급 이벤트가 1개 이상일 때만)
        if (digest.weeklyDigest.urgentCount > 0 || digest.events.length > 0) {
          await emailService.sendTrendAlert({
            to: user.email,
            userName: user.name || '사용자',
            digest,
          })

          results.push({
            userId: user.id,
            email: user.email,
            industry,
            eventCount: digest.events.length,
            urgentCount: digest.weeklyDigest.urgentCount,
            sent: true,
          })
        } else {
          // 이벤트 없음 - 발송 스킵
          results.push({
            userId: user.id,
            email: user.email,
            industry,
            eventCount: 0,
            urgentCount: 0,
            sent: false,
          })
        }
      } catch (error) {
        console.error(`Failed to send trend alert to user ${user.id}:`, error)
        results.push({
          userId: user.id,
          email: user.email,
          industry,
          eventCount: 0,
          urgentCount: 0,
          sent: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const successCount = results.filter((r) => r.sent).length
    const errorCount = results.filter((r) => r.error).length

    return NextResponse.json({
      success: true,
      message: 'Weekly trend alerts processed',
      totalUsers: usersWithCampaigns.length,
      sentCount: successCount,
      skippedCount: results.length - successCount - errorCount,
      errorCount,
      results,
    })
  } catch (error) {
    console.error('Trend alert cron job failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Vercel Cron 설정
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 1분 타임아웃
