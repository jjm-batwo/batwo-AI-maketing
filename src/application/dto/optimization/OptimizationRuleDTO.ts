/**
 * OptimizationRule DTO 정의
 *
 * 자동 최적화 규칙 생성/응답/로그 DTO 및 변환 함수.
 */
import { OptimizationRule } from '@domain/entities/OptimizationRule'
import type { RuleType } from '@domain/entities/OptimizationRule'

// ----------------------------------------
// CreateOptimizationRuleDTO
// ----------------------------------------
export interface CreateOptimizationRuleDTO {
  campaignId: string
  userId: string
  name: string
  ruleType: RuleType
  conditions: { metric: string; operator: string; value: number }[]
  actions: { type: string; params?: { percentage?: number; notifyChannel?: string } }[]
  isEnabled?: boolean
  cooldownMinutes?: number
}

// ----------------------------------------
// UpdateOptimizationRuleDTO
// ----------------------------------------
export interface UpdateOptimizationRuleDTO {
  ruleId: string
  userId: string
  name?: string
  conditions?: { metric: string; operator: string; value: number }[]
  actions?: { type: string; params?: { percentage?: number; notifyChannel?: string } }[]
  isEnabled?: boolean
  cooldownMinutes?: number
}

// ----------------------------------------
// OptimizationRuleResponseDTO
// ----------------------------------------
export interface OptimizationRuleResponseDTO {
  id: string
  campaignId: string
  userId: string
  name: string
  ruleType: string
  conditions: { metric: string; operator: string; value: number }[]
  actions: { type: string; params: Record<string, unknown> }[]
  isEnabled: boolean
  lastTriggeredAt: string | null
  triggerCount: number
  cooldownMinutes: number
  createdAt: string
  updatedAt: string
}

// ----------------------------------------
// OptimizationLogDTO
// ----------------------------------------
export interface OptimizationLogDTO {
  id: string
  ruleId: string
  campaignId: string
  actionType: string
  actionParams: Record<string, unknown> | null
  estimatedSavings: number | null
  executedAt: string
}

// ----------------------------------------
// 변환 함수
// ----------------------------------------
export function toOptimizationRuleDTO(rule: OptimizationRule): OptimizationRuleResponseDTO {
  return {
    id: rule.id,
    campaignId: rule.campaignId,
    userId: rule.userId,
    name: rule.name,
    ruleType: rule.ruleType,
    conditions: rule.conditions.map(c => c.toJSON()),
    actions: rule.actions.map(a => ({
      type: a.type,
      params: a.params as Record<string, unknown>,
    })),
    isEnabled: rule.isEnabled,
    lastTriggeredAt: rule.lastTriggeredAt?.toISOString() ?? null,
    triggerCount: rule.triggerCount,
    cooldownMinutes: rule.cooldownMinutes,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  }
}
