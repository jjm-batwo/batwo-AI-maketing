// tests/unit/infrastructure/prompt-lab/PromptLabMutator.test.ts
import { describe, it, expect } from 'vitest'
import { PromptLabMutator } from '@infrastructure/prompt-lab/PromptLabMutator'
import { createDefaultVariant } from '@domain/value-objects/PromptLabTypes'

describe('PromptLabMutator', () => {
  const mutator = new PromptLabMutator()

  it('should mutate exactly 1 axis from baseline', () => {
    const baseline = createDefaultVariant()
    const mutated = mutator.mutate(baseline)

    let changedAxes = 0
    if (JSON.stringify(mutated.scienceDomains) !== JSON.stringify(baseline.scienceDomains)) changedAxes++
    if (mutated.temperature !== baseline.temperature) changedAxes++
    if (mutated.fewShotStrategy !== baseline.fewShotStrategy) changedAxes++
    if (mutated.systemRole !== baseline.systemRole) changedAxes++
    if (mutated.instructionStyle !== baseline.instructionStyle) changedAxes++

    expect(changedAxes).toBe(1)
  })

  it('should generate different mutations across calls', () => {
    const baseline = createDefaultVariant()
    const mutations = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const m = mutator.mutate(baseline)
      mutations.add(m.description)
    }
    expect(mutations.size).toBeGreaterThan(1)
  })

  it('should keep scienceDomains >= 3 (MIN_REQUIRED_DOMAINS)', () => {
    const baseline = createDefaultVariant()
    for (let i = 0; i < 50; i++) {
      const m = mutator.mutate(baseline)
      expect(m.scienceDomains.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('should keep temperature in 0.3-1.0 range', () => {
    const baseline = createDefaultVariant()
    for (let i = 0; i < 50; i++) {
      const m = mutator.mutate(baseline)
      expect(m.temperature).toBeGreaterThanOrEqual(0.3)
      expect(m.temperature).toBeLessThanOrEqual(1.0)
    }
  })

  it('should always set a description', () => {
    const baseline = createDefaultVariant()
    const mutated = mutator.mutate(baseline)
    expect(mutated.description).not.toBe('baseline')
    expect(mutated.description.length).toBeGreaterThan(0)
  })
})
