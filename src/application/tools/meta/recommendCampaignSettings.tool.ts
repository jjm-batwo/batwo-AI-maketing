import { z } from 'zod'
import type { AgentTool, ToolExecutionResult } from '@application/ports/IConversationalAgent'

const paramsSchema = z.object({
  experienceLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).describe('사용자 광고 경험 수준'),
  industry: z.string().describe('업종'),
  objective: z.enum(['sales', 'awareness', 'traffic', 'engagement']).describe('캠페인 목표'),
  dailyBudgetRange: z.string().describe('하루 예산 범위 (예: 10000-50000)'),
  reasoning: z.string().describe('추천 이유 설명'),
})

type Params = z.infer<typeof paramsSchema>

type CampaignObjective = 'TRAFFIC' | 'CONVERSIONS' | 'BRAND_AWARENESS' | 'REACH' | 'ENGAGEMENT'

interface RecommendationResult {
  campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
  formData: {
    objective: CampaignObjective
    dailyBudget: number
    campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
  }
  reasoning: string
  experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
}

const OBJECTIVE_MAP: Record<string, CampaignObjective> = {
  sales: 'CONVERSIONS',
  awareness: 'BRAND_AWARENESS',
  traffic: 'TRAFFIC',
  engagement: 'ENGAGEMENT',
}

function parseBudgetRange(range: string): number {
  const parts = range.split('-').map(Number)
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return Math.round((parts[0] + parts[1]) / 2)
  }
  return parts[0] || 10000
}

export function createRecommendCampaignSettingsTool(): AgentTool<Params, RecommendationResult> {
  return {
    name: 'recommendCampaignSettings',
    description: '사용자 인터뷰 결과를 바탕으로 캠페인 설정을 추천합니다. 모든 가이드 질문 완료 후 호출합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params): Promise<ToolExecutionResult<RecommendationResult>> {
      const campaignMode = params.experienceLevel === 'ADVANCED' ? 'MANUAL' : 'ADVANTAGE_PLUS'
      const objective = OBJECTIVE_MAP[params.objective] || 'CONVERSIONS'
      const dailyBudget = parseBudgetRange(params.dailyBudgetRange)

      const result: RecommendationResult = {
        campaignMode,
        formData: {
          objective,
          dailyBudget,
          campaignMode,
        },
        reasoning: params.reasoning,
        experienceLevel: params.experienceLevel,
      }

      const modeLabel = campaignMode === 'ADVANTAGE_PLUS' ? 'Advantage+ (자동 최적화)' : '수동 모드'
      const formattedMessage = `캠페인 추천 결과:\n- 모드: ${modeLabel}\n- 목표: ${objective}\n- 일일 예산: ₩${dailyBudget.toLocaleString()}\n\n${params.reasoning}`

      return {
        success: true,
        data: result,
        formattedMessage,
      }
    },
  }
}
