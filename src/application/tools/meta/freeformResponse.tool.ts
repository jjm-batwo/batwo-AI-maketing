import { z } from 'zod'
import type { AgentTool, ToolExecutionResult } from '@application/ports/IConversationalAgent'

const paramsSchema = z.object({
  message: z.string().describe('사용자에게 전달할 메시지'),
})

type Params = z.infer<typeof paramsSchema>

export function createFreeformResponseTool(): AgentTool<Params> {
  return {
    name: 'freeformResponse',
    description: '일반적인 대화 응답을 생성합니다. 광고 관련이 아닌 일반적인 질문에 답할 때 사용합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params): Promise<ToolExecutionResult> {
      return {
        success: true,
        data: { message: params.message },
        formattedMessage: params.message,
      }
    },
  }
}
