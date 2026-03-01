/**
 * KPI 기반 실시간 인사이트 API
 *
 * GET /api/ai/kpi-insights
 * - 사용자의 캠페인 KPI 데이터를 분석하여 실시간 인사이트 제공
 * - Meta API 라이브 데이터 우선 사용 (DB 폴백)
 */

import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import type { CampaignAggregate, LiveDataOverrides } from '@application/services/KPIInsightsService'
import { container, DI_TOKENS, getKPIInsightsService, getQuotaService } from '@/lib/di/container'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { prisma } from '@/lib/prisma'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

/**
 * Meta API에서 캠페인별 오늘/어제 라이브 데이터를 가져와
 * KPIInsightsService에 전달할 override 맵 생성
 */
async function fetchLiveOverrides(
  userId: string,
  campaignRepository: ICampaignRepository,
): Promise<LiveDataOverrides | undefined> {
  const metaAccount = await prisma.metaAdAccount.findUnique({
    where: { userId },
  })
  if (!metaAccount?.accessToken) return undefined

  try {
    const token = safeDecryptToken(metaAccount.accessToken)
    const metaService = container.resolve<IMetaAdsService>(DI_TOKENS.MetaAdsService)

    const campaigns = await campaignRepository.findByUserId(userId)
    const metaCampaigns = campaigns.filter(c => c.status === 'ACTIVE' && c.metaCampaignId)

    if (metaCampaigns.length === 0) return undefined

    // 오늘 + 어제 병렬 조회
    const [todayResults, yesterdayResults] = await Promise.all([
      Promise.allSettled(
        metaCampaigns.map(async c => {
          const data = await metaService.getCampaignDailyInsights(
            token, c.metaCampaignId!, 'today',
          )
          return { campaignId: c.id, data }
        }),
      ),
      Promise.allSettled(
        metaCampaigns.map(async c => {
          const data = await metaService.getCampaignDailyInsights(
            token, c.metaCampaignId!, 'yesterday',
          )
          return { campaignId: c.id, data }
        }),
      ),
    ])

    const buildMap = (
      results: PromiseSettledResult<{ campaignId: string; data: Array<{ impressions: number; clicks: number; conversions: number; spend: number; revenue: number; linkClicks: number }> }>[],
    ): Map<string, CampaignAggregate> => {
      const map = new Map<string, CampaignAggregate>()
      for (const result of results) {
        if (result.status !== 'fulfilled') continue
        const { campaignId, data } = result.value
        let totalImpressions = 0, totalClicks = 0, totalLinkClicks = 0
        let totalConversions = 0, totalSpend = 0, totalRevenue = 0
        for (const d of data) {
          totalImpressions += d.impressions
          totalClicks += d.clicks
          totalLinkClicks += d.linkClicks || 0
          totalConversions += d.conversions
          totalSpend += d.spend
          totalRevenue += d.revenue
        }
        map.set(campaignId, {
          totalImpressions, totalClicks, totalLinkClicks,
          totalConversions, totalSpend, totalRevenue,
        })
      }
      return map
    }

    return {
      todayMap: buildMap(todayResults),
      yesterdayMap: buildMap(yesterdayResults),
    }
  } catch (err) {
    console.warn('Failed to fetch live data for insights, falling back to DB:', err)
    return undefined
  }
}

export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    // 쿼터 확인 (캐시 히트 시에는 차감 없음 — LLM 호출 성공 후에만 logUsage)
    const quotaService = getQuotaService()
    const hasQuota = await quotaService.checkQuota(user.id, 'AI_KPI_INSIGHT')
    if (!hasQuota) {
      return NextResponse.json(
        { success: false, message: '오늘의 KPI 인사이트 분석 횟수를 초과했습니다' },
        { status: 429 },
      )
    }

    // DI에서 리포지토리 가져오기
    const campaignRepository = container.resolve<ICampaignRepository>(DI_TOKENS.CampaignRepository)

    // Meta API 라이브 데이터 가져오기 (실패 시 DB 폴백)
    const liveOverrides = await fetchLiveOverrides(user.id, campaignRepository)

    // DI 컨테이너에서 서비스 가져오기 (AI + 캐시 포함)
    const kpiInsightsService = getKPIInsightsService()

    // 인사이트 생성 (라이브 데이터 우선)
    const result = await kpiInsightsService.generateInsights(user.id, liveOverrides)

    // LLM 호출이 발생한 경우에만 사용량 기록
    // (캐시 히트 시 aiDescription이 존재하지 않을 수 있으나, 쿼터는 첫 생성 시에만 차감)
    const hasLLMResult = result.insights.some(i => i.aiDescription)
    if (hasLLMResult) {
      await quotaService.logUsage(user.id, 'AI_KPI_INSIGHT')
    }

    // 응답 형식 변환 (프론트엔드 호환)
    const response = {
      success: true,
      insights: result.insights.map(insight => ({
        id: insight.id,
        type: mapCategoryToType(insight.category),
        priority: insight.priority,
        title: insight.title,
        description: insight.description,
        aiDescription: insight.aiDescription,
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
      { status: 500 },
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
