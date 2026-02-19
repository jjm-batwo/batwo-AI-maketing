/**
 * KPI 기반 실시간 인사이트 서비스
 *
 * 실제 캠페인 KPI 데이터를 분석하여 시간 인지적, 액션 가능한 인사이트 생성
 */

import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'

// ============================================================================
// Types
// ============================================================================

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low'
export type InsightCategory = 'budget' | 'performance' | 'opportunity' | 'warning' | 'trend'

export interface ActionButton {
  label: string
  href: string
  variant: 'primary' | 'secondary' | 'warning'
}

export interface KPIInsight {
  id: string
  category: InsightCategory
  priority: InsightPriority
  title: string
  description: string
  metric?: string
  currentValue?: number
  comparisonValue?: number
  changePercent?: number
  timeContext?: string // "오늘 14시 기준", "지난 7일"
  action?: ActionButton
  campaignId?: string
  campaignName?: string
  createdAt: Date
}

export interface KPIInsightsResult {
  insights: KPIInsight[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
    total: number
  }
  generatedAt: Date
}

interface CampaignKPIData {
  campaignId: string
  campaignName: string
  dailyBudget: number
  todaySpend: number
  todayImpressions: number
  todayClicks: number
  todayConversions: number
  todayRevenue: number
  yesterdaySameHourSpend: number
  yesterdaySameHourImpressions: number
  yesterdaySameHourClicks: number
  yesterdayTotalSpend: number
  last7DaysAvgSpend: number
  last7DaysAvgClicks: number
  last7DaysAvgConversions: number
  last7DaysAvgRoas: number
  currentHour: number
  todayCTR: number
  todayROAS: number
  yesterdayCTR: number
  yesterdayROAS: number
}

// ============================================================================
// Service
// ============================================================================

export class KPIInsightsService {
  constructor(
    private readonly kpiRepository: IKPIRepository,
    private readonly campaignRepository: ICampaignRepository
  ) {}

