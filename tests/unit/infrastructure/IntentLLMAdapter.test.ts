import { describe, it, expect, vi } from 'vitest'
import { IntentLLMAdapter } from '@infrastructure/external/openai/IntentLLMAdapter'
import { ChatIntent } from '@domain/value-objects/ChatIntent'
import type { IAIService } from '@application/ports/IAIService'

function createMockAIService(response: string): IAIService {
  return {
    chatCompletion: vi.fn().mockResolvedValue(response),
    generateCampaignOptimization: vi.fn(),
    generateReportInsights: vi.fn(),
    generateAdCopy: vi.fn(),
    generateBudgetRecommendation: vi.fn(),
    generateCreativeVariants: vi.fn(),
  } as unknown as IAIService
}

describe('IntentLLMAdapter', () => {
  const allIntents = Object.values(ChatIntent)

  it('should parse valid uppercase intent response', async () => {
    const mock = createMockAIService('CAMPAIGN_CREATION')
    const adapter = new IntentLLMAdapter(mock)

    const result = await adapter.classifyIntent('테스트', allIntents)

    expect(result).toBe(ChatIntent.CAMPAIGN_CREATION)
    expect(mock.chatCompletion).toHaveBeenCalledOnce()
  })

  it('should parse lowercase intent response', async () => {
    const mock = createMockAIService('campaign_creation')
    const adapter = new IntentLLMAdapter(mock)

    const result = await adapter.classifyIntent('테스트', allIntents)

    expect(result).toBe(ChatIntent.CAMPAIGN_CREATION)
  })

  it('should parse response with whitespace', async () => {
    const mock = createMockAIService('  KPI_ANALYSIS  \n')
    const adapter = new IntentLLMAdapter(mock)

    const result = await adapter.classifyIntent('테스트', allIntents)

    expect(result).toBe(ChatIntent.KPI_ANALYSIS)
  })

  it('should fallback to GENERAL for invalid response', async () => {
    const mock = createMockAIService('UNKNOWN_INTENT')
    const adapter = new IntentLLMAdapter(mock)

    const result = await adapter.classifyIntent('테스트', allIntents)

    expect(result).toBe(ChatIntent.GENERAL)
  })

  it('should fallback to GENERAL for empty response', async () => {
    const mock = createMockAIService('')
    const adapter = new IntentLLMAdapter(mock)

    const result = await adapter.classifyIntent('테스트', allIntents)

    expect(result).toBe(ChatIntent.GENERAL)
  })

  it('should truncate long messages to 500 chars', async () => {
    const mock = createMockAIService('GENERAL')
    const adapter = new IntentLLMAdapter(mock)
    const longMessage = 'A'.repeat(1000)

    await adapter.classifyIntent(longMessage, allIntents)

    const callArgs = (mock.chatCompletion as ReturnType<typeof vi.fn>).mock.calls[0]
    const userPrompt = callArgs[1] as string
    expect(userPrompt.length).toBe(500)
  })

  it('should not truncate short messages', async () => {
    const mock = createMockAIService('GENERAL')
    const adapter = new IntentLLMAdapter(mock)
    const shortMessage = '짧은 메시지'

    await adapter.classifyIntent(shortMessage, allIntents)

    const callArgs = (mock.chatCompletion as ReturnType<typeof vi.fn>).mock.calls[0]
    const userPrompt = callArgs[1] as string
    expect(userPrompt).toBe(shortMessage)
  })

  it('should use temperature 0 for deterministic output', async () => {
    const mock = createMockAIService('GENERAL')
    const adapter = new IntentLLMAdapter(mock)

    await adapter.classifyIntent('테스트', allIntents)

    const callArgs = (mock.chatCompletion as ReturnType<typeof vi.fn>).mock.calls[0]
    const config = callArgs[2]
    expect(config.temperature).toBe(0)
    expect(config.maxTokens).toBe(20)
  })
})
