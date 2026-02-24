import { z } from 'zod'

const ruleTypeEnum = z.enum(['CPA_THRESHOLD', 'ROAS_FLOOR', 'BUDGET_PACE', 'CREATIVE_FATIGUE'])

const conditionMetricEnum = z.enum(['cpa', 'roas', 'ctr', 'cpc', 'cvr', 'spend_pace'])
const conditionOperatorEnum = z.enum(['gt', 'lt', 'gte', 'lte'])

const actionTypeEnum = z.enum(['PAUSE_CAMPAIGN', 'REDUCE_BUDGET', 'INCREASE_BUDGET', 'ALERT_ONLY'])

const ruleConditionSchema = z.object({
  metric: conditionMetricEnum,
  operator: conditionOperatorEnum,
  value: z.number(),
})

const ruleActionSchema = z.object({
  type: actionTypeEnum,
  params: z.object({
    percentage: z.number().min(1).max(100).optional(),
    notifyChannel: z.enum(['email', 'in_app', 'slack']).optional(),
  }).optional(),
})

export const createOptimizationRuleSchema = z.object({
  campaignId: z.string().uuid('유효한 캠페인 ID가 필요합니다'),
  name: z.string().min(1, '규칙 이름은 필수입니다').max(255),
  ruleType: ruleTypeEnum,
  conditions: z.array(ruleConditionSchema).min(1, '조건은 최소 1개 필요합니다'),
  actions: z.array(ruleActionSchema).min(1, '액션은 최소 1개 필요합니다'),
  isEnabled: z.boolean().optional(),
  cooldownMinutes: z.number().int().min(5).max(1440).optional(),
})

export const updateOptimizationRuleSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  conditions: z.array(ruleConditionSchema).min(1).optional(),
  actions: z.array(ruleActionSchema).min(1).optional(),
  isEnabled: z.boolean().optional(),
  cooldownMinutes: z.number().int().min(5).max(1440).optional(),
})

export const optimizationRuleQuerySchema = z.object({
  campaignId: z.string().uuid().optional(),
})

export type CreateOptimizationRuleInput = z.infer<typeof createOptimizationRuleSchema>
export type UpdateOptimizationRuleInput = z.infer<typeof updateOptimizationRuleSchema>
export type OptimizationRuleQueryParams = z.infer<typeof optimizationRuleQuerySchema>