  /**
   * 사용자의 모든 캠페인에 대한 KPI 인사이트 생성
   */
  async generateInsights(userId: string): Promise<KPIInsightsResult> {
    const insights: KPIInsight[] = []
    const now = new Date()
    const currentHour = now.getHours()

    // 활성 캠페인 조회
    const campaigns = await this.campaignRepository.findByUserId(userId)
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE')

    if (activeCampaigns.length === 0) {
      return this.createEmptyResult()
    }

    // 시간 범위 계산
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0))
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59))
    const yesterdayStart = new Date(todayStart)
    yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1)
    const yesterdayEnd = new Date(todayEnd)
    yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() - 1)
    const last7DaysStart = new Date(todayStart)
    last7DaysStart.setUTCDate(last7DaysStart.getUTCDate() - 7)

    // 배치 쿼리로 모든 캠페인의 KPI 데이터 한 번에 조회 (N+1 방지)
    const campaignIds = activeCampaigns.map(c => c.id)
    const [todayMap, yesterdayMap, last7DaysMap] = await Promise.all([
      this.kpiRepository.aggregateByCampaignIds(campaignIds, todayStart, todayEnd),
      this.kpiRepository.aggregateByCampaignIds(campaignIds, yesterdayStart, yesterdayEnd),
      this.kpiRepository.aggregateByCampaignIds(campaignIds, last7DaysStart, yesterdayEnd),
    ])

    // 각 캠페인별 인사이트 생성
    for (const campaign of activeCampaigns) {
      const kpiData = this.buildCampaignKPIData(
        campaign.id,
        campaign.name,
        campaign.dailyBudget.amount,
        currentHour,
        todayMap.get(campaign.id),
        yesterdayMap.get(campaign.id),
        last7DaysMap.get(campaign.id)
      )

      if (kpiData) {
        const campaignInsights = this.analyzeCampaignKPI(kpiData)
        insights.push(...campaignInsights)
      }
    }

    // 전체 포트폴리오 인사이트
    const portfolioInsights = await this.analyzePortfolio(userId, activeCampaigns.length)
    insights.push(...portfolioInsights)

    // 우선순위 정렬
    insights.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // 상위 10개만 반환
    const topInsights = insights.slice(0, 10)

    return {
      insights: topInsights,
      summary: {
        critical: topInsights.filter(i => i.priority === 'critical').length,
        high: topInsights.filter(i => i.priority === 'high').length,
        medium: topInsights.filter(i => i.priority === 'medium').length,
        low: topInsights.filter(i => i.priority === 'low').length,
        total: topInsights.length,
      },
      generatedAt: now,
    }
  }

  /**
   * 캠페인 KPI 데이터 구성 (프리페치된 배치 데이터 사용)
   */
  private buildCampaignKPIData(
    campaignId: string,
    campaignName: string,
    dailyBudget: number,
    currentHour: number,
    todayKPI?: {
      totalImpressions: number
      totalClicks: number
      totalLinkClicks: number
      totalConversions: number
      totalSpend: number
      totalRevenue: number
    },
    yesterdayKPI?: {
      totalImpressions: number
      totalClicks: number
      totalLinkClicks: number
      totalConversions: number
      totalSpend: number
      totalRevenue: number
    },
    last7DaysKPI?: {
      totalImpressions: number
      totalClicks: number
      totalLinkClicks: number
      totalConversions: number
      totalSpend: number
      totalRevenue: number
    }
  ): CampaignKPIData | null {
    // 기본값 처리: Map에 해당 캠페인이 없으면 모든 필드 0
    const today = todayKPI || {
      totalImpressions: 0,
      totalClicks: 0,
      totalLinkClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
    }

    const yesterday = yesterdayKPI || {
      totalImpressions: 0,
      totalClicks: 0,
      totalLinkClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
    }

    const last7Days = last7DaysKPI || {
      totalImpressions: 0,
      totalClicks: 0,
      totalLinkClicks: 0,
      totalConversions: 0,
      totalSpend: 0,
      totalRevenue: 0,
    }

    // 시간 비율 기반 어제 동시간 예상치 계산
    const hourRatio = currentHour / 24
    const yesterdaySameHourSpend = yesterday.totalSpend * hourRatio
    const yesterdaySameHourImpressions = yesterday.totalImpressions * hourRatio
    const yesterdaySameHourClicks = yesterday.totalClicks * hourRatio

    // CTR, ROAS 계산
    const todayCTR = today.totalImpressions > 0
      ? (today.totalClicks / today.totalImpressions) * 100
      : 0
    const todayROAS = today.totalSpend > 0
      ? today.totalRevenue / today.totalSpend
      : 0
    const yesterdayCTR = yesterday.totalImpressions > 0
      ? (yesterday.totalClicks / yesterday.totalImpressions) * 100
      : 0
    const yesterdayROAS = yesterday.totalSpend > 0
      ? yesterday.totalRevenue / yesterday.totalSpend
      : 0

    return {
      campaignId,
      campaignName,
      dailyBudget,
      todaySpend: today.totalSpend,
      todayImpressions: today.totalImpressions,
      todayClicks: today.totalClicks,
      todayConversions: today.totalConversions,
      todayRevenue: today.totalRevenue,
      yesterdaySameHourSpend,
      yesterdaySameHourImpressions,
      yesterdaySameHourClicks,
      yesterdayTotalSpend: yesterday.totalSpend,
      last7DaysAvgSpend: last7Days.totalSpend / 7,
      last7DaysAvgClicks: last7Days.totalClicks / 7,
      last7DaysAvgConversions: last7Days.totalConversions / 7,
      last7DaysAvgRoas: last7Days.totalSpend > 0 ? last7Days.totalRevenue / last7Days.totalSpend : 0,
      currentHour,
      todayCTR,
      todayROAS,
      yesterdayCTR,
      yesterdayROAS,
    }
  }

  /**
   * 캠페인 KPI 분석 및 인사이트 생성
   */
  private analyzeCampaignKPI(data: CampaignKPIData): KPIInsight[] {
    const insights: KPIInsight[] = []
    const now = new Date()
    const timeContext = `오늘 ${data.currentHour}시 기준`

    // 1. 예산 소진율 분석
    const budgetUsagePercent = data.dailyBudget > 0
      ? (data.todaySpend / data.dailyBudget) * 100
      : 0
    const expectedUsagePercent = (data.currentHour / 24) * 100
    const budgetPace = budgetUsagePercent - expectedUsagePercent

    if (budgetUsagePercent >= 90) {
      insights.push({
        id: `budget-depleting-${data.campaignId}`,
        category: 'budget',
        priority: 'critical',
        title: '예산 소진 임박',
        description: `${data.campaignName}의 일일 예산 ${budgetUsagePercent.toFixed(0)}% 소진. 오늘 남은 시간 동안 노출이 제한될 수 있습니다.`,
        metric: 'spend',
        currentValue: data.todaySpend,
        comparisonValue: data.dailyBudget,
        changePercent: budgetUsagePercent,
        timeContext,
        action: {
          label: '예산 증액',
          href: `/campaigns/${data.campaignId}/edit`,
          variant: 'warning',
        },
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        createdAt: now,
      })
    } else if (budgetPace > 20) {
      insights.push({
        id: `budget-fast-${data.campaignId}`,
        category: 'budget',
        priority: 'high',
        title: '예산 소진 속도 빠름',
        description: `${data.campaignName}의 예산 소진율이 예상보다 ${budgetPace.toFixed(0)}%p 빠릅니다. 성과가 좋다면 예산 증액을 고려하세요.`,
        metric: 'spend',
        currentValue: budgetUsagePercent,
        comparisonValue: expectedUsagePercent,
        changePercent: budgetPace,
        timeContext,
        action: {
          label: '예산 조정',
          href: `/campaigns/${data.campaignId}/edit`,
          variant: 'primary',
        },
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        createdAt: now,
      })
    } else if (budgetPace < -30 && data.currentHour >= 12) {
      insights.push({
        id: `budget-slow-${data.campaignId}`,
        category: 'warning',
        priority: 'medium',
        title: '예산 소진 부진',
        description: `${data.campaignName}의 예산이 예상보다 덜 소진되고 있습니다. 타겟팅 또는 입찰가 점검이 필요합니다.`,
        metric: 'spend',
        currentValue: budgetUsagePercent,
        comparisonValue: expectedUsagePercent,
        changePercent: budgetPace,
        timeContext,
        action: {
          label: '캠페인 점검',
          href: `/campaigns/${data.campaignId}/analytics`,
          variant: 'secondary',
        },
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        createdAt: now,
      })
    }

    // 2. 어제 동시간 대비 성과 분석
    if (data.yesterdaySameHourSpend > 0) {
      const spendChange = ((data.todaySpend - data.yesterdaySameHourSpend) / data.yesterdaySameHourSpend) * 100

      if (spendChange > 30) {
        insights.push({
          id: `spend-up-${data.campaignId}`,
          category: 'performance',
          priority: 'medium',
          title: '지출 증가 중',
          description: `${data.campaignName}의 ${timeContext} 지출이 어제 동시간 대비 +${spendChange.toFixed(0)}% 증가했습니다.`,
          metric: 'spend',
          currentValue: data.todaySpend,
          comparisonValue: data.yesterdaySameHourSpend,
          changePercent: spendChange,
          timeContext: '어제 동시간 대비',
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          createdAt: now,
        })
      }
    }

    // 3. CTR 분석
    if (data.yesterdayCTR > 0 && data.todayImpressions >= 100) {
      const ctrChange = data.todayCTR - data.yesterdayCTR

      if (ctrChange < -0.5) {
        insights.push({
          id: `ctr-drop-${data.campaignId}`,
          category: 'warning',
          priority: 'high',
          title: 'CTR 하락 감지',
          description: `${data.campaignName}의 CTR이 어제(${data.yesterdayCTR.toFixed(2)}%) 대비 ${data.todayCTR.toFixed(2)}%로 하락했습니다. 광고 소재 점검을 권장합니다.`,
          metric: 'ctr',
          currentValue: data.todayCTR,
          comparisonValue: data.yesterdayCTR,
          changePercent: (ctrChange / data.yesterdayCTR) * 100,
          timeContext,
          action: {
            label: '소재 분석',
            href: `/campaigns/${data.campaignId}/analytics`,
            variant: 'warning',
          },
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          createdAt: now,
        })
      } else if (ctrChange > 0.5) {
        insights.push({
          id: `ctr-up-${data.campaignId}`,
          category: 'opportunity',
          priority: 'low',
          title: 'CTR 상승 중',
          description: `${data.campaignName}의 CTR이 ${data.todayCTR.toFixed(2)}%로 어제 대비 개선되고 있습니다.`,
          metric: 'ctr',
          currentValue: data.todayCTR,
          comparisonValue: data.yesterdayCTR,
          changePercent: (ctrChange / data.yesterdayCTR) * 100,
          timeContext,
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          createdAt: now,
        })
      }
    }

    // 4. ROAS 분석
    if (data.todaySpend >= 1000 && data.last7DaysAvgRoas > 0) {
      const roasChange = data.todayROAS - data.last7DaysAvgRoas

      if (data.todayROAS < 1 && data.last7DaysAvgRoas >= 1) {
        insights.push({
          id: `roas-below-${data.campaignId}`,
          category: 'warning',
          priority: 'critical',
          title: 'ROAS 손익분기점 미달',
          description: `${data.campaignName}의 오늘 ROAS가 ${data.todayROAS.toFixed(2)}x로 손익분기점(1.0x) 미만입니다. 7일 평균 ${data.last7DaysAvgRoas.toFixed(2)}x 대비 하락.`,
          metric: 'roas',
          currentValue: data.todayROAS,
          comparisonValue: data.last7DaysAvgRoas,
          changePercent: (roasChange / data.last7DaysAvgRoas) * 100,
          timeContext: '7일 평균 대비',
          action: {
            label: '성과 분석',
            href: `/campaigns/${data.campaignId}/analytics`,
            variant: 'warning',
          },
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          createdAt: now,
        })
      } else if (data.todayROAS > data.last7DaysAvgRoas * 1.3) {
        insights.push({
          id: `roas-great-${data.campaignId}`,
          category: 'opportunity',
          priority: 'high',
          title: 'ROAS 우수 성과',
          description: `${data.campaignName}의 오늘 ROAS가 ${data.todayROAS.toFixed(2)}x로 7일 평균 대비 +${((roasChange / data.last7DaysAvgRoas) * 100).toFixed(0)}% 상승 중입니다. 예산 증액을 고려하세요.`,
          metric: 'roas',
          currentValue: data.todayROAS,
          comparisonValue: data.last7DaysAvgRoas,
          changePercent: (roasChange / data.last7DaysAvgRoas) * 100,
          timeContext: '7일 평균 대비',
          action: {
            label: '예산 증액',
            href: `/campaigns/${data.campaignId}/edit`,
            variant: 'primary',
          },
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          createdAt: now,
        })
      }
    }

    // 5. 전환 분석
    if (data.todayConversions > 0 && data.last7DaysAvgConversions > 0) {
      const conversionPace = (data.todayConversions / data.last7DaysAvgConversions) * 100 * (24 / data.currentHour)

      if (conversionPace > 150) {
        insights.push({
          id: `conversion-surge-${data.campaignId}`,
          category: 'opportunity',
          priority: 'high',
          title: '전환 급증',
          description: `${data.campaignName}의 전환이 평소보다 ${(conversionPace - 100).toFixed(0)}% 빠른 속도로 발생 중입니다.`,
          metric: 'conversions',
          currentValue: data.todayConversions,
          comparisonValue: data.last7DaysAvgConversions,
          changePercent: conversionPace - 100,
          timeContext,
          action: {
            label: '예산 증액',
            href: `/campaigns/${data.campaignId}/edit`,
            variant: 'primary',
          },
          campaignId: data.campaignId,
          campaignName: data.campaignName,
          createdAt: now,
        })
      }
    }

    return insights
  }

  /**
   * 전체 포트폴리오 분석
   */
  private async analyzePortfolio(userId: string, activeCampaignCount: number): Promise<KPIInsight[]> {
    const insights: KPIInsight[] = []
    const now = new Date()

    // 활성 캠페인이 없는 경우
    if (activeCampaignCount === 0) {
      insights.push({
        id: 'no-active-campaigns',
        category: 'warning',
        priority: 'high',
        title: '활성 캠페인 없음',
        description: '현재 진행 중인 캠페인이 없습니다. 새 캠페인을 시작하여 광고를 게재하세요.',
        action: {
          label: '캠페인 만들기',
          href: '/campaigns/new',
          variant: 'primary',
        },
        createdAt: now,
      })
    }

    return insights
  }

  /**
   * 빈 결과 반환
   */
  private createEmptyResult(): KPIInsightsResult {
    return {
      insights: [{
        id: 'no-data',
        category: 'warning',
        priority: 'medium',
        title: '데이터 수집 중',
        description: '캠페인 성과 데이터를 수집하고 있습니다. 동기화 후 인사이트가 표시됩니다.',
        action: {
          label: '동기화',
          href: '#sync',
          variant: 'primary',
        },
        createdAt: new Date(),
      }],
      summary: {
        critical: 0,
        high: 0,
        medium: 1,
        low: 0,
        total: 1,
      },
      generatedAt: new Date(),
    }
  }
}
