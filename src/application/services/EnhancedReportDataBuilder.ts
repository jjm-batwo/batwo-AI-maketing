import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IAdKPIRepository, DailyAdKPIAggregate, CreativeAggregate, FormatAggregate, CampaignAggregate } from '@domain/repositories/IAdKPIRepository'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IAIService } from '@application/ports/IAIService'
import { CreativeFatigueService } from './CreativeFatigueService'
import { FunnelClassificationService } from './FunnelClassificationService'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import type {
  EnhancedReportSections,
  ChangeRate,
  OverallSummarySection,
  DailyTrendSection,
  CampaignPerformanceSection,
  CreativePerformanceSection,
  CreativeFatigueSection,
  FormatComparisonSection,
  FunnelPerformanceSection,
  PerformanceAnalysisSection,
  RecommendationsSection,
  RecommendedAction,
} from '@application/dto/report/EnhancedReportSections'

interface BuildInput {
  campaignIds: string[]
  campaigns: Array<{
    id: string
    name: string
    objective: string
    status: string
    advantageConfig?: unknown
  }>
  startDate: Date
  endDate: Date
  previousStartDate: Date
  previousEndDate: Date
  reportType?: 'daily' | 'weekly' | 'monthly'
}

const FORMAT_LABELS: Record<string, string> = {
  SINGLE_IMAGE: '이미지',
  SINGLE_VIDEO: '동영상',
  CAROUSEL: '카루셀',
  REELS: '릴스',
}

const ACTION_CATEGORY_MAP: Record<string, RecommendedAction['category']> = {
  budget: 'budget',
  creative: 'creative',
  targeting: 'targeting',
  funnel: 'funnel',
  timing: 'general',
  general: 'general',
}

export class EnhancedReportDataBuilder {
  constructor(
    private readonly _kpiRepository: IKPIRepository,
    private readonly adKPIRepository: IAdKPIRepository,
    private readonly _campaignRepository: ICampaignRepository,
    private readonly fatigueService: CreativeFatigueService,
    private readonly funnelService: FunnelClassificationService,
    private readonly aiService: IAIService
  ) {}

  async build(input: BuildInput): Promise<EnhancedReportSections> {
    const { campaignIds, campaigns, startDate, endDate, previousStartDate, previousEndDate } = input

    // 1. DB 쿼리 병렬 실행 (B5)
    const [
      dailyAggregates,
      previousDailyAggregates,
      topCreatives,
      formatAggregates,
      campaignAggregates,
    ] = await Promise.all([
      this.adKPIRepository.getDailyAggregatesByCampaignIds(campaignIds, startDate, endDate),
      this.adKPIRepository.getDailyAggregatesByCampaignIds(campaignIds, previousStartDate, previousEndDate),
      this.adKPIRepository.getTopCreatives(campaignIds, startDate, endDate, 10, 'roas'),
      this.adKPIRepository.aggregateByFormat(campaignIds, startDate, endDate),
      this.adKPIRepository.aggregateByCampaignIds(campaignIds, startDate, endDate),
    ])

    // 2. 각 섹션 빌드
    const overallSummary = this.buildOverallSummary(dailyAggregates, previousDailyAggregates)
    const dailyTrend = this.buildDailyTrend(dailyAggregates)
    const campaignPerformance = this.buildCampaignPerformance(campaigns, campaignAggregates)
    const creativePerformance = this.buildCreativePerformance(topCreatives)
    const creativeFatigue = this.buildCreativeFatigue(topCreatives, startDate, endDate)
    const formatComparison = this.buildFormatComparison(formatAggregates)
    const funnelPerformance = this.buildFunnelPerformance(campaigns, campaignAggregates)

    // 2.5. 데이터 완전성 경고
    this.warnIfEmptyData(campaignPerformance, dailyTrend)

    // 3. AI 분석 (B6: 1회 호출로 통합, 최대 2회 재시도)
    const [performanceAnalysis, recommendations] = await this.buildAISections(
      overallSummary, campaignPerformance, input.reportType ?? 'weekly'
    )

    return {
      overallSummary,
      dailyTrend,
      campaignPerformance,
      creativePerformance,
      creativeFatigue,
      formatComparison,
      funnelPerformance,
      performanceAnalysis,
      recommendations,
    }
  }

