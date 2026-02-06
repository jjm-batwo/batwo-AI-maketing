import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import type { CampaignStatus } from '@domain/value-objects/CampaignStatus'

const paramsSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).optional().describe('캠페인 상태 필터'),
  page: z.number().optional().default(1).describe('페이지 번호'),
  limit: z.number().optional().default(10).describe('페이지 크기'),
})

type Params = z.infer<typeof paramsSchema>

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '초안',
  ACTIVE: '활성',
  PAUSED: '일시중지',
  COMPLETED: '완료',
  ARCHIVED: '보관됨',
}

export function createListCampaignsTool(
  listCampaignsUseCase: ListCampaignsUseCase
): AgentTool<Params> {
  return {
    name: 'listCampaigns',
    description: '사용자의 캠페인 목록을 조회합니다. 상태별 필터링이 가능합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const result = await listCampaignsUseCase.execute({
        userId: context.userId,
        status: params.status as CampaignStatus | undefined,
        page: params.page,
        limit: params.limit,
      })

      if (result.data.length === 0) {
        return {
          success: true,
          data: result,
          formattedMessage: params.status
            ? `${STATUS_LABELS[params.status] ?? params.status} 상태의 캠페인이 없습니다.`
            : '등록된 캠페인이 없습니다.',
        }
      }

      const lines = result.data.map((c, i) =>
        `${i + 1}. **${c.name}** (${STATUS_LABELS[c.status] ?? c.status}) - 일일 예산: ₩${c.dailyBudget.toLocaleString('ko-KR')}`
      )

      const formattedMessage = [
        `캠페인 목록 (${result.total}개 중 ${result.data.length}개):`,
        ...lines,
      ].join('\n')

      return { success: true, data: result, formattedMessage }
    },
  }
}
