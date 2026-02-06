import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { PauseCampaignUseCase } from '@application/use-cases/campaign/PauseCampaignUseCase'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'

const paramsSchema = z.object({
  campaignId: z.string().describe('일시중지할 캠페인 ID'),
})

type Params = z.infer<typeof paramsSchema>

export function createPauseCampaignTool(
  pauseCampaignUseCase: PauseCampaignUseCase,
  campaignRepository: ICampaignRepository
): AgentTool<Params> {
  return {
    name: 'pauseCampaign',
    description: '활성 캠페인을 일시중지합니다. 캠페인 ID가 필요합니다.',
    parameters: paramsSchema,
    requiresConfirmation: true,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const result = await pauseCampaignUseCase.execute({
        campaignId: params.campaignId,
        userId: context.userId,
        syncToMeta: !!context.accessToken,
        accessToken: context.accessToken ?? undefined,
      })

      return {
        success: true,
        data: result,
        formattedMessage: `캠페인 '${result.name}'이(가) 일시중지되었습니다.`,
      }
    },

    async buildConfirmation(params: Params) {
      const campaign = await campaignRepository.findById(params.campaignId)

      return {
        summary: `캠페인 '${campaign?.name ?? params.campaignId}'을(를) 일시중지합니다`,
        details: [
          { label: '캠페인', value: campaign?.name ?? params.campaignId },
          { label: '현재 상태', value: campaign?.status ?? 'UNKNOWN' },
          { label: '변경 상태', value: '일시중지 (PAUSED)', changed: true },
        ],
        warnings: ['캠페인 광고가 즉시 중단됩니다', 'Meta 계정에도 동시 반영됩니다'],
      }
    },
  }
}