  private buildOverallSummary(
    currentDaily: DailyAdKPIAggregate[],
    previousDaily: DailyAdKPIAggregate[]
  ): OverallSummarySection {
    const current = this.aggregateDaily(currentDaily)
    const previous = this.aggregateDaily(previousDaily)

    return {
      totalSpend: current.spend,
      totalRevenue: current.revenue,
      roas: current.spend > 0 ? current.revenue / current.spend : 0,
      ctr: current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0,
      totalConversions: current.conversions,
      changes: {
        spend: this.calculateChangeRate(previous.spend, current.spend, false),
        revenue: this.calculateChangeRate(previous.revenue, current.revenue, true),
        roas: this.calculateChangeRate(
          previous.spend > 0 ? previous.revenue / previous.spend : 0,
          current.spend > 0 ? current.revenue / current.spend : 0,
          true
        ),
        ctr: this.calculateChangeRate(
          previous.impressions > 0 ? (previous.clicks / previous.impressions) * 100 : 0,
          current.impressions > 0 ? (current.clicks / current.impressions) * 100 : 0,
          true
        ),
        conversions: this.calculateChangeRate(previous.conversions, current.conversions, true),
      },
    }
  }

  private calculateChangeRate(
    previous: number,
    current: number,
    isPositive: boolean
  ): ChangeRate {
    if (previous === 0 && current === 0) {
      return { value: 0, direction: 'flat', isPositive }
    }
    if (previous === 0) {
      return { value: 100, direction: 'up', isPositive }
    }

    const value = ((current - previous) / previous) * 100
    const direction = Math.abs(value) < 0.1 ? 'flat' : value > 0 ? 'up' : 'down'

    return { value: Math.round(value * 10) / 10, direction, isPositive }
  }

  private aggregateDaily(daily: DailyAdKPIAggregate[]) {
    return daily.reduce(
      (acc, d) => ({
        spend: acc.spend + d.totalSpend,
        revenue: acc.revenue + d.totalRevenue,
        impressions: acc.impressions + d.totalImpressions,
        clicks: acc.clicks + d.totalClicks,
        conversions: acc.conversions + d.totalConversions,
      }),
      { spend: 0, revenue: 0, impressions: 0, clicks: 0, conversions: 0 }
    )
  }

  private buildDailyTrend(dailyAggregates: DailyAdKPIAggregate[]): DailyTrendSection {
    return {
      days: dailyAggregates.map(d => ({
        date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : String(d.date),
        spend: d.totalSpend,
        revenue: d.totalRevenue,
        roas: d.totalSpend > 0 ? d.totalRevenue / d.totalSpend : 0,
        impressions: d.totalImpressions,
        clicks: d.totalClicks,
        conversions: d.totalConversions,
      })),
    }
  }

  private buildCampaignPerformance(
    campaigns: BuildInput['campaigns'],
    aggregates: CampaignAggregate[]
  ): CampaignPerformanceSection {
    const aggregateMap = new Map(aggregates.map(a => [a.campaignId, a]))

    return {
      campaigns: campaigns.map(c => {
        const agg = aggregateMap.get(c.id)
        const impressions = agg?.totalImpressions ?? 0
        const clicks = agg?.totalClicks ?? 0
        const conversions = agg?.totalConversions ?? 0
        const spend = agg?.totalSpend ?? 0
        const revenue = agg?.totalRevenue ?? 0

        return {
          campaignId: c.id,
          name: c.name,
          objective: c.objective,
          status: c.status,
          impressions,
          clicks,
          conversions,
          spend,
          revenue,
          roas: spend > 0 ? revenue / spend : 0,
          ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        }
      }),
    }
  }

