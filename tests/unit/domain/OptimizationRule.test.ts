/**
 * OptimizationRule 도메인 엔티티 테스트
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest'
import { OptimizationRule } from '@domain/entities/OptimizationRule'
import { RuleCondition } from '@domain/value-objects/RuleCondition'
import { RuleAction } from '@domain/value-objects/RuleAction'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'

// KPI 테스트 픽스처 생성
const createTestKPI = (overrides: Partial<{
  campaignId: string
  impressions: number
  clicks: number
  linkClicks: number
  conversions: number
  spend: Money
  revenue: Money
}> = {}) =>
  KPI.create({
    campaignId: 'campaign-1',
    impressions: 10000,
    clicks: 500,
    linkClicks: 450,
    conversions: 50,
    spend: Money.create(500000, 'KRW'),
    revenue: Money.create(2000000, 'KRW'),
    date: new Date(),
    ...overrides,
  })

// 기본 테스트용 조건 및 액션
const createBasicCondition = () =>
  RuleCondition.create('roas', 'lt', 1.0)

const createBasicAction = () =>
  RuleAction.create('PAUSE_CAMPAIGN', {})

describe('OptimizationRule', () => {
  describe('create', () => {
    it('should_create_rule_with_valid_props', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: 'ROAS 하한 규칙',
        ruleType: 'ROAS_FLOOR',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })

      expect(rule.campaignId).toBe('campaign-1')
      expect(rule.userId).toBe('user-1')
      expect(rule.name).toBe('ROAS 하한 규칙')
      expect(rule.ruleType).toBe('ROAS_FLOOR')
      expect(rule.isEnabled).toBe(true)
      expect(rule.id).toBeDefined()
      expect(rule.triggerCount).toBe(0)
      expect(rule.lastTriggeredAt).toBeNull()
      expect(rule.cooldownMinutes).toBe(60)
    })

    it('should_assign_uuid_when_id_not_provided', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트 규칙',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })
      expect(rule.id).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('should_use_provided_id_when_given', () => {
      const rule = OptimizationRule.create({
        id: 'fixed-id-123',
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트 규칙',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })
      expect(rule.id).toBe('fixed-id-123')
    })

    it('should_use_custom_cooldown_when_provided', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트 규칙',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
        cooldownMinutes: 120,
      })
      expect(rule.cooldownMinutes).toBe(120)
    })

    it('should_be_immutable_after_creation', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트 규칙',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })
      expect(Object.isFrozen(rule)).toBe(true)
    })
  })

  describe('restore', () => {
    it('should_restore_rule_from_persisted_data', () => {
      const now = new Date()
      const rule = OptimizationRule.restore({
        id: 'restored-id',
        campaignId: 'campaign-2',
        userId: 'user-2',
        name: '복원된 규칙',
        ruleType: 'BUDGET_PACE',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: false,
        lastTriggeredAt: now,
        triggerCount: 5,
        cooldownMinutes: 30,
        createdAt: now,
        updatedAt: now,
      })

      expect(rule.id).toBe('restored-id')
      expect(rule.triggerCount).toBe(5)
      expect(rule.lastTriggeredAt).toEqual(now)
      expect(rule.isEnabled).toBe(false)
    })
  })

  describe('evaluate', () => {
    it('should_return_true_when_all_conditions_are_met', () => {
      // ROAS < 1.0 조건: spend=500000, revenue=300000 → ROAS=0.6
      const lowRoasKPI = createTestKPI({
        spend: Money.create(500000, 'KRW'),
        revenue: Money.create(300000, 'KRW'),
      })
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: 'ROAS 하한',
        ruleType: 'ROAS_FLOOR',
        conditions: [RuleCondition.create('roas', 'lt', 1.0)],
        actions: [createBasicAction()],
        isEnabled: true,
      })

      expect(rule.evaluate(lowRoasKPI)).toBe(true)
    })

    it('should_return_false_when_any_condition_fails', () => {
      // ROAS=4.0 → lt 1.0 조건 불충족
      const highRoasKPI = createTestKPI({
        spend: Money.create(500000, 'KRW'),
        revenue: Money.create(2000000, 'KRW'),
      })
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: 'ROAS 하한',
        ruleType: 'ROAS_FLOOR',
        conditions: [RuleCondition.create('roas', 'lt', 1.0)],
        actions: [createBasicAction()],
        isEnabled: true,
      })

      expect(rule.evaluate(highRoasKPI)).toBe(false)
    })

    it('should_evaluate_all_conditions_with_AND_logic', () => {
      // CPA > 10000 AND ROAS < 1.0
      // spend=500000, conversions=50 → CPA=10000 (not > 10000, equals)
      // ROAS=0.6 (lt 1.0 충족)
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
        revenue: Money.create(300000, 'KRW'),
        conversions: 50, // CPA = 10000
      })
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '복합 조건',
        ruleType: 'CPA_THRESHOLD',
        conditions: [
          RuleCondition.create('cpa', 'gt', 10000),  // CPA=10000, gt 10000 → false
          RuleCondition.create('roas', 'lt', 1.0),    // ROAS=0.6, lt 1.0 → true
        ],
        actions: [createBasicAction()],
        isEnabled: true,
      })

      // AND → 하나라도 false면 false
      expect(rule.evaluate(kpi)).toBe(false)
    })
  })

  describe('canTrigger', () => {
    it('should_return_true_when_never_triggered', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })
      expect(rule.canTrigger()).toBe(true)
    })

    it('should_return_false_when_within_cooldown_period', () => {
      // 쿨다운 60분, lastTriggeredAt = 30분 전
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
      const rule = OptimizationRule.restore({
        id: 'rule-1',
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
        lastTriggeredAt: thirtyMinutesAgo,
        triggerCount: 1,
        cooldownMinutes: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(rule.canTrigger()).toBe(false)
    })

    it('should_return_true_when_cooldown_has_passed', () => {
      // 쿨다운 60분, lastTriggeredAt = 90분 전
      const ninetyMinutesAgo = new Date(Date.now() - 90 * 60 * 1000)
      const rule = OptimizationRule.restore({
        id: 'rule-1',
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
        lastTriggeredAt: ninetyMinutesAgo,
        triggerCount: 1,
        cooldownMinutes: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      expect(rule.canTrigger()).toBe(true)
    })
  })

  describe('recordTrigger', () => {
    it('should_increment_trigger_count_and_set_last_triggered_at', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })

      const triggered = rule.recordTrigger()
      expect(triggered.triggerCount).toBe(1)
      expect(triggered.lastTriggeredAt).not.toBeNull()
      expect(triggered.lastTriggeredAt!.getTime()).toBeCloseTo(Date.now(), -3)
    })

    it('should_return_new_instance_preserving_immutability', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })

      const triggered = rule.recordTrigger()
      expect(triggered).not.toBe(rule)
      expect(rule.triggerCount).toBe(0) // 원본 불변
    })
  })

  describe('enable / disable', () => {
    it('should_enable_disabled_rule', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: false,
      })

      const enabled = rule.enable()
      expect(enabled.isEnabled).toBe(true)
      expect(rule.isEnabled).toBe(false) // 원본 불변
    })

    it('should_disable_enabled_rule', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })

      const disabled = rule.disable()
      expect(disabled.isEnabled).toBe(false)
    })
  })

  describe('updateConditions / updateActions', () => {
    it('should_update_conditions_and_return_new_instance', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })

      const newCondition = RuleCondition.create('cpa', 'gt', 20000)
      const updated = rule.updateConditions([newCondition])

      expect(updated.conditions).toHaveLength(1)
      expect(updated.conditions[0].metric).toBe('cpa')
      expect(rule.conditions[0].metric).toBe('roas') // 원본 불변
    })

    it('should_update_actions_and_return_new_instance', () => {
      const rule = OptimizationRule.create({
        campaignId: 'campaign-1',
        userId: 'user-1',
        name: '테스트',
        ruleType: 'CPA_THRESHOLD',
        conditions: [createBasicCondition()],
        actions: [createBasicAction()],
        isEnabled: true,
      })

      const newAction = RuleAction.reduceBudget(20)
      const updated = rule.updateActions([newAction])

      expect(updated.actions).toHaveLength(1)
      expect(updated.actions[0].type).toBe('REDUCE_BUDGET')
    })
  })

  describe('ecommercePresets', () => {
    it('should_create_3_preset_rules_for_ecommerce', () => {
      const presets = OptimizationRule.ecommercePresets('campaign-1', 'user-1')
      expect(presets).toHaveLength(3)
    })

    it('should_include_cpa_threshold_rule', () => {
      const presets = OptimizationRule.ecommercePresets('campaign-1', 'user-1')
      const cpaRule = presets.find(r => r.ruleType === 'CPA_THRESHOLD')
      expect(cpaRule).toBeDefined()
      expect(cpaRule!.isEnabled).toBe(true)
    })

    it('should_include_roas_floor_rule', () => {
      const presets = OptimizationRule.ecommercePresets('campaign-1', 'user-1')
      const roasRule = presets.find(r => r.ruleType === 'ROAS_FLOOR')
      expect(roasRule).toBeDefined()
    })

    it('should_include_budget_pace_rule', () => {
      const presets = OptimizationRule.ecommercePresets('campaign-1', 'user-1')
      const paceRule = presets.find(r => r.ruleType === 'BUDGET_PACE')
      expect(paceRule).toBeDefined()
    })

    it('should_set_campaign_and_user_ids_on_presets', () => {
      const presets = OptimizationRule.ecommercePresets('campaign-abc', 'user-xyz')
      presets.forEach(rule => {
        expect(rule.campaignId).toBe('campaign-abc')
        expect(rule.userId).toBe('user-xyz')
      })
    })
  })
})

describe('RuleCondition', () => {
  describe('create', () => {
    it('should_create_condition_with_valid_props', () => {
      const condition = RuleCondition.create('roas', 'lt', 1.0)
      expect(condition.metric).toBe('roas')
      expect(condition.operator).toBe('lt')
      expect(condition.value).toBe(1.0)
    })
  })

  describe('evaluate', () => {
    it('should_evaluate_roas_condition_correctly', () => {
      // spend=500000, revenue=300000 → ROAS=0.6
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
        revenue: Money.create(300000, 'KRW'),
      })
      const condition = RuleCondition.create('roas', 'lt', 1.0)
      expect(condition.evaluate(kpi)).toBe(true)
    })

    it('should_evaluate_cpa_condition_correctly', () => {
      // spend=500000, conversions=50 → CPA=10000
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
        conversions: 50,
      })
      const condition = RuleCondition.create('cpa', 'gt', 8000)
      expect(condition.evaluate(kpi)).toBe(true)
    })

    it('should_evaluate_ctr_condition_correctly', () => {
      // clicks=500, impressions=10000 → CTR=5%
      const kpi = createTestKPI({
        clicks: 500,
        impressions: 10000,
      })
      const condition = RuleCondition.create('ctr', 'lt', 3.0)
      expect(condition.evaluate(kpi)).toBe(false)
    })

    it('should_evaluate_cpc_condition_correctly', () => {
      // spend=500000, clicks=500 → CPC=1000
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
        clicks: 500,
      })
      const condition = RuleCondition.create('cpc', 'gt', 500)
      expect(condition.evaluate(kpi)).toBe(true)
    })

    it('should_evaluate_cvr_condition_correctly', () => {
      // conversions=50, clicks=500 → CVR=10%
      const kpi = createTestKPI({
        conversions: 50,
        clicks: 500,
      })
      const condition = RuleCondition.create('cvr', 'gte', 10.0)
      expect(condition.evaluate(kpi)).toBe(true)
    })

    it('should_evaluate_spend_pace_with_daily_budget', () => {
      // spend=600000, dailyBudget=500000 → pace=120%
      const kpi = createTestKPI({
        spend: Money.create(600000, 'KRW'),
      })
      const condition = RuleCondition.create('spend_pace', 'gt', 100)
      expect(condition.evaluate(kpi, 500000)).toBe(true)
    })

    it('should_support_gte_operator', () => {
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
        revenue: Money.create(2000000, 'KRW'),
      }) // ROAS=4.0
      const condition = RuleCondition.create('roas', 'gte', 4.0)
      expect(condition.evaluate(kpi)).toBe(true)
    })

    it('should_support_lte_operator', () => {
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
        revenue: Money.create(2000000, 'KRW'),
      }) // ROAS=4.0
      const condition = RuleCondition.create('roas', 'lte', 4.0)
      expect(condition.evaluate(kpi)).toBe(true)
    })
  })
})

describe('RuleAction', () => {
  describe('create', () => {
    it('should_create_pause_campaign_action', () => {
      const action = RuleAction.create('PAUSE_CAMPAIGN', {})
      expect(action.type).toBe('PAUSE_CAMPAIGN')
    })

    it('should_create_reduce_budget_action_with_percentage', () => {
      const action = RuleAction.create('REDUCE_BUDGET', { percentage: 30 })
      expect(action.type).toBe('REDUCE_BUDGET')
      expect(action.params.percentage).toBe(30)
    })

    it('should_create_alert_only_action_with_channel', () => {
      const action = RuleAction.create('ALERT_ONLY', { notifyChannel: 'email' })
      expect(action.type).toBe('ALERT_ONLY')
      expect(action.params.notifyChannel).toBe('email')
    })
  })

  describe('factory methods', () => {
    it('should_create_pause_campaign_via_factory', () => {
      const action = RuleAction.pauseCampaign()
      expect(action.type).toBe('PAUSE_CAMPAIGN')
    })

    it('should_create_reduce_budget_via_factory', () => {
      const action = RuleAction.reduceBudget(20)
      expect(action.type).toBe('REDUCE_BUDGET')
      expect(action.params.percentage).toBe(20)
    })

    it('should_create_alert_only_via_factory', () => {
      const action = RuleAction.alertOnly('slack')
      expect(action.type).toBe('ALERT_ONLY')
      expect(action.params.notifyChannel).toBe('slack')
    })
  })
})
