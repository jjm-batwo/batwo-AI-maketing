import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { AuditScore, CampaignAuditData } from '@domain/value-objects/AuditScore'
import { AuditRequestDTO, AuditReportDTO } from '@application/dto/audit/AuditDTO'

/**
 * 광고 계정 무료 감사 유스케이스
 * Meta API에서 캠페인 데이터를 가져와 AuditScore로 평가 후 DTO로 반환한다.
 *
 * 최적화: 개별 getCampaignInsights × N회 → getAccountInsights(level='campaign') 1회
 * API 호출: ~101회 → 2회 (98% 감소)
 */
export class AuditAdAccountUseCase {
  constructor(private readonly metaAdsService: IMetaAdsService) {}

  async execute(dto: AuditRequestDTO): Promise<AuditReportDTO> {
    // currency 기본값 설정
    const currency = dto.currency ?? 'KRW'

    // 1. Meta API로 캠페인 목록 조회 (1회)
    const { campaigns } = await this.metaAdsService.listCampaigns(
      dto.accessToken,
      dto.adAccountId,
      { limit: 100 }
    )

    if (campaigns.length === 0) {
      return this.emptyReport(currency)
    }

    // 2. 계정 레벨 인사이트 벌크 조회 (1회 — 기존 N회 대체)
    const campaignIds = campaigns.map((c) => c.id)
    const insightsMap = await this.metaAdsService.getAccountInsights(
      dto.accessToken,
      dto.adAccountId,
      {
        level: 'campaign',
        datePreset: 'last_30d',
        campaignIds,
      }
    )

    // 3. ID 기반 매핑으로 CampaignAuditData 생성
    const campaignInsights: CampaignAuditData[] = []
    for (const campaign of campaigns) {
      const insights = insightsMap.get(campaign.id)
      if (!insights) continue // insights 없으면 건너뜀

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
    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length

    return {
      overall: auditScore.overall,
      grade: auditScore.grade,
      categories: auditScore.categories.map((cat) => ({
        name: cat.name,
        score: cat.score,
        findings: cat.findings.map((f) => ({ type: f.type, message: f.message })),
        recommendations: cat.recommendations.map((r) => ({
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
