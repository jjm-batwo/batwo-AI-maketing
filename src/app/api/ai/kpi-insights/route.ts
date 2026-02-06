/**
 * KPI 기반 실시간 인사이트 API
 *
 * GET /api/ai/kpi-insights
 * - 사용자의 캠페인 KPI 데이터를 분석하여 실시간 인사이트 제공
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { KPIInsightsService } from '@application/services/KPIInsightsService'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    // DI에서 리포지토리 가져오기
    const kpiRepository = container.resolve<IKPIRepository>(DI_TOKENS.KPIRepository)
    const campaignRepository = container.resolve<ICampaignRepository>(DI_TOKENS.CampaignRepository)

    // 서비스 인스턴스 생성
    const kpiInsightsService = new KPIInsightsService(kpiRepository, campaignRepository)

    // 인사이트 생성
    const result = await kpiInsightsService.generateInsights(user.id)

    // 응답 형식 변환 (프론트엔드 호환)
    const response = {
      success: true,
      insights: result.insights.map(insight => ({
        id: insight.id,
        type: mapCategoryToType(insight.category),
        priority: insight.priority,
        title: insight.title,
        description: insight.description,
        metric: insight.metric,
        currentValue: insight.currentValue,
        comparisonValue: insight.comparisonValue,
        changePercent: insight.changePercent,
        timeContext: insight.timeContext,
        action: insight.action,
        campaignId: insight.campaignId,
        campaignName: insight.campaignName,
      })),
      summary: result.summary,
      generatedAt: result.generatedAt.toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to generate KPI insights:', error)
    return NextResponse.json(
      { success: false, message: 'KPI 인사이트 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * 카테고리를 프론트엔드 타입으로 변환
 */
function mapCategoryToType(category: string): 'opportunity' | 'warning' | 'tip' | 'success' {
  switch (category) {
    case 'opportunity':
      return 'opportunity'
    case 'warning':
    case 'budget':
      return 'warning'
    case 'performance':
      return 'success'
    case 'trend':
      return 'tip'
    default:
      return 'tip'
  }
}
