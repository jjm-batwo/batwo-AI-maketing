/**
 * AuditScore 값 객체 단위 테스트
 * TDD: RED → GREEN → REFACTOR
 */
import { describe, it, expect } from 'vitest'
import { AuditScore, type CampaignAuditData } from '@domain/value-objects/AuditScore'

// 테스트 픽스처: 수익성 있는 캠페인 (ROAS >= 1.0)
const makeProfitableCampaign = (overrides: Partial<CampaignAuditData> = {}): CampaignAuditData => ({
  campaignId: 'campaign-1',
  campaignName: '수익성 캠페인',
  status: 'ACTIVE',
  dailyBudget: 100000,
  currency: 'KRW',
  impressions: 10000,
  clicks: 300,     // CTR 3% (우수)
  conversions: 9,  // CVR 3% (우수)
  spend: 100000,
  revenue: 400000, // ROAS 4.0
  ...overrides,
})

// 테스트 픽스처: 손실 캠페인 (ROAS < 1.0)
const makeUnprofitableCampaign = (overrides: Partial<CampaignAuditData> = {}): CampaignAuditData => ({
  campaignId: 'campaign-2',
  campaignName: '손실 캠페인',
  status: 'ACTIVE',
  dailyBudget: 100000,
  currency: 'KRW',
  impressions: 10000,
  clicks: 40,      // CTR 0.4% (낮음)
  conversions: 0,  // 전환 없음
  spend: 100000,
  revenue: 50000,  // ROAS 0.5
  ...overrides,
})

