import type {
  IPromptLabAIAdapter,
  GenerateWithVariantResult,
} from '@application/ports/IPromptLabAIAdapter'
import type { IAIService } from '@application/ports/IAIService'
import type { GenerateAdCopyInput } from '@domain/value-objects/AdCopyTypes'
import type { PromptVariant, PromptLabSampleInput } from '@domain/value-objects/PromptLabTypes'

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  expert_marketer: '10년 경력의 퍼포먼스 마케팅 전문가',
  consumer_psychologist: '소비자 심리학 박사이자 광고 컨설턴트',
  data_analyst: '데이터 기반 마케팅 분석가',
  creative_director: '글로벌 광고 대행사 크리에이티브 디렉터',
}

const INSTRUCTION_HINTS: Record<string, string> = {
  strict: '반드시 다음 규칙을 지켜라: 숫자를 포함하고, CTA를 명확히 하고, 혜택을 구체적으로 제시하라.',
  moderate: '자연스러운 흐름으로 작성하되, 핵심 혜택과 행동 유도를 포함하라.',
  loose: '자유롭고 창의적으로 작성하라. 형식에 구애받지 말고 가장 매력적인 카피를 만들어라.',
}

// Re-export for backward compatibility
export type { GenerateWithVariantResult } from '@application/ports/IPromptLabAIAdapter'

export class PromptLabAIAdapter implements IPromptLabAIAdapter {
  constructor(private readonly ai: IAIService) {}

  async generateWithVariant(
    input: PromptLabSampleInput,
    variant: PromptVariant,
  ): Promise<GenerateWithVariantResult> {
    const scienceHint = this.buildScienceHint(variant)

    const enrichedInput: GenerateAdCopyInput = {
      ...input,
      scienceContext: scienceHint,
    }

    const variants = await this.ai.generateAdCopy(enrichedInput)

    const inputEstimate = Math.ceil(scienceHint.length / 4) + 500
    const outputEstimate = 600
    const estimatedTokenUsage = inputEstimate + outputEstimate

    return { variants, estimatedTokenUsage }
  }

  private buildScienceHint(variant: PromptVariant): string {
    const roleLabel = SYSTEM_ROLE_LABELS[variant.systemRole] ?? variant.systemRole
    const instruction = INSTRUCTION_HINTS[variant.instructionStyle] ?? ''
    const domains = variant.scienceDomains.join(', ')

    return [
      `[PromptLab 최적화 컨텍스트]`,
      `역할: ${roleLabel}`,
      `활성 분석 도메인: ${domains}`,
      `지시 스타일: ${instruction}`,
      `Few-shot 전략: ${variant.fewShotStrategy}`,
    ].join('\n')
  }
}
