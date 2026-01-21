import { NextResponse } from 'next/server'
import {
  requireSuperAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import { PLAN_CONFIGS, SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'

// 시스템 설정 조회 (SUPER_ADMIN 전용)
export async function GET() {
  const authResult = await requireSuperAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    // MVP 사용량 제한 설정
    const quotaLimits = {
      CAMPAIGN_CREATE: { count: 5, period: 'week', label: '캠페인 생성' },
      AI_COPY_GEN: { count: 20, period: 'day', label: 'AI 카피 생성' },
      AI_ANALYSIS: { count: 5, period: 'week', label: 'AI 분석' },
    }

    // 플랜별 설정
    const planConfigs = Object.entries(PLAN_CONFIGS).map(([key, config]) => ({
      plan: key,
      label: config.label,
      price: config.price,
      campaignsPerWeek: config.campaignsPerWeek,
      aiCopyPerDay: config.aiCopyPerDay,
      aiAnalysisPerWeek: config.aiAnalysisPerWeek,
      description: config.description,
    }))

    // 시스템 설정 (현재는 환경 변수 기반)
    const systemSettings = {
      maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
      trialDays: 14,
      maxTeamMembers: 10,
    }

    return NextResponse.json({
      quotaLimits,
      planConfigs,
      systemSettings,
    })
  } catch (error) {
    console.error('Admin settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}
