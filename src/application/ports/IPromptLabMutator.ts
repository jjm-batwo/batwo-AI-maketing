// src/application/ports/IPromptLabMutator.ts
import type { PromptVariant } from '@domain/value-objects/PromptLabTypes'

export interface IPromptLabMutator {
  mutate(base: PromptVariant): PromptVariant
}
