import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { GenerateWeeklyReportUseCase } from '@application/use-cases/report/GenerateWeeklyReportUseCase'

const paramsSchema = z.object({
  campaignIds: z.array(z.string()).optional().describe('리포트 대상 캠페인 ID 목록 (미지정 시 전체)'),
})

type Params = z.infer<typeof paramsSchema>

export function createGenerateReportTool(
  generateWeeklyReportUseCase: GenerateWeeklyReportUseCase
): AgentTool<Params> {
  return {
    name: 'generateReport',
    description: '주간 성과 리포트를 생성합니다. AI 인사이트와 추천사항을 포함합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const report = await generateWeeklyReportUseCase.execute({
        userId: context.userId,
        campaignIds: params.campaignIds ?? [],
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
