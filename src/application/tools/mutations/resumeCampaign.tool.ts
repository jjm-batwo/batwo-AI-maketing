import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { ResumeCampaignUseCase } from '@application/use-cases/campaign/ResumeCampaignUseCase'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'

const paramsSchema = z.object({
  campaignId: z.string().describe('재개할 캠페인 ID'),
})

type Params = z.infer<typeof paramsSchema>

export function createResumeCampaignTool(
  resumeCampaignUseCase: ResumeCampaignUseCase,
  campaignRepository: ICampaignRepository
): AgentTool<Params> {
  return {
    name: 'resumeCampaign',
    description: '일시중지된 캠페인을 다시 활성화합니다. 캠페인 ID가 필요합니다.',
    parameters: paramsSchema,
    requiresConfirmation: true,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const result = await resumeCampaignUseCase.execute({
        campaignId: params.campaignId,
        userId: context.userId,
        syncToMeta: !!context.accessToken,
        accessToken: context.accessToken ?? undefined,
      })

      return {
        success: true,
        data: result,
        formattedMessage: `캠페인 '${result.name}'이(가) 다시 활성화되었습니다.`,
      }
    },

    async buildConfirmation(params: Params) {
      const campaign = await campaignRepository.findById(params.campaignId)

      return {
        summary: `캠페인 '${campaign?.name ?? params.campaignId}'을(를) 다시 활성화합니다`,
        details: [
          { label: '캠페인', value: campaign?.name ?? params.campaignId },
          { label: '현재 상태', value: campaign?.status ?? 'UNKNOWN' },
          { label: '변경 상태', value: '활성 (ACTIVE)', changed: true },
        ],
        warnings: ['캠페인 광고가 즉시 재개됩니다', '예산 소진이 다시 시작됩니다'],
      }
    },
  }
}
