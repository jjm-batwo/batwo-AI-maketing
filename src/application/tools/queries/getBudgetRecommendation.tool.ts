import { z } from 'zod'
import type {
  AgentTool,
  AgentContext,
  ToolExecutionResult,
} from '@application/ports/IConversationalAgent'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IKPIRepository } from '@domain/repositories/IKPIRepository'

const paramsSchema = z.object({
  totalBudget: z.number().optional().describe('총 예산 (미지정 시 현재 총 예산 기준)'),
})

type Params = z.infer<typeof paramsSchema>

export function createGetBudgetRecommendationTool(
  campaignRepository: ICampaignRepository,
  kpiRepository: IKPIRepository
): AgentTool<Params> {
  return {
    name: 'getBudgetRecommendation',
    description:
      '캠페인별 예산 재분배를 추천합니다. ROAS 기반으로 효율적인 예산 배분을 제안합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const campaigns = await campaignRepository.findByUserId(context.userId)
      const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE')

      if (activeCampaigns.length === 0) {
        return {
          success: true,
          data: { recommendations: [] },
          formattedMessage: '활성 캠페인이 없어 예산 추천을 할 수 없습니다.',
        }
      }

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const campaignPerformance: {
        id: string
        name: string
        currentBudget: number
        roas: number
        spend: number
      }[] = []

      for (const campaign of activeCampaigns) {
        const agg = await kpiRepository.aggregateByCampaignId(campaign.id, weekAgo, now)
        const roas = agg.totalSpend > 0 ? agg.totalRevenue / agg.totalSpend : 0
        campaignPerformance.push({
          id: campaign.id,
          name: campaign.name,
          currentBudget: campaign.dailyBudget.amount,
          roas,
          spend: agg.totalSpend,
        })
      }

      const totalCurrentBudget =
        params.totalBudget ?? campaignPerformance.reduce((sum, c) => sum + c.currentBudget, 0)
      const totalRoas = campaignPerformance.reduce((sum, c) => sum + c.roas, 0)

      const recommendations = campaignPerformance
        .map((c) => {
          const roasWeight = totalRoas > 0 ? c.roas / totalRoas : 1 / campaignPerformance.length
          const recommendedBudget = Math.round(totalCurrentBudget * roasWeight)
          const change = recommendedBudget - c.currentBudget
          return {
            campaignId: c.id,
            campaignName: c.name,
            currentBudget: c.currentBudget,
            recommendedBudget,
            change,
            roas: c.roas,
          }
        })
        .sort((a, b) => b.roas - a.roas)

      const lines = recommendations.map((r) => {
        const changeStr =
          r.change >= 0
            ? `+₩${r.change.toLocaleString('ko-KR')}`
            : `-₩${Math.abs(r.change).toLocaleString('ko-KR')}`
        return `- ${r.campaignName}: ₩${r.currentBudget.toLocaleString('ko-KR')} → ₩${r.recommendedBudget.toLocaleString('ko-KR')} (${changeStr}) [ROAS: ${r.roas.toFixed(2)}x]`
      })

      const formattedMessage = [
        `💰 예산 재분배 추천 (총 예산: ₩${totalCurrentBudget.toLocaleString('ko-KR')}):`,
        ...lines,
        '',
        'ROAS가 높은 캠페인에 더 많은 예산을 배분하는 것을 권장합니다.',
      ].join('\n')

      return {
        success: true,
        data: { recommendations, totalBudget: totalCurrentBudget },
        formattedMessage,
      }
    },
  }
}
