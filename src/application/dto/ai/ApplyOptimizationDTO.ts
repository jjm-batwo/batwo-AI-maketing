import { ApplyAction } from '@/domain/value-objects/ApplyAction'

export interface ApplyOptimizationDTO {
  userId: string
  conversationId?: string
  action: ApplyAction
}

export interface ApplyOptimizationResult {
  pendingActionId: string
  requiresConfirmation: boolean
  details: { label: string; value: string; changed?: boolean }[]
  warnings: string[]
  expiresAt: Date
}
