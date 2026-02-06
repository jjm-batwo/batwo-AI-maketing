import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'

const paramsSchema = z.object({
  campaignId: z.string().optional().describe('특정 캠페인 ID (미지정 시 전체 캠페인 확인)'),
  metric: z.enum(['spend', 'ctr', 'roas', 'conversions', 'all']).default('all').describe('확인할 지표'),
})

type Params = z.infer<typeof paramsSchema>

export function createCheckAnomaliesTool(
  campaignRepository: ICampaignRepository,
  kpiRepository: IKPIRepository
): AgentTool<Params> {
  return {
    name: 'checkAnomalies',
    description: '캠페인 성과 지표에서 이상 징후를 감지합니다. 급격한 변화나 비정상적인 패턴을 찾아냅니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const campaigns = params.campaignId
        ? [await campaignRepository.findById(params.campaignId)].filter(Boolean)
        : await campaignRepository.findByUserId(context.userId)

      if (campaigns.length === 0) {
        return {
          success: true,
          data: { anomalies: [] },
          formattedMessage: '분석할 캠페인이 없습니다.',
        }
      }

      const now = new Date()
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const anomalies: { campaignName: string; metric: string; message: string; severity: string }[] = []

      for (const campaign of campaigns) {
        if (!campaign) continue

        const recentAgg = await kpiRepository.aggregateByCampaignId(campaign.id, threeDaysAgo, now)
        const previousAgg = await kpiRepository.aggregateByCampaignId(campaign.id, sevenDaysAgo, threeDaysAgo)

        // Check spend anomaly
        if (params.metric === 'all' || params.metric === 'spend') {
          if (previousAgg.totalSpend > 0) {
            const spendChangeRate = ((recentAgg.totalSpend - previousAgg.totalSpend) / previousAgg.totalSpend) * 100
            if (Math.abs(spendChangeRate) > 50) {
              anomalies.push({
                campaignName: campaign.name,
                metric: '지출',
                message: `지출이 ${spendChangeRate > 0 ? '급증' : '급감'}했습니다 (${spendChangeRate.toFixed(1)}%)`,
                severity: Math.abs(spendChangeRate) > 100 ? 'HIGH' : 'MEDIUM',
              })
            }
          }
        }

        // Check CTR anomaly
        if (params.metric === 'all' || params.metric === 'ctr') {
          const recentCtr = recentAgg.totalImpressions > 0
            ? (recentAgg.totalClicks / recentAgg.totalImpressions) * 100
            : 0
          const previousCtr = previousAgg.totalImpressions > 0
            ? (previousAgg.totalClicks / previousAgg.totalImpressions) * 100
            : 0
          if (previousCtr > 0 && Math.abs(recentCtr - previousCtr) / previousCtr > 0.3) {
            anomalies.push({
              campaignName: campaign.name,
              metric: 'CTR',
              message: `CTR이 ${recentCtr > previousCtr ? '상승' : '하락'}했습니다 (${previousCtr.toFixed(2)}% → ${recentCtr.toFixed(2)}%)`,
              severity: 'MEDIUM',
            })
          }
        }

        // Check ROAS anomaly
        if (params.metric === 'all' || params.metric === 'roas') {
          const recentRoas = recentAgg.totalSpend > 0 ? recentAgg.totalRevenue / recentAgg.totalSpend : 0
          const previousRoas = previousAgg.totalSpend > 0 ? previousAgg.totalRevenue / previousAgg.totalSpend : 0
          if (previousRoas > 0 && recentRoas < previousRoas * 0.7) {
            anomalies.push({
              campaignName: campaign.name,
              metric: 'ROAS',
              message: `ROAS가 크게 하락했습니다 (${previousRoas.toFixed(2)}x → ${recentRoas.toFixed(2)}x)`,
              severity: 'HIGH',
            })
          }
        }
      }

      if (anomalies.length === 0) {
        return {
          success: true,
          data: { anomalies: [] },
          formattedMessage: '현재 감지된 이상 징후가 없습니다. 모든 캠페인이 정상 범위 내에서 운영 중입니다.',
        }
      }

      const lines = anomalies.map((a) =>
        `- [${a.severity}] ${a.campaignName}: ${a.message}`
      )

      return {
        success: true,
        data: { anomalies },
        formattedMessage: `⚠️ ${anomalies.length}건의 이상 징후가 감지되었습니다:\n${lines.join('\n')}`,
      }
    },
  }
}
