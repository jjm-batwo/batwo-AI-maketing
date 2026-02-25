import { describe, it, expect } from 'vitest'
import { FewShotExampleRegistry } from '@application/services/FewShotExampleRegistry'
import { ChatIntent } from '@domain/value-objects/ChatIntent'

describe('FewShotExampleRegistry', () => {
  const registry = new FewShotExampleRegistry()

  it('should_return_examples_for_CAMPAIGN_CREATION_intent', () => {
    const examples = registry.getExamples(ChatIntent.CAMPAIGN_CREATION)
    expect(examples.length).toBeGreaterThan(0)
    examples.forEach(e => expect(e.category).toBe(ChatIntent.CAMPAIGN_CREATION))
  })

  it('should_return_examples_for_REPORT_QUERY_intent', () => {
    const examples = registry.getExamples(ChatIntent.REPORT_QUERY)
    expect(examples.length).toBeGreaterThan(0)
    examples.forEach(e => expect(e.category).toBe(ChatIntent.REPORT_QUERY))
  })

  it('should_return_examples_for_KPI_ANALYSIS_intent', () => {
    const examples = registry.getExamples(ChatIntent.KPI_ANALYSIS)
    expect(examples.length).toBeGreaterThan(0)
    examples.forEach(e => expect(e.category).toBe(ChatIntent.KPI_ANALYSIS))
  })

  it('should_return_examples_for_PIXEL_SETUP_intent', () => {
    const examples = registry.getExamples(ChatIntent.PIXEL_SETUP)
    expect(examples.length).toBeGreaterThan(0)
    examples.forEach(e => expect(e.category).toBe(ChatIntent.PIXEL_SETUP))
  })

  it('should_return_examples_for_BUDGET_OPTIMIZATION_intent', () => {
    const examples = registry.getExamples(ChatIntent.BUDGET_OPTIMIZATION)
    expect(examples.length).toBeGreaterThan(0)
    examples.forEach(e => expect(e.category).toBe(ChatIntent.BUDGET_OPTIMIZATION))
  })

  it('should_return_examples_for_GENERAL_intent', () => {
    const examples = registry.getExamples(ChatIntent.GENERAL)
    expect(examples.length).toBeGreaterThan(0)
    examples.forEach(e => expect(e.category).toBe(ChatIntent.GENERAL))
  })

  it('should_return_FewShotExample_array_type_from_getExamples', () => {
    const examples = registry.getExamples(ChatIntent.CAMPAIGN_CREATION)
    expect(Array.isArray(examples)).toBe(true)
    examples.forEach(e => {
      expect(e).toHaveProperty('role')
      expect(e).toHaveProperty('content')
      expect(e).toHaveProperty('category')
      expect(['user', 'assistant']).toContain(e.role)
      expect(typeof e.content).toBe('string')
    })
  })

  it('should_return_2_to_3_examples_per_category', () => {
    const intents = Object.values(ChatIntent)
    intents.forEach(intent => {
      const examples = registry.getExamples(intent)
      expect(examples.length).toBeGreaterThanOrEqual(2)
      expect(examples.length).toBeLessThanOrEqual(3)
    })
  })

  it('should_return_all_examples_via_getAllExamples', () => {
    const all = registry.getAllExamples()
    expect(Array.isArray(all)).toBe(true)
    // 6개 카테고리, 각 2-3개 → 최소 12개
    expect(all.length).toBeGreaterThanOrEqual(12)
    // 모든 ChatIntent 카테고리가 포함되어 있는지 확인
    const categories = new Set(all.map(e => e.category))
    Object.values(ChatIntent).forEach(intent => {
      expect(categories.has(intent)).toBe(true)
    })
  })

  it('should_have_user_assistant_pairs_in_each_category', () => {
    const intents = Object.values(ChatIntent)
    intents.forEach(intent => {
      const examples = registry.getExamples(intent)
      const roles = examples.map(e => e.role)
      expect(roles).toContain('user')
      expect(roles).toContain('assistant')
    })
  })
})
