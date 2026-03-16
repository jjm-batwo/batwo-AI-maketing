// src/infrastructure/prompt-lab/PromptLabEvaluator.ts
import type { AdCopyVariant } from '@application/ports/IAIService'
import type { PromptLabRuleScorer, RuleScorerInput } from '@application/services/PromptLabRuleScorer'
import type { PromptLabLLMJudge } from '@infrastructure/prompt-lab/PromptLabLLMJudge'

export interface EvaluationInput {
  variants: AdCopyVariant[]
  keywords: string[]
  bestVariantCopy: AdCopyVariant[] | null
}

export interface EvaluationResult {
  ruleScore: number
  llmScore: number
  totalScore: number
  tokenUsage: number
}

const RULE_SCORE_THRESHOLD = 20

export class PromptLabEvaluator {
  constructor(
    private readonly ruleScorer: PromptLabRuleScorer,
    private readonly llmJudge: PromptLabLLMJudge,
  ) {}

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const ruleScorerInput: RuleScorerInput = {
      variants: input.variants,
      keywords: input.keywords,
      bestVariantCopy: input.bestVariantCopy,
    }

    const ruleScore = this.ruleScorer.score(ruleScorerInput)

    if (ruleScore < RULE_SCORE_THRESHOLD) {
      return { ruleScore, llmScore: 0, totalScore: ruleScore, tokenUsage: 0 }
    }

    const judgeResult = await this.llmJudge.evaluate(input.variants[0])
    return {
      ruleScore,
      llmScore: judgeResult.score,
      totalScore: ruleScore + judgeResult.score,
      tokenUsage: judgeResult.tokenUsage,
    }
  }

  async evaluateWithConfirmation(
    input: EvaluationInput & { initialLLMScore: number },
  ): Promise<EvaluationResult> {
    const ruleScore = this.ruleScorer.score({
      variants: input.variants,
      keywords: input.keywords,
      bestVariantCopy: input.bestVariantCopy,
    })

    if (ruleScore < RULE_SCORE_THRESHOLD) {
      return { ruleScore, llmScore: 0, totalScore: ruleScore, tokenUsage: 0 }
    }

    const variant = input.variants[0]
    const [r2, r3] = await Promise.all([
      this.llmJudge.evaluate(variant),
      this.llmJudge.evaluate(variant),
    ])

    const scores = [input.initialLLMScore, r2.score, r3.score].sort((a, b) => a - b)
    const medianScore = scores[1]
    const totalTokens = r2.tokenUsage + r3.tokenUsage

    return {
      ruleScore,
      llmScore: medianScore,
      totalScore: ruleScore + medianScore,
      tokenUsage: totalTokens,
    }
  }
}
