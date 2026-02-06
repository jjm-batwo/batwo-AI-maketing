import { z } from 'zod'
import type { AgentTool, AgentContext, ToolExecutionResult } from '@application/ports/IConversationalAgent'

const paramsSchema = z.object({
  product: z.string().describe('광고할 상품/서비스 이름'),
  targetAudience: z.string().optional().describe('타겟 고객층 설명'),
  tone: z.enum(['formal', 'casual', 'urgent', 'friendly']).default('casual').describe('카피 톤앤매너'),
  emphasis: z.string().optional().describe('강조할 포인트 (할인, 신상품, 한정판 등)'),
  count: z.number().min(1).max(5).default(3).describe('생성할 카피 수'),
})

type Params = z.infer<typeof paramsSchema>

const TONE_LABELS: Record<string, string> = {
  formal: '격식체',
  casual: '캐주얼',
  urgent: '긴급/촉구',
  friendly: '친근한',
}

export function createGenerateAdCopyTool(): AgentTool<Params> {
  return {
    name: 'generateAdCopy',
    description: 'AI를 활용하여 광고 카피를 생성합니다. 상품명과 톤을 지정할 수 있습니다.',
    parameters: paramsSchema,
    requiresConfirmation: true,

    async execute(params: Params): Promise<ToolExecutionResult> {
      // Note: In a full implementation, this would call an AI service
      // For now, generate template-based copies
      const copies = Array.from({ length: params.count }, (_, i) => {
        const templates = [
          `${params.product}${params.emphasis ? ` - ${params.emphasis}` : ''}, 지금 바로 만나보세요!`,
          `${params.targetAudience ?? '고객'}님을 위한 ${params.product}, 특별한 경험을 선사합니다.`,
          `${params.product}로 일상을 더 특별하게. ${params.emphasis ?? '놓치지 마세요!'}`,
          `지금이 기회! ${params.product}${params.emphasis ? ` ${params.emphasis}` : ''} 이벤트`,
          `${params.product}, 당신의 선택이 달라집니다.`,
        ]
        return { id: i + 1, copy: templates[i % templates.length] }
      })

      const lines = copies.map((c) => `${c.id}. "${c.copy}"`)

      return {
        success: true,
        data: { copies, params },
        formattedMessage: `✍️ ${params.product} 광고 카피 (${TONE_LABELS[params.tone]} 톤):\n\n${lines.join('\n')}`,
      }
    },

    async buildConfirmation(params: Params) {
      return {
        summary: `'${params.product}' 광고 카피 ${params.count}개를 생성합니다`,
        details: [
          { label: '상품', value: params.product },
          { label: '톤', value: TONE_LABELS[params.tone] ?? params.tone },
          { label: '카피 수', value: `${params.count}개` },
          ...(params.targetAudience ? [{ label: '타겟', value: params.targetAudience }] : []),
          ...(params.emphasis ? [{ label: '강조점', value: params.emphasis }] : []),
        ],
        warnings: ['AI 생성 카피는 검수 후 사용하세요'],
      }
    },
  }
}
