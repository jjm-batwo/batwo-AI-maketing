/**
 * PromptLab Module - DI 등록
 *
 * PromptLab 자동 프롬프트 최적화 파이프라인 의존성 등록
 */

import type { Container } from '../container'
import { DI_TOKENS } from '../types'

// Port interfaces
import type { IPromptLabEvaluator } from '@application/ports/IPromptLabEvaluator'
import type { IPromptLabMutator } from '@application/ports/IPromptLabMutator'
import type { IPromptLabAIAdapter } from '@application/ports/IPromptLabAIAdapter'
import type { IPromptLabRuleScorer } from '@application/ports/IPromptLabRuleScorer'
import type { IPromptLabLLMJudge } from '@application/ports/IPromptLabLLMJudge'
import type { IPromptLabCache } from '@application/ports/IPromptLabCache'
import type { IAIService } from '@application/ports/IAIService'

// Infrastructure implementations
import { PromptLabEvaluator } from '@infrastructure/prompt-lab/PromptLabEvaluator'
import { PromptLabMutator } from '@infrastructure/prompt-lab/PromptLabMutator'
import { PromptLabAIAdapter } from '@infrastructure/prompt-lab/PromptLabAIAdapter'
import { PromptLabLLMJudge } from '@infrastructure/prompt-lab/PromptLabLLMJudge'
import { PromptLabCache } from '@infrastructure/prompt-lab/PromptLabCache'

// Application services
import { PromptLabService } from '@application/services/PromptLabService'
import { PromptLabRuleScorer } from '@application/services/PromptLabRuleScorer'

export function registerPromptLabModule(container: Container): void {
  // Rule Scorer (stateless, singleton)
  container.registerSingleton(
    DI_TOKENS.PromptLabRuleScorer,
    () => new PromptLabRuleScorer(),
  )

  // LLM Judge (depends on AIService)
  container.register(
    DI_TOKENS.PromptLabLLMJudge,
    () => new PromptLabLLMJudge(
      container.resolve<IAIService>(DI_TOKENS.AIService),
    ),
  )

  // Evaluator (depends on RuleScorer + LLMJudge)
  container.register<IPromptLabEvaluator>(
    DI_TOKENS.PromptLabEvaluator,
    () => new PromptLabEvaluator(
      container.resolve<IPromptLabRuleScorer>(DI_TOKENS.PromptLabRuleScorer),
      container.resolve<IPromptLabLLMJudge>(DI_TOKENS.PromptLabLLMJudge),
    ),
  )

  // Mutator (stateless, singleton)
  container.registerSingleton<IPromptLabMutator>(
    DI_TOKENS.PromptLabMutator,
    () => new PromptLabMutator(),
  )

  // AI Adapter (depends on AIService)
  container.register<IPromptLabAIAdapter>(
    DI_TOKENS.PromptLabAIAdapter,
    () => new PromptLabAIAdapter(
      container.resolve<IAIService>(DI_TOKENS.AIService),
    ),
  )

  // Cache (singleton module-level object)
  container.registerSingleton<IPromptLabCache>(
    DI_TOKENS.PromptLabCache,
    () => PromptLabCache,
  )

  // PromptLabService (depends on Adapter + Evaluator + Mutator)
  container.register(
    DI_TOKENS.PromptLabService,
    () => new PromptLabService(
      container.resolve<IPromptLabAIAdapter>(DI_TOKENS.PromptLabAIAdapter),
      container.resolve<IPromptLabEvaluator>(DI_TOKENS.PromptLabEvaluator),
      container.resolve<IPromptLabMutator>(DI_TOKENS.PromptLabMutator),
    ),
  )
}
