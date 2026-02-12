import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'
import type { IAlertRepository } from '@domain/repositories/IAlertRepository'
import { Alert } from '@domain/entities/Alert'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

interface AlertCheckResult {
  created: number
  types: { anomaly: number; budget: number; milestone: number }
}

export class ProactiveAlertService {
  constructor(
    private readonly campaignRepo: ICampaignRepository,
    private readonly kpiRepo: IKPIRepository,
    private readonly alertRepo: IAlertRepository,
  ) {}

  /**
   * 모든 사용자의 캠페인을 체크하여 알림 생성
   * 크론에서 매 15분마다 호출
   */
  async checkForUser(userId: string): Promise<AlertCheckResult> {
    const result: AlertCheckResult = {
      created: 0,
      types: { anomaly: 0, budget: 0, milestone: 0 },
    }

    try {
      // 활성 캠페인 목록 조회
      const campaigns = await this.campaignRepo.findByUserId(userId)
      const activeCampaigns = campaigns.filter(
        (c) => c.status === CampaignStatus.ACTIVE
      )

      if (activeCampaigns.length === 0) return result

      const now = new Date()
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

      for (const campaign of activeCampaigns) {
        // 최근 KPI 조회
        const recentKPIs = await this.kpiRepo.findByCampaignIdAndDateRange(
          campaign.id,
          twoDaysAgo,
          now
        )

        if (recentKPIs.length < 2) continue

        // 가장 최근 2일치 분리
        const sorted = recentKPIs.sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        )
        const today = sorted[0]
        const prev = sorted[1]

        if (!today || !prev) continue

        // 1. 이상 감지: ROAS 30% 이상 하락
        const todayRoas = today.calculateROAS()
        const prevRoas = prev.calculateROAS()

        if (prevRoas > 0 && todayRoas > 0) {
          const roasChange = ((todayRoas - prevRoas) / prevRoas) * 100
          if (roasChange <= -30) {
            const alert = Alert.create({
              userId,
              type: 'anomaly',
              severity: 'WARNING',
              title: `${campaign.name} ROAS 급락`,
              message: `'${campaign.name}' ROAS가 전일 대비 ${Math.abs(roasChange).toFixed(1)}% 하락했습니다 (${prevRoas.toFixed(2)}x → ${todayRoas.toFixed(2)}x)`,
              data: {
                campaignId: campaign.id,
                campaignName: campaign.name,
                previousRoas: prevRoas,
                currentRoas: todayRoas,
                changePercent: roasChange,
              },
              campaignId: campaign.id,
            })
            await this.alertRepo.save(alert)
            result.types.anomaly++
            result.created++
          }
        }

        // 2. 이상 감지: 지출 급증 (50% 이상 증가)
        const todaySpend = today.spend.amount
        const prevSpend = prev.spend.amount

        if (prevSpend > 0 && todaySpend > 0) {
          const spendChange = ((todaySpend - prevSpend) / prevSpend) * 100
          if (spendChange >= 50) {
            const alert = Alert.create({
              userId,
              type: 'anomaly',
              severity: 'WARNING',
              title: `${campaign.name} 지출 급증`,
              message: `'${campaign.name}' 지출이 전일 대비 ${spendChange.toFixed(1)}% 증가했습니다 (₩${prevSpend.toLocaleString()} → ₩${todaySpend.toLocaleString()})`,
              data: {
                campaignId: campaign.id,
                campaignName: campaign.name,
                previousSpend: prevSpend,
                currentSpend: todaySpend,
                changePercent: spendChange,
              },
              campaignId: campaign.id,
            })
            await this.alertRepo.save(alert)
            result.types.anomaly++
            result.created++
          }
        }

        // 3. 예산 임계값: 일 예산의 90% 이상 소진
        const dailyBudget = campaign.dailyBudget.amount
        if (dailyBudget > 0) {
          const budgetUsage = (todaySpend / dailyBudget) * 100
          if (budgetUsage >= 90) {
            const alert = Alert.create({
              userId,
              type: 'budget',
              severity: budgetUsage >= 100 ? 'CRITICAL' : 'WARNING',
              title: `${campaign.name} 예산 ${budgetUsage >= 100 ? '초과' : '임박'}`,
              message: `'${campaign.name}' 일일 예산의 ${budgetUsage.toFixed(0)}%가 소진되었습니다 (₩${todaySpend.toLocaleString()} / ₩${dailyBudget.toLocaleString()})`,
              data: {
                campaignId: campaign.id,
                campaignName: campaign.name,
                dailyBudget: dailyBudget,
                spent: todaySpend,
                usagePercent: budgetUsage,
              },
              campaignId: campaign.id,
            })
            await this.alertRepo.save(alert)
            result.types.budget++
            result.created++
          }
        }

        // 4. 마일스톤: ROAS 3.0x 이상 달성
        if (todayRoas >= 3.0 && prevRoas < 3.0) {
          const alert = Alert.create({
            userId,
            type: 'milestone',
            severity: 'INFO',
            title: `${campaign.name} ROAS 3.0x 달성!`,
            message: `축하합니다! '${campaign.name}'이 ROAS ${todayRoas.toFixed(2)}x를 달성했습니다.`,
            data: {
              campaignId: campaign.id,
              campaignName: campaign.name,
              roas: todayRoas,
              milestone: 3.0,
            },
            campaignId: campaign.id,
          })
          await this.alertRepo.save(alert)
          result.types.milestone++
          result.created++
        }
      }
    } catch (error) {
      console.error('[ProactiveAlertService] checkForUser error:', error)
    }

    return result
  }
}
