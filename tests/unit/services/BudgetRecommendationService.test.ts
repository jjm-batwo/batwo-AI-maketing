/**
 * BudgetRecommendationService 단위 테스트
 *
 * 테스트 범위:
 * - AOV 기반 ROAS 계산
 * - 업종/규모별 예산 범위 계산
 * - 월 예산 → 일일 예산 변환
 * - 기존 광고 데이터 기반 추천
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BudgetRecommendationService } from '@application/services/BudgetRecommendationService'
import {
  calculateTargetROAS,
  calculateDailyBudgetFromMonthly,
  calculateBudgetRange,
  calculateTestBudget,
  calculateTargetCPA,
  getAOVTier,
  MINIMUM_DAILY_BUDGET,
  INDUSTRY_BUDGET_BENCHMARKS,
  BUSINESS_SCALE_MULTIPLIERS,
  type Industry,
  type BusinessScale,
  type ExistingCampaignData,
} from '@domain/value-objects/BudgetRecommendation'

describe('BudgetRecommendationService', () => {
  let service: BudgetRecommendationService

  beforeEach(() => {
    service = new BudgetRecommendationService()
  })

  describe('generateRecommendation', () => {
    it('should generate recommendation with industry defaults', () => {
      const result = service.generateRecommendation({
        industry: 'ecommerce',
        businessScale: 'small',
      })

      expect(result).toBeDefined()
      expect(result.dailyBudget.min).toBe(MINIMUM_DAILY_BUDGET)
      expect(result.dailyBudget.recommended).toBeGreaterThanOrEqual(MINIMUM_DAILY_BUDGET)
      expect(result.source).toBe('industry')
      expect(result.aovSource).toBe('industry_default')
      expect(result.targetROAS).toBeGreaterThan(0)
      expect(result.tips).toBeInstanceOf(Array)
      expect(result.tips.length).toBeGreaterThan(0)
    })

    it('should use user-provided AOV over industry default', () => {
      const userAOV = 150000
      const result = service.generateRecommendation({
        industry: 'ecommerce',
        businessScale: 'small',
        averageOrderValue: userAOV,
      })

      expect(result.aovUsed).toBe(userAOV)
      expect(result.aovSource).toBe('user_input')
    })

    it('should prioritize Meta data AOV over user input', () => {
      const metaAOV = 85000
      const existingData: ExistingCampaignData = {
        avgDailySpend: 100000,
        avgROAS: 3.2,
        avgCPA: 15000,
        avgAOV: metaAOV,
        totalSpend30Days: 3000000,
        totalRevenue30Days: 9600000,
        totalPurchases30Days: 113,
      }

      const result = service.generateRecommendation({
        industry: 'ecommerce',
        businessScale: 'small',
        averageOrderValue: 50000, // User input - should be ignored
        existingCampaignData: existingData,
      })

      expect(result.aovUsed).toBe(metaAOV)
      expect(result.aovSource).toBe('meta_data')
    })

    it('should use monthly budget for daily budget calculation', () => {
      const monthlyBudget = 3000000 // 300만원

      const result = service.generateRecommendation({
        industry: 'ecommerce',
        businessScale: 'small',
        monthlyMarketingBudget: monthlyBudget,
      })

      expect(result.source).toBe('monthly_budget')
      // 월 300만원 → 일 100,000원
      expect(result.dailyBudget.recommended).toBe(100000)
    })

    it('should prioritize existing data for budget calculation', () => {
      const existingData: ExistingCampaignData = {
        avgDailySpend: 80000,
        avgROAS: 3.5, // 목표 대비 117% (3.5/3.0)
        avgCPA: 12000,
        avgAOV: 65000,
        totalSpend30Days: 2400000,
        totalRevenue30Days: 8400000,
        totalPurchases30Days: 129,
      }

      const result = service.generateRecommendation({
        industry: 'ecommerce',
        businessScale: 'small',
        monthlyMarketingBudget: 5000000, // Should be ignored
        existingCampaignData: existingData,
      })

      expect(result.source).toBe('existing_data')
      expect(result.comparison).toBeDefined()
    })

    it('should include comparison data when existing campaign data is provided', () => {
      const existingData: ExistingCampaignData = {
        avgDailySpend: 50000,
        avgROAS: 2.0,
        avgCPA: 20000,
        avgAOV: 60000,
        totalSpend30Days: 1500000,
        totalRevenue30Days: 3000000,
        totalPurchases30Days: 50,
      }

      const result = service.generateRecommendation({
        industry: 'ecommerce',
        businessScale: 'small',
        existingCampaignData: existingData,
      })

      expect(result.comparison).toBeDefined()
      expect(result.comparison?.currentVsRecommended).toBeDefined()
      expect(result.comparison?.potentialImpact).toBeDefined()
    })

    it('should generate test budget for 7 days', () => {
      const result = service.generateRecommendation({
        industry: 'ecommerce',
        businessScale: 'small',
      })

      expect(result.testBudget).toBe(result.dailyBudget.recommended * 7)
    })
  })

  describe('validateBudget', () => {
    it('should reject budget below minimum', () => {
      const result = service.validateBudget(30000)

      expect(result.valid).toBe(false)
      expect(result.message).toContain('최소')
    })

    it('should accept valid budget', () => {
      const result = service.validateBudget(100000)

      expect(result.valid).toBe(true)
      expect(result.message).toBeUndefined()
    })

    it('should reject excessively high budget', () => {
      const result = service.validateBudget(20000000)

      expect(result.valid).toBe(false)
      expect(result.message).toContain('너무 높습니다')
    })
  })

  describe('getIndustryDefaultAOV', () => {
    it('should return correct default AOV for each industry', () => {
      const industries: Industry[] = [
        'ecommerce', 'food_beverage', 'beauty', 'fashion',
        'education', 'service', 'saas', 'other'
      ]

      industries.forEach((industry) => {
        const aov = service.getIndustryDefaultAOV(industry)
        expect(aov).toBe(INDUSTRY_BUDGET_BENCHMARKS[industry].defaultAOV)
      })
    })
  })

  describe('getIndustryDefaultCPA', () => {
    it('should return correct default CPA for each industry', () => {
      const industries: Industry[] = [
        'ecommerce', 'food_beverage', 'beauty', 'fashion',
        'education', 'service', 'saas', 'other'
      ]

      industries.forEach((industry) => {
        const cpa = service.getIndustryDefaultCPA(industry)
        expect(cpa).toBe(INDUSTRY_BUDGET_BENCHMARKS[industry].averageCPA)
      })
    })
  })
})

describe('BudgetRecommendation Value Objects', () => {
  describe('calculateTargetROAS', () => {
    /**
     * ROAS 계산 로직:
     * - 기본 공식: (1 / 마진율) * 1.5 = baseTargetROAS
     * - 최종 ROAS = max(baseTargetROAS, 티어별 최소 ROAS)
     *
     * 기본 마진율 30%의 경우:
     * - breakEvenROAS = 1 / 0.3 ≈ 3.33
     * - baseTargetROAS = 3.33 * 1.5 = 5.0
     * - 모든 티어의 최소값(4.0, 3.0, 2.5, 2.0, 1.5)보다 높으므로 5.0 반환
     */

    it('should return ~5.0x with default 30% margin rate (base formula dominates)', () => {
      // 기본 마진율 30%: (1/0.3) * 1.5 = 5.0
      expect(calculateTargetROAS(25000)).toBe(5)
      expect(calculateTargetROAS(50000)).toBe(5)
      expect(calculateTargetROAS(100000)).toBe(5)
      expect(calculateTargetROAS(200000)).toBe(5)
      expect(calculateTargetROAS(500000)).toBe(5)
    })

    it('should use tier minimum ROAS when margin rate is high (tier floor kicks in)', () => {
      // 높은 마진율 80%: (1/0.8) * 1.5 = 1.875
      // 이 경우 티어별 최소값이 적용됨
      expect(calculateTargetROAS(25000, 0.8)).toBe(4.0)   // 저가: 최소 400%
      expect(calculateTargetROAS(50000, 0.8)).toBe(3.0)   // 중저가: 최소 300%
      expect(calculateTargetROAS(100000, 0.8)).toBe(2.5)  // 중가: 최소 250%
      expect(calculateTargetROAS(200000, 0.8)).toBe(2.0)  // 중고가: 최소 200%
      expect(calculateTargetROAS(500000, 0.8)).toBe(1.875) // 고가: base가 1.875, 최소 1.5 → 1.875
    })

    it('should use base formula when margin is low', () => {
      // 낮은 마진율 10%: (1/0.1) * 1.5 = 15
      const lowMarginResult = calculateTargetROAS(50000, 0.1)
      expect(lowMarginResult).toBe(15) // base formula dominates
    })

    it('should never go below tier minimum ROAS', () => {
      // 매우 높은 마진율 90%: (1/0.9) * 1.5 ≈ 1.67
      expect(calculateTargetROAS(25000, 0.9)).toBe(4.0)   // 저가 최소 4.0
      expect(calculateTargetROAS(50000, 0.9)).toBe(3.0)   // 중저가 최소 3.0
      expect(calculateTargetROAS(100000, 0.9)).toBe(2.5)  // 중가 최소 2.5
      expect(calculateTargetROAS(200000, 0.9)).toBe(2.0)  // 중고가 최소 2.0
      // 고가(1.5)보다 base(1.67)가 높으므로 1.67 반환
      expect(calculateTargetROAS(500000, 0.9)).toBeCloseTo(1.67, 1)
    })
  })

  describe('getAOVTier', () => {
    it('should correctly classify AOV tiers', () => {
      expect(getAOVTier(20000)).toBe('low')
      expect(getAOVTier(50000)).toBe('mid_low')
      expect(getAOVTier(100000)).toBe('mid')
      expect(getAOVTier(200000)).toBe('mid_high')
      expect(getAOVTier(500000)).toBe('high')
    })
  })

  describe('calculateDailyBudgetFromMonthly', () => {
    it('should return minimum budget for low monthly budgets', () => {
      // 100만원 이하 → 최소 예산
      expect(calculateDailyBudgetFromMonthly(1000000)).toBe(MINIMUM_DAILY_BUDGET)
      expect(calculateDailyBudgetFromMonthly(500000)).toBe(MINIMUM_DAILY_BUDGET)
    })

    it('should calculate 100% ratio for ₩1.5M~₩3M', () => {
      // 300만원 ÷ 30 = 100,000원
      expect(calculateDailyBudgetFromMonthly(3000000)).toBe(100000)
    })

    it('should calculate 70% ratio for ₩3M~₩10M', () => {
      // 500만원 × 0.7 ÷ 30 ≈ 116,667원
      const result = calculateDailyBudgetFromMonthly(5000000)
      expect(result).toBeCloseTo(116667, -2) // Within 100
    })

    it('should calculate 60% ratio for ₩10M+', () => {
      // 2000만원 × 0.6 ÷ 30 = 400,000원
      expect(calculateDailyBudgetFromMonthly(20000000)).toBe(400000)
    })
  })

  describe('calculateBudgetRange', () => {
    it('should apply business scale multipliers correctly', () => {
      const ecommerceSmall = calculateBudgetRange('ecommerce', 'small')
      const ecommerceMedium = calculateBudgetRange('ecommerce', 'medium')
      const ecommerceLarge = calculateBudgetRange('ecommerce', 'large')

      // small = 1.0x, medium = 2.0x, large = 5.0x
      expect(ecommerceMedium.recommended).toBe(ecommerceSmall.recommended * 2)
      expect(ecommerceLarge.recommended).toBe(ecommerceSmall.recommended * 5)
    })

    it('should set min to MINIMUM_DAILY_BUDGET', () => {
      const individualBudget = calculateBudgetRange('service', 'individual')

      expect(individualBudget.min).toBe(MINIMUM_DAILY_BUDGET)
      // Note: recommended can be below min when scale multiplier < 1
      // This is the current implementation behavior
      // service (70,000) * individual (0.5) = 35,000
      expect(individualBudget.recommended).toBe(35000)
    })

    it('should return correct budget for all industry/scale combinations', () => {
      const industries: Industry[] = ['ecommerce', 'food_beverage', 'beauty', 'fashion', 'education', 'service', 'saas', 'other']
      const scales: BusinessScale[] = ['individual', 'small', 'medium', 'large']

      industries.forEach((industry) => {
        scales.forEach((scale) => {
          const range = calculateBudgetRange(industry, scale)
          const benchmark = INDUSTRY_BUDGET_BENCHMARKS[industry]
          const scaleConfig = BUSINESS_SCALE_MULTIPLIERS[scale]

          // min is always MINIMUM_DAILY_BUDGET
          expect(range.min).toBe(MINIMUM_DAILY_BUDGET)
          // recommended is benchmark * multiplier (can be below min for individual scale)
          expect(range.recommended).toBe(Math.round(benchmark.dailyBudget.recommended * scaleConfig.multiplier))
          // max is benchmark.max * multiplier
          expect(range.max).toBe(Math.round(benchmark.dailyBudget.max * scaleConfig.multiplier))
        })
      })
    })
  })

  describe('calculateTestBudget', () => {
    it('should calculate 7 days of daily budget', () => {
      expect(calculateTestBudget(100000)).toBe(700000)
      expect(calculateTestBudget(50000)).toBe(350000)
    })
  })

  describe('calculateTargetCPA', () => {
    it('should calculate CPA from AOV and ROAS', () => {
      // CPA = AOV / ROAS
      expect(calculateTargetCPA(60000, 3.0)).toBe(20000)
      expect(calculateTargetCPA(100000, 2.5)).toBe(40000)
      expect(calculateTargetCPA(300000, 1.5)).toBe(200000)
    })
  })

  describe('MINIMUM_DAILY_BUDGET constant', () => {
    it('should be ₩50,000', () => {
      expect(MINIMUM_DAILY_BUDGET).toBe(50000)
    })
  })

  describe('INDUSTRY_BUDGET_BENCHMARKS', () => {
    it('should have all 8 industries defined', () => {
      const industries: Industry[] = [
        'ecommerce', 'food_beverage', 'beauty', 'fashion',
        'education', 'service', 'saas', 'other'
      ]

      industries.forEach((industry) => {
        expect(INDUSTRY_BUDGET_BENCHMARKS[industry]).toBeDefined()
        expect(INDUSTRY_BUDGET_BENCHMARKS[industry].label).toBeDefined()
        expect(INDUSTRY_BUDGET_BENCHMARKS[industry].dailyBudget).toBeDefined()
        expect(INDUSTRY_BUDGET_BENCHMARKS[industry].averageCPA).toBeGreaterThan(0)
        expect(INDUSTRY_BUDGET_BENCHMARKS[industry].defaultAOV).toBeGreaterThan(0)
      })
    })
  })

  describe('BUSINESS_SCALE_MULTIPLIERS', () => {
    it('should have correct multipliers', () => {
      expect(BUSINESS_SCALE_MULTIPLIERS.individual.multiplier).toBe(0.5)
      expect(BUSINESS_SCALE_MULTIPLIERS.small.multiplier).toBe(1.0)
      expect(BUSINESS_SCALE_MULTIPLIERS.medium.multiplier).toBe(2.0)
      expect(BUSINESS_SCALE_MULTIPLIERS.large.multiplier).toBe(5.0)
    })
  })
})
