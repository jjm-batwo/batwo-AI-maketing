import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'
import type { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

const paramsSchema = z.object({
  name: z.string().min(1).describe('캠페인 이름'),
  objective: z.enum([
    'AWARENESS',
    'TRAFFIC',
    'ENGAGEMENT',
    'LEADS',
    'APP_PROMOTION',
    'SALES',
    'CONVERSIONS',
  ] as const).describe('캠페인 목적'),
  dailyBudget: z.number().min(5000).describe('일일 예산 (원)'),
  startDate: z.string().optional().describe('시작일 (YYYY-MM-DD)'),
  endDate: z.string().optional().describe('종료일 (YYYY-MM-DD)'),
  targetAudience: z.object({
    ageMin: z.number().optional(),
    ageMax: z.number().optional(),
    genders: z.array(z.enum(['male', 'female'])).optional(),
    locations: z.array(z.string()).optional(),
    interests: z.array(z.string()).optional(),
  }).optional(),
})

type Params = z.infer<typeof paramsSchema>

const OBJECTIVE_LABELS: Record<string, string> = {
  AWARENESS: '인지도',
  TRAFFIC: '트래픽',
  ENGAGEMENT: '참여',
  LEADS: '리드',
  APP_PROMOTION: '앱 프로모션',
  SALES: '판매',
  CONVERSIONS: '전환',
}

export function createCreateCampaignTool(
  createCampaignUseCase: CreateCampaignUseCase
): AgentTool<Params> {
  return {
    name: 'createCampaign',
    description: '새로운 Meta 광고 캠페인을 생성합니다. 캠페인 이름, 목적, 일일 예산이 필요합니다.',
    parameters: paramsSchema,
    requiresConfirmation: true,

    async execute(params: Params, context: AgentContext): Promise<ToolExecutionResult> {
      const result = await createCampaignUseCase.execute({
        userId: context.userId,
        name: params.name,
        objective: params.objective as CampaignObjective,
        dailyBudget: params.dailyBudget,
        currency: 'KRW',
        startDate: params.startDate ?? new Date().toISOString().split('T')[0],
        endDate: params.endDate,
        targetAudience: params.targetAudience,
        syncToMeta: !!context.accessToken,
        accessToken: context.accessToken ?? undefined,
        adAccountId: context.adAccountId ?? undefined,
      })

      return {
        success: true,
        data: result,
        formattedMessage: `캠페인 '${result.name}'이(가) 성공적으로 생성되었습니다.${context.accessToken ? ' Meta 계정에도 동기화되었습니다.' : ''}`,
      }
    },

    async buildConfirmation(params: Params) {
      const details = [
        { label: '캠페인 이름', value: params.name },
        { label: '목적', value: OBJECTIVE_LABELS[params.objective] ?? params.objective },
        { label: '일일 예산', value: `₩${params.dailyBudget.toLocaleString('ko-KR')}` },
      ]
      if (params.startDate) details.push({ label: '시작일', value: params.startDate })
      if (params.endDate) details.push({ label: '종료일', value: params.endDate })

      return {
        summary: `${OBJECTIVE_LABELS[params.objective] ?? ''} 캠페인을 일일 예산 ₩${params.dailyBudget.toLocaleString('ko-KR')}으로 생성합니다`,
        details,
        warnings: ['Meta 광고 계정에 실제 캠페인이 생성됩니다', '예산이 즉시 소진되기 시작할 수 있습니다'],
      }
    },
  }
}
