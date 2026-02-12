import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { UpdateCampaignUseCase } from '@application/use-cases/campaign/UpdateCampaignUseCase'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'

const paramsSchema = z.object({
  campaignId: z.string().describe('수정할 캠페인 ID'),
  dailyBudget: z.number().min(5000).describe('새로운 일일 예산 (원)'),
  name: z.string().optional().describe('변경할 캠페인 이름'),
})

type Params = z.infer<typeof paramsSchema>

export function createUpdateCampaignBudgetTool(
  updateCampaignUseCase: UpdateCampaignUseCase,
  campaignRepository: ICampaignRepository
): AgentTool<Params> {
  return {
    name: 'updateCampaignBudget',
    description: '캠페인의 예산이나 이름을 수정합니다. 캠페인 ID와 새 예산이 필요합니다.',
    parameters: paramsSchema,
    requiresConfirmation: true,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const result = await updateCampaignUseCase.execute({
        campaignId: params.campaignId,
        userId: context.userId,
        dailyBudget: params.dailyBudget,
        currency: 'KRW',
        name: params.name,
        syncToMeta: !!context.accessToken,
        accessToken: context.accessToken ?? undefined,
        adAccountId: context.adAccountId ?? undefined,
      })

      return {
        success: true,
        data: result,
        formattedMessage: `캠페인 '${result.name}'의 예산이 ₩${params.dailyBudget.toLocaleString('ko-KR')}으로 변경되었습니다.`,
      }
    },

    async buildConfirmation(params: Params, _context: AgentContext) {
      const campaign = await campaignRepository.findById(params.campaignId)
      const currentBudget = campaign?.dailyBudget.amount ?? 0

      const details = [
        { label: '캠페인', value: campaign?.name ?? params.campaignId },
        { label: '현재 예산', value: `₩${currentBudget.toLocaleString('ko-KR')}` },
        { label: '변경 예산', value: `₩${params.dailyBudget.toLocaleString('ko-KR')}`, changed: true },
      ]
      if (params.name) {
        details.push({ label: '이름 변경', value: params.name, changed: true })
      }

      const warnings: string[] = ['Meta 계정에 즉시 반영됩니다']
      if (params.dailyBudget > currentBudget * 2) {
        warnings.push('예산이 2배 이상 증가합니다. 신중하게 결정하세요.')
      }

      return {
        summary: `캠페인 '${campaign?.name ?? params.campaignId}' 예산을 ₩${params.dailyBudget.toLocaleString('ko-KR')}으로 변경합니다`,
        details,
        warnings,
      }
    },
  }
}
