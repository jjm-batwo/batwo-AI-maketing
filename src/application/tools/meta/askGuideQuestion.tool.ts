import { z } from 'zod'
import type { AgentTool, ToolExecutionResult } from '@application/ports/IConversationalAgent'

const paramsSchema = z.object({
  questionId: z.string().describe('질문 식별자 (experience_level, industry, objective, budget, target)'),
  question: z.string().describe('사용자에게 표시할 질문'),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).describe('선택지 목록'),
  currentStep: z.number().describe('현재 질문 번호'),
  totalSteps: z.number().describe('전체 질문 수'),
})

type Params = z.infer<typeof paramsSchema>

interface GuideQuestionResult {
  questionId: string
  question: string
  options: { value: string; label: string; description?: string }[]
  progress: { current: number; total: number }
}

export function createAskGuideQuestionTool(): AgentTool<Params, GuideQuestionResult> {
  return {
    name: 'askGuideQuestion',
    description: '캠페인 가이드 질문을 표시합니다. 사용자의 경험 수준과 비즈니스 정보를 파악하기 위한 인터뷰 질문에 사용합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params): Promise<ToolExecutionResult<GuideQuestionResult>> {
      const optionLines = params.options.map((o) => `- ${o.label}${o.description ? `: ${o.description}` : ''}`)
      const formattedMessage = `${params.question}\n\n${optionLines.join('\n')}`

      return {
        success: true,
        data: {
          questionId: params.questionId,
          question: params.question,
          options: params.options,
          progress: { current: params.currentStep, total: params.totalSteps },
        },
        formattedMessage,
      }
    },
  }
}
