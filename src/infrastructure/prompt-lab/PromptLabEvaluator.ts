// src/infrastructure/prompt-lab/PromptLabEvaluator.ts
import type {
  IPromptLabEvaluator,
  EvaluationInput,
  EvaluationResult,
} from '@application/ports/IPromptLabEvaluator'
import type { IPromptLabRuleScorer, RuleScorerInput } from '@application/ports/IPromptLabRuleScorer'
import type { IPromptLabLLMJudge } from '@application/ports/IPromptLabLLMJudge'

// Re-export for backward compatibility
export type { EvaluationInput, EvaluationResult } from '@application/ports/IPromptLabEvaluator'

const RULE_SCORE_THRESHOLD = 20

export class PromptLabEvaluator implements IPromptLabEvaluator {
  constructor(
    private readonly ruleScorer: IPromptLabRuleScorer,
    private readonly llmJudge: IPromptLabLLMJudge,
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
