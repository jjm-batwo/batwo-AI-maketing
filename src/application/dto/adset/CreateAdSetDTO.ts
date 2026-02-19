export interface CreateAdSetDTO {
  campaignId: string
  name: string
  dailyBudget?: number
  lifetimeBudget?: number
  currency?: string
  billingEvent?: string
  optimizationGoal?: string
  bidStrategy?: string
  targeting?: Record<string, unknown>
  placements?: Record<string, unknown>
  schedule?: Record<string, unknown>
  startDate: string
  endDate?: string
}
