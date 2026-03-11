export type ActionType =
  | 'budget_change'
  | 'status_change'
  | 'bid_strategy_change'
  | 'targeting_change'

export interface ApplyAction {
  type: ActionType
  campaignId: string
  description: string // "예산 20% 증액"
  currentValue: unknown
  suggestedValue: unknown
  expectedImpact: string // "ROAS +15% 예상"
  confidence: number // 0-1
}

export function isHighConfidenceAction(action: ApplyAction): boolean {
  return action.confidence >= 0.7
}
