import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '초안',
  ACTIVE: '활성',
  PAUSED: '일시중지',
  COMPLETED: '완료',
  ARCHIVED: '보관됨',
}

const OBJECTIVE_LABELS: Record<string, string> = {
  OUTCOME_AWARENESS: '인지도',
  OUTCOME_TRAFFIC: '트래픽',
  OUTCOME_ENGAGEMENT: '참여',
  OUTCOME_LEADS: '리드',
  OUTCOME_APP_PROMOTION: '앱 프로모션',
  OUTCOME_SALES: '전환/매출',
}

const paramsSchema = z.object({
  campaignId: z.string().describe('조회할 캠페인 ID'),
})

type Params = z.infer<typeof paramsSchema>

export function createGetCampaignDetailTool(
  getCampaignUseCase: GetCampaignUseCase
): AgentTool<Params> {
  return {
    name: 'getCampaignDetail',
    description: '특정 캠페인의 상세 정보를 조회합니다. 캠페인 ID가 필요합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const campaign = await getCampaignUseCase.execute({
        campaignId: params.campaignId,
        userId: context.userId,
      })

      if (!campaign) {
        return {
          success: false,
          data: null,
          formattedMessage: '해당 캠페인을 찾을 수 없습니다.',
        }
      }

      const formattedMessage = [
        `📋 캠페인 상세:`,
        `- 이름: ${campaign.name}`,
        `- 상태: ${STATUS_LABELS[campaign.status] ?? campaign.status}`,
        `- 목적: ${OBJECTIVE_LABELS[campaign.objective] ?? campaign.objective}`,
        `- 일일 예산: ₩${campaign.dailyBudget.toLocaleString('ko-KR')}`,
        `- 시작일: ${campaign.startDate}`,
        campaign.endDate ? `- 종료일: ${campaign.endDate}` : null,
        campaign.metaCampaignId ? `- Meta 연동: 완료` : `- Meta 연동: 미연동`,
      ].filter(Boolean).join('\n')

      return { success: true, data: campaign, formattedMessage }
    },
  }
}
