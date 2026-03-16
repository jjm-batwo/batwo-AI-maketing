import { describe, it, expect, vi } from 'vitest'
import { PromptLabAIAdapter } from '@infrastructure/prompt-lab/PromptLabAIAdapter'
import type { IAIService } from '@application/ports/IAIService'
import { createDefaultVariant } from '@domain/value-objects/PromptLabTypes'
import type { Industry } from '@domain/value-objects/Industry'

function makeMockAI(): IAIService {
  return {
    generateAdCopy: vi.fn().mockResolvedValue([{
      headline: '테스트', primaryText: '본문',
      description: '설명', callToAction: '구매', targetAudience: '20대',
    }]),
    chatCompletion: vi.fn().mockResolvedValue('response'),
  } as unknown as IAIService
}

describe('PromptLabAIAdapter', () => {
  it('should apply variant settings as scienceContext', async () => {
    const ai = makeMockAI()
    const adapter = new PromptLabAIAdapter(ai)
    const variant = { ...createDefaultVariant(), temperature: 0.5 }

    await adapter.generateWithVariant(
      {
        productName: '테스트', productDescription: '설명',
        targetAudience: '20대', tone: 'casual' as const,
        objective: 'conversion' as const, industry: 'ecommerce' as Industry,
      },
      variant,
    )

    expect(ai.generateAdCopy).toHaveBeenCalledWith(
      expect.objectContaining({ scienceContext: expect.any(String) }),
    )
  })

  it('should filter scienceDomains in context', async () => {
    const ai = makeMockAI()
    const adapter = new PromptLabAIAdapter(ai)
    const variant = {
      ...createDefaultVariant(),
      scienceDomains: ['neuromarketing', 'meta_best_practices', 'copywriting_psychology'] as any,
    }

    await adapter.generateWithVariant(
      {
        productName: '테스트', productDescription: '설명',
        targetAudience: '20대', tone: 'casual' as const,
        objective: 'conversion' as const, industry: 'ecommerce' as Industry,
      },
      variant,
    )

    const calledInput = vi.mocked(ai.generateAdCopy).mock.calls[0][0]
    expect(calledInput.scienceContext).toContain('neuromarketing')
    expect(calledInput.scienceContext).not.toContain('crowd_psychology')
  })

  it('should track estimated token usage', async () => {
    const ai = makeMockAI()
    const adapter = new PromptLabAIAdapter(ai)

    const result = await adapter.generateWithVariant(
      {
        productName: '테스트', productDescription: '설명',
        targetAudience: '20대', tone: 'casual' as const,
        objective: 'conversion' as const, industry: 'ecommerce' as Industry,
      },
      createDefaultVariant(),
    )

    expect(result.estimatedTokenUsage).toBeGreaterThan(0)
    expect(result.variants).toHaveLength(1)
  })
})
