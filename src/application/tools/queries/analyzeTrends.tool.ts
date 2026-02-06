import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'

const paramsSchema = z.object({
  period: z.enum(['7d', '14d', '30d']).default('7d').describe('분석 기간'),
  metric: z.enum(['spend', 'revenue', 'roas', 'ctr', 'conversions']).default('roas').describe('분석할 지표'),
})

type Params = z.infer<typeof paramsSchema>

const METRIC_LABELS: Record<string, string> = {
  spend: '지출',
  revenue: '매출',
  roas: 'ROAS',
  ctr: 'CTR',
  conversions: '전환수',
}

export function createAnalyzeTrendsTool(
  campaignRepository: ICampaignRepository,
  kpiRepository: IKPIRepository
): AgentTool<Params> {
  return {
    name: 'analyzeTrends',
    description: '캠페인 성과 추세를 분석합니다. 지정된 기간의 지표 변화를 확인합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const campaigns = await campaignRepository.findByUserId(context.userId)
      if (campaigns.length === 0) {
        return {
          success: true,
          data: { trends: [] },
          formattedMessage: '분석할 캠페인이 없습니다.',
        }
      }

      const periodDays = { '7d': 7, '14d': 14, '30d': 30 }[params.period]
      const now = new Date()
      const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
      const campaignIds = campaigns.map((c) => c.id)

      const dailyAggregates = await kpiRepository.getDailyAggregates(campaignIds, startDate, now)

      if (dailyAggregates.length === 0) {
        return {
          success: true,
          data: { trends: [] },
          formattedMessage: `최근 ${params.period} 동안의 데이터가 없습니다.`,
        }
      }

      // Calculate trend data per day
      const trendData = dailyAggregates.map((d) => {
        const roas = d.totalSpend > 0 ? d.totalRevenue / d.totalSpend : 0
        const ctr = d.totalImpressions > 0 ? (d.totalClicks / d.totalImpressions) * 100 : 0
        return {
          date: d.date.toISOString().split('T')[0],
          spend: d.totalSpend,
          revenue: d.totalRevenue,
          roas,
          ctr,
          conversions: d.totalConversions,
        }
      })

      // Calculate overall trend direction
      const metricKey = params.metric
      const values = trendData.map((d) => d[metricKey] as number)
      const firstHalf = values.slice(0, Math.floor(values.length / 2))
      const secondHalf = values.slice(Math.floor(values.length / 2))
      const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0
      const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0

      const trendDirection = secondAvg > firstAvg * 1.05 ? '상승' : secondAvg < firstAvg * 0.95 ? '하락' : '보합'
      const changeRate = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg * 100).toFixed(1) : '0'

      const formattedMessage = [
        `📈 최근 ${params.period} ${METRIC_LABELS[metricKey]} 추세 분석:`,
        `- 추세: ${trendDirection} (${changeRate}%)`,
        `- 전반기 평균: ${firstAvg.toFixed(2)}`,
        `- 후반기 평균: ${secondAvg.toFixed(2)}`,
        `- 데이터 포인트: ${trendData.length}일`,
      ].join('\n')

      return {
        success: true,
        data: { trendDirection, changeRate: Number(changeRate), trendData },
        formattedMessage,
      }
    },
  }
}
