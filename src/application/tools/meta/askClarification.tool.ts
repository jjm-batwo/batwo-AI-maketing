import { z } from 'zod'
import type { AgentTool, ToolExecutionResult } from '@application/ports/IConversationalAgent'

const paramsSchema = z.object({
  question: z.string().describe('사용자에게 할 질문'),
  options: z.array(z.string()).optional().describe('선택지 목록 (선택사항)'),
})

type Params = z.infer<typeof paramsSchema>

export function createAskClarificationTool(): AgentTool<Params> {
  return {
    name: 'askClarification',
    description: '사용자에게 추가 정보를 요청합니다. 작업 수행에 필요한 정보가 부족할 때 사용합니다.',
    parameters: paramsSchema,
    requiresConfirmation: false,

    async execute(params: Params): Promise<ToolExecutionResult> {
      let formattedMessage = params.question
      if (params.options && params.options.length > 0) {
        const optionLines = params.options.map((o, i) => `${i + 1}. ${o}`)
        formattedMessage += '\n\n' + optionLines.join('\n')
      }

      return {
        success: true,
        data: { question: params.question, options: params.options },
        formattedMessage,
      }
    },
  }
}
