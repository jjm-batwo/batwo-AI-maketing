import { z } from 'zod'
import type {
  AgentTool,
  AgentContext,
  ToolExecutionResult,
} from '@application/ports/IConversationalAgent'
import type { GetDashboardKPIUseCase } from '@application/use-cases/kpi/GetDashboardKPIUseCase'
import type { DateRangePreset } from '@application/dto/kpi/DashboardKPIDTO'

const paramsSchema = z.object({
  period: z.enum(['today', '7d', '14d', '30d']).default('7d').describe('조회 기간'),
  campaignId: z.string().optional().describe('특정 캠페인 ID (미지정 시 전체)'),
})

type Params = z.infer<typeof paramsSchema>

const PERIOD_TO_PRESET: Record<string, DateRangePreset> = {
  today: 'today',
  '7d': 'last_7d',
  '14d': 'last_30d',
  '30d': 'last_30d',
}

export function createGetPerformanceKPITool(
  getDashboardKPIUseCase: GetDashboardKPIUseCase
): AgentTool<Params> {
  return {
    name: 'getPerformanceKPI',
    description:
      '사용자의 광고 캠페인 성과 지표(KPI)를 조회합니다. ROAS, CPA, CTR, 지출, 매출 등을 확인할 수 있습니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const dateRange = PERIOD_TO_PRESET[params.period] ?? 'last_7d'

      const result = await getDashboardKPIUseCase.execute({
        userId: context.userId,
        dateRange,
        campaignIds: params.campaignId ? [params.campaignId] : undefined,
        includeComparison: true,
        includeBreakdown: true,
      })

      const spend = result.totalSpend.toLocaleString('ko-KR')
      const revenue = result.totalRevenue.toLocaleString('ko-KR')
      const roas = result.roas.toFixed(2)

      const formattedMessage = [
        `📊 최근 ${params.period} 성과 요약:`,
        `- 총 지출: ₩${spend}`,
        `- 총 매출: ₩${revenue}`,
        `- ROAS: ${roas}x`,
        `- CTR: ${result.ctr.toFixed(2)}%`,
        `- 전환수: ${result.totalConversions.toLocaleString('ko-KR')}건`,
        `- CPA: ₩${result.cpa.toLocaleString('ko-KR')}`,
      ].join('\n')

      return { success: true, data: result, formattedMessage }
    },
  }
}