describe('AuditScore 값 객체', () => {
  describe('등급 산정', () => {
    it('should_assign_grade_A_when_score_is_80_or_above', () => {
      expect(AuditScore.assignGrade(80)).toBe('A')
      expect(AuditScore.assignGrade(100)).toBe('A')
      expect(AuditScore.assignGrade(90)).toBe('A')
    })

    it('should_assign_grade_B_when_score_is_between_60_and_79', () => {
      expect(AuditScore.assignGrade(60)).toBe('B')
      expect(AuditScore.assignGrade(79)).toBe('B')
      expect(AuditScore.assignGrade(70)).toBe('B')
    })

    it('should_assign_grade_C_when_score_is_between_40_and_59', () => {
      expect(AuditScore.assignGrade(40)).toBe('C')
      expect(AuditScore.assignGrade(59)).toBe('C')
    })

    it('should_assign_grade_D_when_score_is_between_20_and_39', () => {
      expect(AuditScore.assignGrade(20)).toBe('D')
      expect(AuditScore.assignGrade(39)).toBe('D')
    })

    it('should_assign_grade_F_when_score_is_below_20', () => {
      expect(AuditScore.assignGrade(0)).toBe('F')
      expect(AuditScore.assignGrade(19)).toBe('F')
    })
  })

  describe('카테고리별 평가', () => {
    it('should_calculate_overall_score_as_average_of_categories', () => {
      const campaigns = [makeProfitableCampaign()]
      const result = AuditScore.evaluate(campaigns)

      // overall은 4개 카테고리 점수의 평균이어야 함
      const categoryAvg =
        result.categories.reduce((sum, cat) => sum + cat.score, 0) / result.categories.length

      expect(result.overall).toBeCloseTo(categoryAvg, 1)
      expect(result.categories).toHaveLength(4)
    })

    it('should_identify_budget_waste_when_roas_below_1', () => {
      const campaigns = [makeUnprofitableCampaign()]
      const result = AuditScore.evaluate(campaigns)

      const budgetCategory = result.categories.find(c => c.name === '예산 효율성')
      expect(budgetCategory).toBeDefined()

      // ROAS < 1.0인 캠페인이 100%이므로 낮은 점수 또는 critical 발견
      const hasCriticalOrWarning = budgetCategory!.findings.some(
        f => f.type === 'critical' || f.type === 'warning'
      )
      expect(hasCriticalOrWarning).toBe(true)
    })

    it('should_detect_missing_conversion_tracking_when_conversions_zero', () => {
      const campaigns = [makeUnprofitableCampaign({ conversions: 0 })]
      const result = AuditScore.evaluate(campaigns)

      const conversionCategory = result.categories.find(c => c.name === '전환 추적')
      expect(conversionCategory).toBeDefined()

      // 전환이 0인 캠페인이 있으면 warning 또는 critical 발견
      const hasNegativeFinding = conversionCategory!.findings.some(
        f => f.type === 'warning' || f.type === 'critical'
      )
      expect(hasNegativeFinding).toBe(true)
    })

    it('should_rate_targeting_accuracy_based_on_ctr', () => {
      // CTR > 2% 캠페인 → 타겟팅 우수
      const goodTargetingCampaign = makeProfitableCampaign({
        impressions: 10000,
        clicks: 300, // CTR 3%
      })
      const resultGood = AuditScore.evaluate([goodTargetingCampaign])
      const targetingGood = resultGood.categories.find(c => c.name === '타겟팅 정확도')
      expect(targetingGood).toBeDefined()

      // CTR < 0.5% 캠페인 → 타겟팅 낮음
      const badTargetingCampaign = makeUnprofitableCampaign({
        impressions: 10000,
        clicks: 40, // CTR 0.4%
      })
      const resultBad = AuditScore.evaluate([badTargetingCampaign])
      const targetingBad = resultBad.categories.find(c => c.name === '타겟팅 정확도')
      expect(targetingBad).toBeDefined()

      // 우수 타겟팅이 낮은 타겟팅보다 점수가 높아야 함
      expect(targetingGood!.score).toBeGreaterThan(targetingBad!.score)
    })

    it('should_rate_creative_performance_based_on_cvr', () => {
      // CVR > 3% 캠페인 → 크리에이티브 우수
      const goodCreativeCampaign = makeProfitableCampaign({
        clicks: 100,
        conversions: 5, // CVR 5%
      })
      const resultGood = AuditScore.evaluate([goodCreativeCampaign])
      const creativeGood = resultGood.categories.find(c => c.name === '크리에이티브 성과')
      expect(creativeGood).toBeDefined()

      // CVR < 1% 캠페인 → 크리에이티브 낮음
      const badCreativeCampaign = makeUnprofitableCampaign({
        clicks: 100,
        conversions: 0, // CVR 0%
      })
      const resultBad = AuditScore.evaluate([badCreativeCampaign])
      const creativeBad = resultBad.categories.find(c => c.name === '크리에이티브 성과')
      expect(creativeBad).toBeDefined()

      // 우수 크리에이티브가 낮은 크리에이티브보다 점수가 높아야 함
      expect(creativeGood!.score).toBeGreaterThan(creativeBad!.score)
    })
  })

  describe('절감 금액 계산', () => {
    it('should_calculate_estimated_waste_from_underperforming_campaigns', () => {
      // ROAS < 1.0인 캠페인 spend=100000 → estimatedWaste = spend 합산
      const campaigns = [makeUnprofitableCampaign({ spend: 100000, revenue: 50000 })]
      const result = AuditScore.evaluate(campaigns)

      // estimatedWaste = 100000 (ROAS < 1.0인 캠페인 spend 합)
      expect(result.estimatedWaste.amount).toBe(100000)
    })

    it('should_calculate_waste_for_multiple_underperforming_campaigns', () => {
      // ROAS < 1.0인 캠페인 2개: 100000 + 80000 = 180000
      const campaigns = [
        makeUnprofitableCampaign({ campaignId: 'c1', spend: 100000, revenue: 50000 }),
        makeUnprofitableCampaign({ campaignId: 'c2', spend: 80000, revenue: 30000 }),
      ]
      const result = AuditScore.evaluate(campaigns)

      expect(result.estimatedWaste.amount).toBe(180000)
    })

    it('should_return_zero_waste_when_all_campaigns_profitable', () => {
      // ROAS >= 1.0인 캠페인만 있을 때 낭비 없음
      const campaigns = [makeProfitableCampaign({ spend: 100000, revenue: 400000 })]
      const result = AuditScore.evaluate(campaigns)

      expect(result.estimatedWaste.amount).toBe(0)
    })
  })

  describe('toJSON', () => {
    it('should_serialize_to_json_with_all_fields', () => {
      const campaigns = [makeProfitableCampaign()]
      const result = AuditScore.evaluate(campaigns)
      const json = result.toJSON()

      expect(json).toHaveProperty('overall')
      expect(json).toHaveProperty('categories')
      expect(json).toHaveProperty('estimatedWaste')
      expect(json).toHaveProperty('estimatedImprovement')
      expect(json).toHaveProperty('grade')
      expect(typeof json.overall).toBe('number')
      expect(Array.isArray(json.categories)).toBe(true)
    })
  })
})
