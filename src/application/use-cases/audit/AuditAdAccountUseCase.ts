import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { AuditScore, CampaignAuditData } from '@domain/value-objects/AuditScore'
import { AuditRequestDTO, AuditReportDTO } from '@application/dto/audit/AuditDTO'
import { batchSettled } from '@/lib/utils/batchSettled'

/**
 * 광고 계정 무료 감사 유스케이스
 * Meta API에서 캠페인 데이터를 가져와 AuditScore로 평가 후 DTO로 반환한다.
 */
export class AuditAdAccountUseCase {
  constructor(private readonly metaAdsService: IMetaAdsService) {}

  async execute(dto: AuditRequestDTO): Promise<AuditReportDTO> {
    // currency 기본값 설정
    const currency = dto.currency ?? 'KRW'

    // 1. Meta API로 캠페인 목록 조회
    const { campaigns } = await this.metaAdsService.listCampaigns(
      dto.accessToken,
      dto.adAccountId,
      { limit: 100 }
    )

    if (campaigns.length === 0) {
      return this.emptyReport(currency)
    }

    // 2. 각 캠페인의 인사이트(최근 30일) 병렬 배치 조회 (배치 크기 5)
    const settledResults = await batchSettled(
      campaigns,
      (campaign) => this.metaAdsService.getCampaignInsights(
        dto.accessToken,
        campaign.id,
        'last_30d'
      ),
      5
    )

    // 3. fulfilled 결과만 CampaignAuditData로 변환 (rejected는 건너뜀)
    const campaignInsights: CampaignAuditData[] = []
    for (let i = 0; i < settledResults.length; i++) {
      const result = settledResults[i]
      if (result.status === 'rejected') continue
      const campaign = campaigns[i]
      const insights = result.value
      campaignInsights.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
        dailyBudget: campaign.dailyBudget ?? 0,
        currency,
        impressions: insights.impressions,
        clicks: insights.clicks,
        conversions: insights.conversions,
        spend: insights.spend,
        revenue: insights.revenue,
      })
    }

    if (campaignInsights.length === 0) {
      return this.emptyReport(currency)
    }

    // 4. AuditScore 평가
    const auditScore = AuditScore.evaluate(campaignInsights)

    // 5. DTO 변환
    const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length

    return {
      overall: auditScore.overall,
      grade: auditScore.grade,
      categories: auditScore.categories.map(cat => ({
        name: cat.name,
        score: cat.score,
        findings: cat.findings.map(f => ({ type: f.type, message: f.message })),
        recommendations: cat.recommendations.map(r => ({
          priority: r.priority,
          message: r.message,
          estimatedImpact: r.estimatedImpact,
        })),
      })),
      estimatedWaste: auditScore.estimatedWaste.toJSON(),
      estimatedImprovement: auditScore.estimatedImprovement.toJSON(),
      totalCampaigns: campaigns.length,
      activeCampaigns,
      analyzedAt: new Date().toISOString(),
    }
  }

  private emptyReport(currency: string): AuditReportDTO {
    return {
      overall: 0,
      grade: 'F',
      categories: [],
      estimatedWaste: { amount: 0, currency },
      estimatedImprovement: { amount: 0, currency },
      totalCampaigns: 0,
      activeCampaigns: 0,
      analyzedAt: new Date().toISOString(),
    }
  }
}