  private buildCreativePerformance(topCreatives: CreativeAggregate[]): CreativePerformanceSection {
    return {
      topN: 10,
      creatives: topCreatives.map(c => ({
        creativeId: c.creativeId,
        name: c.name,
        format: c.format,
        impressions: c.totalImpressions,
        clicks: c.totalClicks,
        conversions: c.totalConversions,
        spend: c.totalSpend,
        revenue: c.totalRevenue,
        roas: c.totalSpend > 0 ? c.totalRevenue / c.totalSpend : 0,
        ctr: c.totalImpressions > 0 ? (c.totalClicks / c.totalImpressions) * 100 : 0,
      })),
    }
  }

  private buildCreativeFatigue(
    topCreatives: CreativeAggregate[],
    startDate: Date,
    endDate: Date
  ): CreativeFatigueSection {
    const activeDays = Math.max(1, Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ))

    return {
      creatives: topCreatives
        .filter(c => c.avgFrequency > 0)
        .map(c => {
          const initialCtr = c.totalImpressions > 0 ? (c.totalClicks / c.totalImpressions) * 100 : 0
          const currentCtr = initialCtr
          const score = this.fatigueService.calculateFatigueScore({
            frequency: c.avgFrequency,
            currentCtr,
            initialCtr,
            activeDays,
          })
          const level = this.fatigueService.getFatigueLevel(score)

          return {
            creativeId: c.creativeId,
            name: c.name,
            format: c.format,
            frequency: c.avgFrequency,
            ctr: currentCtr,
            ctrTrend: [],
            fatigueScore: score,
            fatigueLevel: level,
            activeDays,
            recommendation: level === 'critical'
              ? '즉시 소재 교체 권장'
              : level === 'warning'
                ? '1주 내 교체 검토 필요'
                : '양호. 현재 소재 유지.',
          }
        }),
    }
  }

  private buildFormatComparison(formatAggregates: FormatAggregate[]): FormatComparisonSection {
    return {
      formats: formatAggregates.map(f => ({
        format: f.format,
        formatLabel: FORMAT_LABELS[f.format] ?? f.format,
        adCount: f.adCount,
        impressions: f.totalImpressions,
        clicks: f.totalClicks,
        conversions: f.totalConversions,
        spend: f.totalSpend,
        revenue: f.totalRevenue,
        roas: f.totalSpend > 0 ? f.totalRevenue / f.totalSpend : 0,
        ctr: f.totalImpressions > 0 ? (f.totalClicks / f.totalImpressions) * 100 : 0,
        avgFrequency: f.avgFrequency,
      })),
    }
  }

  private buildFunnelPerformance(
    campaigns: BuildInput['campaigns'],
    aggregates: CampaignAggregate[]
  ): FunnelPerformanceSection {
    const aggregateMap = new Map(aggregates.map(a => [a.campaignId, a]))

    const stageMap = new Map<string, {
      campaignCount: number
      spend: number
      impressions: number
      clicks: number
      conversions: number
      revenue: number
    }>()

    for (const c of campaigns) {
      const objective = c.objective as CampaignObjective
      const stage = this.funnelService.classifyWithAdvantage(
        objective,
        !!c.advantageConfig
      )
      const agg = aggregateMap.get(c.id)
      const existing = stageMap.get(stage) ?? {
        campaignCount: 0, spend: 0, impressions: 0, clicks: 0, conversions: 0, revenue: 0,
      }
      existing.campaignCount += 1
      existing.spend += agg?.totalSpend ?? 0
      existing.impressions += agg?.totalImpressions ?? 0
      existing.clicks += agg?.totalClicks ?? 0
      existing.conversions += agg?.totalConversions ?? 0
      existing.revenue += agg?.totalRevenue ?? 0
      stageMap.set(stage, existing)
    }

    const totalBudget = Array.from(stageMap.values()).reduce((sum, s) => sum + s.spend, 0)

    return {
      stages: Array.from(stageMap.entries()).map(([stage, data]) => ({
        stage: stage as 'tofu' | 'mofu' | 'bofu' | 'auto',
        stageLabel: this.funnelService.getStageLabel(stage as 'tofu' | 'mofu' | 'bofu' | 'auto'),
        campaignCount: data.campaignCount,
        spend: data.spend,
        budgetRatio: totalBudget > 0 ? (data.spend / totalBudget) * 100 : 0,
        impressions: data.impressions,
        clicks: data.clicks,
        conversions: data.conversions,
        revenue: data.revenue,
        roas: data.spend > 0 ? data.revenue / data.spend : 0,
        ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      })),
      totalBudget,
    }
  }

  private async buildAISections(
    overallSummary: OverallSummarySection,
    campaignPerformance: CampaignPerformanceSection,
    reportType: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<[PerformanceAnalysisSection, RecommendationsSection]> {
    const maxRetries = 2
    let lastError: unknown

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const campaignSummaries = campaignPerformance.campaigns.map(c => ({
          name: c.name,
          objective: c.objective ?? 'CONVERSIONS',
          metrics: {
            impressions: c.impressions ?? 0,
            clicks: c.clicks ?? 0,
            conversions: c.conversions ?? 0,
            spend: c.spend ?? 0,
            revenue: c.revenue ?? 0,
          },
        }))

        const result = await this.aiService.generateReportInsights({
          reportType,
          campaignSummaries,
          includeExtendedInsights: true,
          includeForecast: false,
          includeBenchmark: false,
          comparisonPeriod: overallSummary.changes ? {
            previousMetrics: {
              impressions: 0,
              clicks: 0,
              conversions: 0,
              spend: overallSummary.totalSpend / (1 + (overallSummary.changes.spend.value / 100)),
              revenue: overallSummary.totalRevenue / (1 + (overallSummary.changes.revenue.value / 100)),
            },
          } : undefined,
        })

        const insights = result.insights ?? []
        const mapImpact = (importance: string): 'high' | 'medium' | 'low' =>
          importance === 'critical' ? 'high' : (importance as 'high' | 'medium' | 'low')

        return [
          {
            summary: result.summary,
            positiveFactors: insights
              .filter(i => i.type === 'performance' || i.type === 'trend' || i.type === 'comparison')
              .map(i => ({ title: i.title, description: i.description, impact: mapImpact(i.importance) })),
            negativeFactors: insights
              .filter(i => i.type === 'anomaly' || i.type === 'recommendation')
              .map(i => ({ title: i.title, description: i.description, impact: mapImpact(i.importance) })),
          },
          {
            actions: (result.actionItems ?? []).map(item => ({
              priority: item.priority,
              category: ACTION_CATEGORY_MAP[item.category] ?? 'general',
              title: item.action,
              description: item.action,
              expectedImpact: item.expectedImpact,
              deadline: item.deadline,
            })),
          },
        ]
      } catch (error) {
        lastError = error
        if (attempt < maxRetries) {
          console.warn(`[EnhancedReportDataBuilder] AI attempt ${attempt} failed, retrying...`)
        }
      }
    }

    console.error('[EnhancedReportDataBuilder] AI analysis failed after retries:', lastError)
    return [
      { summary: 'AI 분석을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.', positiveFactors: [], negativeFactors: [] },
      { actions: [] },
    ]
  }

  private warnIfEmptyData(
    campaignPerformance: CampaignPerformanceSection,
    dailyTrend: DailyTrendSection
  ): void {
    const allZeroMetrics = campaignPerformance.campaigns.every(
      c => c.impressions === 0 && c.spend === 0
    )
    if (allZeroMetrics && campaignPerformance.campaigns.length > 0) {
      console.warn(
        '[EnhancedReportDataBuilder] 모든 캠페인 지표가 0입니다. AdKPISnapshot 동기화 상태를 확인하세요.',
        { campaignIds: campaignPerformance.campaigns.map(c => c.campaignId) }
      )
    }

    if (dailyTrend.days.length === 0) {
      console.warn('[EnhancedReportDataBuilder] 일별 데이터가 없습니다.')
    }
  }
}
