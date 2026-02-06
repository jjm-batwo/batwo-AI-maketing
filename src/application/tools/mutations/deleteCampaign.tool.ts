import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { DeleteCampaignUseCase } from '@application/use-cases/campaign/DeleteCampaignUseCase'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'

const paramsSchema = z.object({
  campaignId: z.string().describe('삭제할 캠페인 ID'),
})

type Params = z.infer<typeof paramsSchema>

export function createDeleteCampaignTool(
  deleteCampaignUseCase: DeleteCampaignUseCase,
  campaignRepository: ICampaignRepository
): AgentTool<Params> {
  return {
    name: 'deleteCampaign',
    description: '캠페인을 삭제합니다. 이 작업은 되돌릴 수 없습니다. 캠페인 ID가 필요합니다.',
    parameters: paramsSchema,
    requiresConfirmation: true,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const campaign = await campaignRepository.findById(params.campaignId)
      const campaignName = campaign?.name ?? params.campaignId

      const result = await deleteCampaignUseCase.execute(params.campaignId, context.userId)

      if (!result.ok) {
        return {
          success: false,
          data: null,
          formattedMessage: `캠페인 삭제에 실패했습니다: ${result.error.message}`,
        }
      }

      return {
        success: true,
        data: { campaignId: params.campaignId },
        formattedMessage: `캠페인 '${campaignName}'이(가) 삭제되었습니다.`,
      }
    },

    async buildConfirmation(params: Params) {
      const campaign = await campaignRepository.findById(params.campaignId)

      return {
        summary: `캠페인 '${campaign?.name ?? params.campaignId}'을(를) 삭제합니다`,
        details: [
          { label: '캠페인', value: campaign?.name ?? params.campaignId },
          { label: '상태', value: campaign?.status ?? 'UNKNOWN' },
        ],
        warnings: [
          '이 작업은 되돌릴 수 없습니다',
          '캠페인의 모든 데이터가 삭제됩니다',
          'Meta 계정의 캠페인은 별도로 삭제해야 합니다',
        ],
      }
    },
  }
}
