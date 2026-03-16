// src/infrastructure/prompt-lab/PromptLabMutator.ts
import type { PromptVariant } from '@domain/value-objects/PromptLabTypes'
import { ALL_KNOWLEDGE_DOMAINS, MIN_REQUIRED_DOMAINS } from '@domain/value-objects/MarketingScience'
import type { KnowledgeDomain } from '@domain/value-objects/MarketingScience'

type MutationAxis = 'scienceDomains' | 'temperature' | 'fewShotStrategy' | 'systemRole' | 'instructionStyle'

const SYSTEM_ROLES = ['expert_marketer', 'consumer_psychologist', 'data_analyst', 'creative_director']
const INSTRUCTION_STYLES: PromptVariant['instructionStyle'][] = ['strict', 'moderate', 'loose']
const FEW_SHOT_STRATEGIES: PromptVariant['fewShotStrategy'][] = ['industry', 'hook', 'topPerformer']

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export class PromptLabMutator {
  private axes: MutationAxis[] = [
    'scienceDomains', 'temperature', 'fewShotStrategy', 'systemRole', 'instructionStyle',
  ]

  mutate(base: PromptVariant): PromptVariant {
    const axis = this.axes[Math.floor(Math.random() * this.axes.length)]
    const mutated = { ...base, id: `variant-${crypto.randomUUID().slice(0, 8)}` }

    switch (axis) {
      case 'scienceDomains':
        mutated.scienceDomains = this.mutateDomains(base.scienceDomains)
        mutated.description = `science context → ${mutated.scienceDomains.length}개 도메인`
        break

      case 'temperature': {
        const delta = pickRandom([-0.2, -0.1, 0.1, 0.2])
        const raw = Math.round((base.temperature + delta) * 10) / 10
        mutated.temperature = Math.max(0.3, Math.min(1.0, raw))
        if (mutated.temperature === base.temperature) {
          mutated.temperature = base.temperature >= 0.7 ? 0.5 : 0.9
        }
        mutated.description = `temperature → ${mutated.temperature}`
        break
      }

      case 'fewShotStrategy': {
        const others = FEW_SHOT_STRATEGIES.filter((s) => s !== base.fewShotStrategy)
        mutated.fewShotStrategy = pickRandom(others)
        mutated.description = `few-shot strategy → ${mutated.fewShotStrategy}`
        break
      }

      case 'systemRole': {
        const others = SYSTEM_ROLES.filter((r) => r !== base.systemRole)
        mutated.systemRole = pickRandom(others)
        mutated.description = `system role → ${mutated.systemRole}`
        break
      }

      case 'instructionStyle': {
        const others = INSTRUCTION_STYLES.filter((s) => s !== base.instructionStyle)
        mutated.instructionStyle = pickRandom(others)
        mutated.description = `instruction style → ${mutated.instructionStyle}`
        break
      }
    }

    return mutated
  }

  private mutateDomains(current: KnowledgeDomain[]): KnowledgeDomain[] {
    const all = [...ALL_KNOWLEDGE_DOMAINS]

    if (current.length > MIN_REQUIRED_DOMAINS && Math.random() < 0.5) {
      const idx = Math.floor(Math.random() * current.length)
      return current.filter((_, i) => i !== idx)
    }

    if (current.length < all.length) {
      const missing = all.filter((d) => !current.includes(d))
      if (missing.length > 0) {
        return [...current, pickRandom(missing)]
      }
    }

    const idx = Math.floor(Math.random() * current.length)
    const removed = current.filter((_, i) => i !== idx)
    const missing = all.filter((d) => !removed.includes(d))
    if (missing.length > 0) {
      return [...removed, pickRandom(missing)]
    }
    return current
  }
}
