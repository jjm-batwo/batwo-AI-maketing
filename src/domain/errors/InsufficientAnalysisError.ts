import type { KnowledgeDomain } from '@domain/value-objects/MarketingScience'

export class InsufficientAnalysisError extends Error {
  constructor(
    public readonly analyzedCount: number,
    public readonly requiredCount: number,
    public readonly failedDomains: KnowledgeDomain[]
  ) {
    super(
      `Insufficient domain analysis: ${analyzedCount}/${requiredCount} domains succeeded. ` +
      `Failed: ${failedDomains.join(', ')}`
    )
    this.name = 'InsufficientAnalysisError'
  }
}
