/**
 * PrismaOptimizationRuleRepository
 *
 * IOptimizationRuleRepository의 Prisma 구현체.
 * JSON 필드(conditions, actions)를 도메인 값 객체로 변환.
 */
import { PrismaClient, Prisma } from '@/generated/prisma'

type JsonValue = Prisma.InputJsonValue
import { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import { OptimizationRule } from '@domain/entities/OptimizationRule'
import type { RuleType } from '@domain/entities/OptimizationRule'
import { RuleCondition } from '@domain/value-objects/RuleCondition'
import { RuleAction } from '@domain/value-objects/RuleAction'
import type { ConditionMetric, ConditionOperator } from '@domain/value-objects/RuleCondition'
import type { ActionType, NotifyChannel } from '@domain/value-objects/RuleAction'

type PrismaOptimizationRule = {
  id: string
  campaignId: string
  userId: string
  name: string
  ruleType: string
  conditions: unknown
  actions: unknown
  isEnabled: boolean
  lastTriggeredAt: Date | null
  triggerCount: number
  cooldownMinutes: number
  createdAt: Date
  updatedAt: Date
}

function toDomain(record: PrismaOptimizationRule): OptimizationRule {
  const conditions = (record.conditions as { metric: string; operator: string; value: number }[]).map(
    c => RuleCondition.create(c.metric as ConditionMetric, c.operator as ConditionOperator, c.value)
  )
  const actions = (record.actions as { type: string; params?: { percentage?: number; notifyChannel?: string } }[]).map(
    a => RuleAction.create(a.type as ActionType, {
      percentage: a.params?.percentage,
      notifyChannel: a.params?.notifyChannel as NotifyChannel | undefined,
    })
  )

  return OptimizationRule.restore({
    id: record.id,
    campaignId: record.campaignId,
    userId: record.userId,
    name: record.name,
    ruleType: record.ruleType as RuleType,
    conditions,
    actions,
    isEnabled: record.isEnabled,
    lastTriggeredAt: record.lastTriggeredAt,
    triggerCount: record.triggerCount,
    cooldownMinutes: record.cooldownMinutes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  })
}

function toCreateData(rule: OptimizationRule) {
  return {
    id: rule.id,
    campaignId: rule.campaignId,
    userId: rule.userId,
    name: rule.name,
    ruleType: rule.ruleType,
    conditions: rule.conditions.map(c => c.toJSON()) as unknown as JsonValue,
    actions: rule.actions.map(a => a.toJSON()) as unknown as JsonValue,
    isEnabled: rule.isEnabled,
    lastTriggeredAt: rule.lastTriggeredAt,
    triggerCount: rule.triggerCount,
    cooldownMinutes: rule.cooldownMinutes,
    createdAt: rule.createdAt,
    updatedAt: rule.updatedAt,
  }
}

export class PrismaOptimizationRuleRepository implements IOptimizationRuleRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(rule: OptimizationRule): Promise<OptimizationRule> {
    const data = toCreateData(rule)

    const saved = await this.prisma.optimizationRule.upsert({
      where: { id: rule.id },
      create: data,
      update: {
        name: data.name,
        ruleType: data.ruleType,
        conditions: data.conditions,
        actions: data.actions,
        isEnabled: data.isEnabled,
        lastTriggeredAt: data.lastTriggeredAt,
        triggerCount: data.triggerCount,
        cooldownMinutes: data.cooldownMinutes,
        updatedAt: data.updatedAt,
      },
    })

    return toDomain(saved as PrismaOptimizationRule)
  }

  async findById(id: string): Promise<OptimizationRule | null> {
    const record = await this.prisma.optimizationRule.findUnique({ where: { id } })
    if (!record) return null
    return toDomain(record as PrismaOptimizationRule)
  }

  async findByCampaignId(campaignId: string): Promise<OptimizationRule[]> {
    const records = await this.prisma.optimizationRule.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map(r => toDomain(r as PrismaOptimizationRule))
  }

  async findByUserId(userId: string): Promise<OptimizationRule[]> {
    const records = await this.prisma.optimizationRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map(r => toDomain(r as PrismaOptimizationRule))
  }

  async findEnabledRules(): Promise<OptimizationRule[]> {
    const records = await this.prisma.optimizationRule.findMany({
      where: { isEnabled: true },
      orderBy: { createdAt: 'asc' },
    })
    return records.map(r => toDomain(r as PrismaOptimizationRule))
  }

  async findEnabledByCampaignId(campaignId: string): Promise<OptimizationRule[]> {
    const records = await this.prisma.optimizationRule.findMany({
      where: { campaignId, isEnabled: true },
      orderBy: { createdAt: 'asc' },
    })
    return records.map(r => toDomain(r as PrismaOptimizationRule))
  }

  async delete(id: string): Promise<void> {
    await this.prisma.optimizationRule.delete({ where: { id } })
  }

  async deleteByCampaignId(campaignId: string): Promise<void> {
    await this.prisma.optimizationRule.deleteMany({ where: { campaignId } })
  }
}
