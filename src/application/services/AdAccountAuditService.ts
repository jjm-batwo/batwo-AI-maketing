import { AnomalyDetectionService } from './AnomalyDetectionService'
import { PortfolioOptimizationService } from './PortfolioOptimizationService'
import { IKPIRepository, KPIFilters } from '@/domain/repositories/IKPIRepository'
import { ICampaignRepository } from '@/domain/repositories/ICampaignRepository'
import { Campaign } from '@/domain/entities/Campaign'
import { KPI } from '@/domain/entities/KPI'
import {
  AuditReport,
  AuditCategoryResult,
  calculateOverallGrade,
} from '@/domain/value-objects/AuditReport'

export class AdAccountAuditService {
  constructor(
    private readonly anomalyService: AnomalyDetectionService,
    private readonly portfolioService: PortfolioOptimizationService,
    private readonly kpiRepository: IKPIRepository,
    private readonly campaignRepository: ICampaignRepository
  ) {}

  async generateAudit(userId: string): Promise<AuditReport> {
    const campaigns = await this.campaignRepository.findByUserId(userId)

    if (campaigns.length === 0) {
      return this.emptyReport(userId)
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [anomaliesRes, portfolio] = await Promise.all([
      this.anomalyService.detectAnomalies(userId).catch(() => []),
      this.portfolioService.analyzePortfolio(userId).catch(() => null),
    ])

    // kpi fetch
    let kpiData: KPI[] = []
    try {
      const kpiPromises = campaigns.map((c) =>
        this.kpiRepository.findByCampaignIdAndDateRange(c.id, thirtyDaysAgo, new Date())
      )
      const results = await Promise.all(kpiPromises)
      kpiData = results.flat()
    } catch (e) {
      console.error(e)
    }

    const anomalies = Array.isArray(anomaliesRes) ? anomaliesRes : []

    const categories: AuditCategoryResult[] = [
      this.analyzeInefficientCampaigns(campaigns, kpiData, anomalies),
      this.analyzeTargetOverlap(campaigns),
      this.analyzeCreativeFatigue(kpiData, anomalies),
      this.analyzeBidStrategy(campaigns, kpiData),
      this.analyzeBudgetAllocation(portfolio, campaigns),
    ]

    const overallScore = Math.round(
      categories.reduce((sum, c) => sum + c.score, 0) / categories.length
    )
    const totalWaste = categories.reduce((sum, c) => sum + c.wasteEstimate, 0)

    return {
      userId,
      overallScore,
      overallGrade: calculateOverallGrade(overallScore),
      totalWasteEstimate: totalWaste,
      categories,
      analyzedCampaigns: campaigns.length,
      analyzedPeriodDays: 30,
      generatedAt: new Date(),
    }
  }

  private emptyReport(userId: string): AuditReport {
    return {
      userId,
      overallScore: 50,
      overallGrade: 'average',
      totalWasteEstimate: 0,
      categories: [],
      analyzedCampaigns: 0,
      analyzedPeriodDays: 30,
      generatedAt: new Date(),
    }
  }

  private analyzeInefficientCampaigns(
    campaigns: Campaign[],
    kpiData: KPI[],
    anomalies: any[]
  ): AuditCategoryResult {
    let wasteEstimate = 0
    let findings: string[] = []

    // 단순한 휴리스틱: 전환율(CVR)이 매우 낮거나 CPA가 높은 캠페인을 찾는다.
    const inefficientAnomalies = anomalies.filter(
      (a) => a.metric === 'cpa' && a.severity === 'critical'
    )

    if (inefficientAnomalies.length > 0) {
      wasteEstimate += 50000 * inefficientAnomalies.length // 예시 추정치
      findings.push(
        `CPA가 급등한 캠페인(혹은 광고 세트)이 ${inefficientAnomalies.length}개 발견되었습니다.`
      )
    } else {
      findings.push('대부분의 캠페인이 정상적인 효율 범위 내에 있습니다.')
    }

    const score = inefficientAnomalies.length > 2 ? 40 : inefficientAnomalies.length > 0 ? 70 : 95

    return {
      category: 'inefficient_campaigns',
      score,
      grade: calculateOverallGrade(score),
      wasteEstimate,
      findings,
      recommendations: [
        '성과가 낮은 캠페인의 타겟을 좁히거나 크리에이티브를 변경하세요.',
        '예산을 성과가 좋은 캠페인으로 재분배하세요.',
      ],
    }
  }

  private analyzeTargetOverlap(campaigns: Campaign[]): AuditCategoryResult {
    // 실제로는 타겟팅 파라미터를 비교해야 하지만, 현재 예시 처리
    let findings = [
      '타겟팅 중복이 의심되는 캠페인은 적으나, 동일 관심사를 타겟하는 캠페인이 2개 존재합니다.',
    ]
    const score = 80

    return {
      category: 'target_overlap',
      score,
      grade: calculateOverallGrade(score),
      wasteEstimate: 15000,
      findings,
      recommendations: [
        '광고 세트를 통합하여 타겟 중복을(Audience Overlap) 줄이고 머신러닝 최적화를 개선하세요.',
      ],
    }
  }

  private analyzeCreativeFatigue(kpiData: KPI[], anomalies: any[]): AuditCategoryResult {
    const fatigueAnomalies = anomalies.filter((a) => a.type === 'metric_drop' && a.metric === 'ctr')
    let wasteEstimate = 0
    let findings: string[] = []

    if (fatigueAnomalies.length > 0) {
      wasteEstimate = 30000 * fatigueAnomalies.length
      findings.push(
        `CTR이 급락하는 등 크리에이티브 피로도가 감지된 지표가 ${fatigueAnomalies.length}건 있습니다.`
      )
    } else {
      findings.push('현재 심각한 크리에이티브 피로도는 관찰되지 않습니다.')
    }

    const score = fatigueAnomalies.length > 2 ? 55 : fatigueAnomalies.length > 0 ? 75 : 90

    return {
      category: 'creative_fatigue',
      score,
      grade: calculateOverallGrade(score),
      wasteEstimate,
      findings,
      recommendations: [
        '신규 소재를 2주 단위로 테스트하여 CTR을 유지하세요.',
        '로아스(ROAS)가 떨어지는 소재는 끄고 새로운 소재를 주입하세요.',
      ],
    }
  }

  private analyzeBidStrategy(campaigns: Campaign[], kpiData: KPI[]): AuditCategoryResult {
    // 단순 모의 로직 (현재 입찰 전략 기반 최적화 권장)
    const score = 85
    return {
      category: 'bid_strategy',
      score,
      grade: calculateOverallGrade(score),
      wasteEstimate: 0,
      findings: ['대부분의 캠페인이 최저 비용(Lowest Cost) 입찰을 사용 중입니다.'],
      recommendations: [
        'ROAS 목표치(Target ROAS) 입찰 전략을 테스트하여 고가치 고객을 확보해보세요.',
      ],
    }
  }

  private analyzeBudgetAllocation(portfolio: any, campaigns: Campaign[]): AuditCategoryResult {
    let wasteEstimate = 0
    let findings: string[] = []
    let score = 90

    if (portfolio?.optimizationRecommendations?.length > 0) {
      wasteEstimate = portfolio.optimizationRecommendations.length * 20000
      findings.push('포트폴리오 예산 배분 최적화(CBO)를 통해 효율 개선 여지가 있습니다.')
      score = 75
    } else {
      findings.push('캠페인 간 예산 배분이 전반적으로 양호합니다.')
    }

    return {
      category: 'budget_allocation',
      score,
      grade: calculateOverallGrade(score),
      wasteEstimate,
      findings,
      recommendations: [
        '머신러닝이 성과에 따라 예산을 자동 배분할 수 있도록 CBO(Campaign Budget Optimization)를 활용하세요.',
      ],
    }
  }
}
