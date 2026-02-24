/**
 * SavingsCalculator 값 객체 테스트
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest'
import { SavingsCalculator } from '@domain/value-objects/SavingsCalculator'
import { RuleAction } from '@domain/value-objects/RuleAction'
import { KPI } from '@domain/entities/KPI'
import { Money } from '@domain/value-objects/Money'

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

describe('SavingsCalculator', () => {
  describe('calculateWastedSpend', () => {
    it('should_sum_spend_of_campaigns_below_roas_threshold', () => {
      // ROAS < 1.0 기준: campaign A ROAS=0.5 (낭비), campaign B ROAS=4.0 (정상)
      const wastedKPI = createTestKPI({
        campaignId: 'campaign-a',
        spend: Money.create(300000, 'KRW'),
        revenue: Money.create(150000, 'KRW'), // ROAS=0.5
      })
      const goodKPI = createTestKPI({
        campaignId: 'campaign-b',
        spend: Money.create(200000, 'KRW'),
        revenue: Money.create(800000, 'KRW'), // ROAS=4.0
      })

      const result = SavingsCalculator.calculateWastedSpend([wastedKPI, goodKPI], 1.0)
      expect(result.amount).toBe(300000)
      expect(result.currency).toBe('KRW')
    })

    it('should_return_zero_when_all_campaigns_meet_threshold', () => {
      const goodKPI = createTestKPI({
        spend: Money.create(200000, 'KRW'),
        revenue: Money.create(800000, 'KRW'), // ROAS=4.0
      })

      const result = SavingsCalculator.calculateWastedSpend([goodKPI], 1.0)
      expect(result.amount).toBe(0)
    })

    it('should_use_default_threshold_of_1_0_when_not_specified', () => {
      const wastedKPI = createTestKPI({
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(50000, 'KRW'), // ROAS=0.5 < 1.0
      })

      const result = SavingsCalculator.calculateWastedSpend([wastedKPI])
      expect(result.amount).toBe(100000)
    })

    it('should_return_zero_for_empty_kpi_list', () => {
      const result = SavingsCalculator.calculateWastedSpend([])
      expect(result.amount).toBe(0)
    })

    it('should_sum_multiple_wasted_campaigns', () => {
      const wasted1 = createTestKPI({
        campaignId: 'c1',
        spend: Money.create(100000, 'KRW'),
        revenue: Money.create(50000, 'KRW'), // ROAS=0.5
      })
      const wasted2 = createTestKPI({
        campaignId: 'c2',
        spend: Money.create(200000, 'KRW'),
        revenue: Money.create(100000, 'KRW'), // ROAS=0.5
      })

      const result = SavingsCalculator.calculateWastedSpend([wasted1, wasted2], 1.0)
      expect(result.amount).toBe(300000)
    })
  })

  describe('calculateProjectedSavings', () => {
    it('should_return_full_spend_for_pause_campaign_action', () => {
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
      })
      const action = RuleAction.pauseCampaign()

      const result = SavingsCalculator.calculateProjectedSavings(kpi, action)
      expect(result.amount).toBe(500000)
    })

    it('should_return_percentage_of_spend_for_reduce_budget_action', () => {
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
      })
      const action = RuleAction.reduceBudget(30) // 30% 감소

      const result = SavingsCalculator.calculateProjectedSavings(kpi, action)
      expect(result.amount).toBe(150000) // 500000 * 30% = 150000
    })

    it('should_return_zero_for_alert_only_action', () => {
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
      })
      const action = RuleAction.alertOnly('email')

      const result = SavingsCalculator.calculateProjectedSavings(kpi, action)
      expect(result.amount).toBe(0)
    })

    it('should_return_zero_for_increase_budget_action', () => {
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
      })
      const action = RuleAction.create('INCREASE_BUDGET', { percentage: 20 })

      const result = SavingsCalculator.calculateProjectedSavings(kpi, action)
      expect(result.amount).toBe(0)
    })

    it('should_return_zero_for_reduce_budget_without_percentage', () => {
      const kpi = createTestKPI({
        spend: Money.create(500000, 'KRW'),
      })
      const action = RuleAction.create('REDUCE_BUDGET', {}) // percentage 없음

      const result = SavingsCalculator.calculateProjectedSavings(kpi, action)
      expect(result.amount).toBe(0)
    })
  })

  describe('calculateMonthlyImpact', () => {
    it('should_multiply_daily_savings_by_30', () => {
      const dailySavings = Money.create(10000, 'KRW')
      const result = SavingsCalculator.calculateMonthlyImpact(dailySavings)
      expect(result.amount).toBe(300000)
    })

    it('should_return_zero_for_zero_daily_savings', () => {
      const dailySavings = Money.create(0, 'KRW')
      const result = SavingsCalculator.calculateMonthlyImpact(dailySavings)
      expect(result.amount).toBe(0)
    })

    it('should_preserve_currency', () => {
      const dailySavings = Money.create(100, 'USD')
      const result = SavingsCalculator.calculateMonthlyImpact(dailySavings)
      expect(result.currency).toBe('USD')
      expect(result.amount).toBe(3000)
    })
  })

  describe('calculateSavingsFromOptimization', () => {
    it('should_return_difference_when_after_spend_is_lower', () => {
      const beforeKPI = createTestKPI({
        spend: Money.create(500000, 'KRW'),
      })
      const afterKPI = createTestKPI({
        spend: Money.create(350000, 'KRW'),
      })

      const result = SavingsCalculator.calculateSavingsFromOptimization(beforeKPI, afterKPI)
      expect(result.amount).toBe(150000)
    })

    it('should_return_zero_when_after_spend_is_higher', () => {
      const beforeKPI = createTestKPI({
        spend: Money.create(300000, 'KRW'),
      })
      const afterKPI = createTestKPI({
        spend: Money.create(500000, 'KRW'),
      })

      const result = SavingsCalculator.calculateSavingsFromOptimization(beforeKPI, afterKPI)
      expect(result.amount).toBe(0)
    })

    it('should_return_zero_when_spend_is_equal', () => {
      const beforeKPI = createTestKPI({
        spend: Money.create(400000, 'KRW'),
      })
      const afterKPI = createTestKPI({
        spend: Money.create(400000, 'KRW'),
      })

      const result = SavingsCalculator.calculateSavingsFromOptimization(beforeKPI, afterKPI)
      expect(result.amount).toBe(0)
    })
  })
})
