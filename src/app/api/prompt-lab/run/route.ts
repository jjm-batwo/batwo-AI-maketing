import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getAIService } from '@/lib/di/container'
import { PromptLabService } from '@application/services/PromptLabService'
import { PromptLabEvaluator } from '@infrastructure/prompt-lab/PromptLabEvaluator'
import { PromptLabRuleScorer } from '@application/services/PromptLabRuleScorer'
import { PromptLabLLMJudge } from '@infrastructure/prompt-lab/PromptLabLLMJudge'
import { PromptLabMutator } from '@infrastructure/prompt-lab/PromptLabMutator'
import { PromptLabAIAdapter } from '@infrastructure/prompt-lab/PromptLabAIAdapter'
import { PromptLabCache } from '@infrastructure/prompt-lab/PromptLabCache'
import { createPromptLabConfig } from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

const VALID_INDUSTRIES: Industry[] = [
  'ecommerce', 'food_beverage', 'beauty', 'fashion',
  'education', 'service', 'saas', 'health',
]

const VALID_TONES = ['professional', 'casual', 'playful', 'urgent'] as const
const VALID_OBJECTIVES = ['awareness', 'consideration', 'conversion'] as const

export async function POST(request: Request) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()

    // Validation
    if (!body.industry || !VALID_INDUSTRIES.includes(body.industry)) {
      return NextResponse.json({ error: 'Invalid industry' }, { status: 400 })
    }
    if (!body.sampleInput?.productName || !body.sampleInput?.productDescription) {
      return NextResponse.json({ error: 'sampleInput with productName and productDescription required' }, { status: 400 })
    }
    if (!body.maxDurationMs || body.maxDurationMs < 60_000) {
      return NextResponse.json({ error: 'maxDurationMs must be >= 60000 (1 minute)' }, { status: 400 })
    }

    const tone = VALID_TONES.includes(body.sampleInput.tone) ? body.sampleInput.tone : 'professional'
    const objective = VALID_OBJECTIVES.includes(body.sampleInput.objective) ? body.sampleInput.objective : 'conversion'

    const config = createPromptLabConfig({
      industry: body.industry,
      maxDurationMs: body.maxDurationMs,
      iterationDelayMs: body.iterationDelayMs,
      sampleInput: {
        productName: body.sampleInput.productName,
        productDescription: body.sampleInput.productDescription,
        targetAudience: body.sampleInput.targetAudience ?? '20-40대',
        tone,
        objective,
        keywords: body.sampleInput.keywords,
        industry: body.industry,
      },
    })

    const ai = getAIService()
    const ruleScorer = new PromptLabRuleScorer()
    const llmJudge = new PromptLabLLMJudge(ai)
    const evaluator = new PromptLabEvaluator(ruleScorer, llmJudge)
    const mutator = new PromptLabMutator()
    const adapter = new PromptLabAIAdapter(ai)

    const service = new PromptLabService(adapter, evaluator, mutator)
    const report = await service.run(config)

    // Apply if requested
    if (body.applyBest) {
      PromptLabCache.set(config.industry, report.bestVariant)
    }

    return NextResponse.json(report)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
