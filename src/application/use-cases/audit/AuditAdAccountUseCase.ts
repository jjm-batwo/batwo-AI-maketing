import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { AuditScore, CampaignAuditData } from '@domain/value-objects/AuditScore'
import { AuditRequestDTO, AuditReportDTO } from '@application/dto/audit/AuditDTO'

/**
 * 광고 계정 무료 감사 유스케이스
 * Meta API에서 캠페인 데이터를 가져와 AuditScore로 평가 후 DTO로 반환한다.
 */
export class AuditAdAccountUseCase {
  constructor(private readonly metaAdsService: IMetaAdsService) {}

  async execute(dto: AuditRequestDTO): Promise<AuditReportDTO> {
    // 1. Meta API로 캠페인 목록 조회
    const { campaigns } = await this.metaAdsService.listCampaigns(
      dto.accessToken,
      dto.adAccountId,
      { limit: 100 }
    )

    if (campaigns.length === 0) {
      return this.emptyReport()
    }

    // 2. 각 캠페인의 인사이트(최근 30일) 조회
    const campaignInsights: CampaignAuditData[] = []
    for (const campaign of campaigns) {
      try {
        const insights = await this.metaAdsService.getCampaignInsights(
          dto.accessToken,
          campaign.id,
          'last_30d'
        )
        campaignInsights.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          status: campaign.status,
          dailyBudget: campaign.dailyBudget ?? 0,
          currency: 'KRW',
          impressions: insights.impressions,
          clicks: insights.clicks,
          conversions: insights.conversions,
          spend: insights.spend,
          revenue: insights.revenue,
        })
      } catch {
        // 개별 캠페인 인사이트 실패 시 건너뜀
        continue
      }
    }

    if (campaignInsights.length === 0) {
      return this.emptyReport()
    }

    // 3. AuditScore 평가
    const auditScore = AuditScore.evaluate(campaignInsights)

    // 4. DTO 변환
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

  private emptyReport(): AuditReportDTO {
    return {
      overall: 0,
      grade: 'F',
      categories: [],
      estimatedWaste: { amount: 0, currency: 'KRW' },
      estimatedImprovement: { amount: 0, currency: 'KRW' },
      totalCampaigns: 0,
      activeCampaigns: 0,
      analyzedAt: new Date().toISOString(),
    }
  }
}
