import { z } from 'zod'
import type {
  AgentTool,
  AgentContext,
  ToolExecutionResult,
} from '@application/ports/IConversationalAgent'
import type { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'
import type { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'

const paramsSchema = z.object({
  campaignIds: z
    .array(z.string())
    .optional()
    .describe('리포트 대상 캠페인 식별자 목록 (ID 또는 캠페인명, 미지정 시 전체)'),
})

type Params = z.infer<typeof paramsSchema>

export function createGenerateReportTool(
  generateWeeklyReportUseCase: GenerateWeeklyReportUseCase,
  listCampaignsUseCase: ListCampaignsUseCase
): AgentTool<Params> {
  return {
    name: 'generateReport',
    description: '주간 성과 리포트를 생성합니다. AI 인사이트와 추천사항을 포함합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const requestedCampaignKeys = params.campaignIds ?? []
      let resolvedCampaignIds: string[] = []

      if (requestedCampaignKeys.length > 0) {
        const campaignList = await listCampaignsUseCase.execute({
          userId: context.userId,
          page: 1,
          limit: 200,
        })

        const allCampaigns = campaignList.data
        const normalize = (value: string) => value.trim().toLowerCase()

        const unresolved: string[] = []

        for (const key of requestedCampaignKeys) {
          const normalizedKey = normalize(key)

          const exactId = allCampaigns.find((c) => c.id === key)
          if (exactId) {
            resolvedCampaignIds.push(exactId.id)
            continue
          }

          const exactName = allCampaigns.find((c) => normalize(c.name) === normalizedKey)
          if (exactName) {
            resolvedCampaignIds.push(exactName.id)
            continue
          }

          const partialMatches = allCampaigns.filter((c) =>
            normalize(c.name).includes(normalizedKey)
          )
          if (partialMatches.length === 1) {
            resolvedCampaignIds.push(partialMatches[0].id)
            continue
          }

          unresolved.push(key)
        }

        resolvedCampaignIds = Array.from(new Set(resolvedCampaignIds))

        if (unresolved.length > 0) {
          const availableNames = allCampaigns
            .slice(0, 5)
            .map((c) => c.name)
            .join(', ')
          return {
            success: false,
            data: { unresolved },
            formattedMessage:
              unresolved.length === 1
                ? `"${unresolved[0]}" 캠페인을 찾지 못했습니다. 캠페인명을 정확히 선택해 주세요. 예: ${availableNames}`
                : `일부 캠페인을 찾지 못했습니다 (${unresolved.join(', ')}). 캠페인명을 정확히 선택해 주세요. 예: ${availableNames}`,
          }
        }
      }

      const report = await generateWeeklyReportUseCase.execute({
        userId: context.userId,
        campaignIds: resolvedCampaignIds,
        startDate: weekAgo.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
      })

      const formattedMessage = [
        `📈 주간 리포트가 생성되었습니다.`,
        `- 기간: ${weekAgo.toISOString().split('T')[0]} ~ ${now.toISOString().split('T')[0]}`,
        `- 리포트 ID: ${report.id}`,
        `- 상태: ${report.status}`,
      ].join('\n')

      return { success: true, data: report, formattedMessage }
    },
  }
}
