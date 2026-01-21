import { describe, it, expect } from 'vitest'
import {
  SubscriptionPlan,
  PLAN_CONFIGS,
  getPlanConfig,
  getPlanLabel,
  getPlanPrice,
  getPlanFeatures,
  isFreePlan,
  isPaidPlan,
  getAllPlans,
  getPaidPlans,
  canUpgradeTo,
  PLAN_HIERARCHY,
} from '@domain/value-objects/SubscriptionPlan'

describe('SubscriptionPlan', () => {
  describe('enum values', () => {
    it('should have FREE plan', () => {
      expect(SubscriptionPlan.FREE).toBe('FREE')
    })

    it('should have STARTER plan', () => {
      expect(SubscriptionPlan.STARTER).toBe('STARTER')
    })

    it('should have PRO plan', () => {
      expect(SubscriptionPlan.PRO).toBe('PRO')
    })

    it('should have ENTERPRISE plan', () => {
      expect(SubscriptionPlan.ENTERPRISE).toBe('ENTERPRISE')
    })
  })

  describe('plan hierarchy', () => {
    it('should have correct hierarchy values', () => {
      expect(PLAN_HIERARCHY[SubscriptionPlan.FREE]).toBe(0)
      expect(PLAN_HIERARCHY[SubscriptionPlan.STARTER]).toBe(1)
      expect(PLAN_HIERARCHY[SubscriptionPlan.PRO]).toBe(2)
      expect(PLAN_HIERARCHY[SubscriptionPlan.ENTERPRISE]).toBe(3)
    })
  })

  describe('PLAN_CONFIGS', () => {
    it('should have config for FREE plan', () => {
      const config = PLAN_CONFIGS[SubscriptionPlan.FREE]
      expect(config.label).toBe('무료')
      expect(config.price).toBe(0)
      expect(config.campaignsPerWeek).toBe(5)
      expect(config.aiCopyPerDay).toBe(20)
      expect(config.aiAnalysisPerWeek).toBe(5)
    })

    it('should have config for STARTER plan', () => {
      const config = PLAN_CONFIGS[SubscriptionPlan.STARTER]
      expect(config.label).toBe('스타터')
      expect(config.price).toBe(49000)
      expect(config.campaignsPerWeek).toBe(20)
      expect(config.aiCopyPerDay).toBe(100)
      expect(config.aiAnalysisPerWeek).toBe(20)
    })

    it('should have config for PRO plan', () => {
      const config = PLAN_CONFIGS[SubscriptionPlan.PRO]
      expect(config.label).toBe('프로')
      expect(config.price).toBe(149000)
      expect(config.campaignsPerWeek).toBe(-1) // unlimited
      expect(config.aiCopyPerDay).toBe(-1) // unlimited
      expect(config.aiAnalysisPerWeek).toBe(-1) // unlimited
    })

    it('should have config for ENTERPRISE plan', () => {
      const config = PLAN_CONFIGS[SubscriptionPlan.ENTERPRISE]
      expect(config.label).toBe('엔터프라이즈')
      expect(config.price).toBe(-1) // custom pricing
      expect(config.campaignsPerWeek).toBe(-1) // unlimited
      expect(config.aiCopyPerDay).toBe(-1) // unlimited
      expect(config.aiAnalysisPerWeek).toBe(-1) // unlimited
    })
  })

  describe('helper functions', () => {
    describe('getPlanConfig', () => {
      it('should return config for given plan', () => {
        const config = getPlanConfig(SubscriptionPlan.STARTER)
        expect(config.label).toBe('스타터')
        expect(config.price).toBe(49000)
      })
    })

    describe('getPlanLabel', () => {
      it('should return label for FREE', () => {
        expect(getPlanLabel(SubscriptionPlan.FREE)).toBe('무료')
      })

      it('should return label for STARTER', () => {
        expect(getPlanLabel(SubscriptionPlan.STARTER)).toBe('스타터')
      })

      it('should return label for PRO', () => {
        expect(getPlanLabel(SubscriptionPlan.PRO)).toBe('프로')
      })

      it('should return label for ENTERPRISE', () => {
        expect(getPlanLabel(SubscriptionPlan.ENTERPRISE)).toBe('엔터프라이즈')
      })
    })

    describe('getPlanPrice', () => {
      it('should return 0 for FREE', () => {
        expect(getPlanPrice(SubscriptionPlan.FREE)).toBe(0)
      })

      it('should return 49000 for STARTER', () => {
        expect(getPlanPrice(SubscriptionPlan.STARTER)).toBe(49000)
      })

      it('should return 149000 for PRO', () => {
        expect(getPlanPrice(SubscriptionPlan.PRO)).toBe(149000)
      })

      it('should return -1 (custom) for ENTERPRISE', () => {
        expect(getPlanPrice(SubscriptionPlan.ENTERPRISE)).toBe(-1)
      })
    })

    describe('getPlanFeatures', () => {
      it('should return features for given plan', () => {
        const features = getPlanFeatures(SubscriptionPlan.STARTER)
        expect(features).toContain('캠페인 20회/주')
        expect(features).toContain('AI 카피 100회/일')
        expect(features).toContain('AI 분석 20회/주')
      })

      it('should return unlimited features for PRO plan', () => {
        const features = getPlanFeatures(SubscriptionPlan.PRO)
        expect(features).toContain('캠페인 무제한')
        expect(features).toContain('AI 카피 무제한')
        expect(features).toContain('AI 분석 무제한')
      })
    })

    describe('isFreePlan', () => {
      it('should return true for FREE', () => {
        expect(isFreePlan(SubscriptionPlan.FREE)).toBe(true)
      })

      it('should return false for paid plans', () => {
        expect(isFreePlan(SubscriptionPlan.STARTER)).toBe(false)
        expect(isFreePlan(SubscriptionPlan.PRO)).toBe(false)
        expect(isFreePlan(SubscriptionPlan.ENTERPRISE)).toBe(false)
      })
    })

    describe('isPaidPlan', () => {
      it('should return false for FREE', () => {
        expect(isPaidPlan(SubscriptionPlan.FREE)).toBe(false)
      })

      it('should return true for paid plans', () => {
        expect(isPaidPlan(SubscriptionPlan.STARTER)).toBe(true)
        expect(isPaidPlan(SubscriptionPlan.PRO)).toBe(true)
        expect(isPaidPlan(SubscriptionPlan.ENTERPRISE)).toBe(true)
      })
    })

    describe('getAllPlans', () => {
      it('should return all plans', () => {
        const plans = getAllPlans()
        expect(plans.length).toBe(4)
        expect(plans).toContain(SubscriptionPlan.FREE)
        expect(plans).toContain(SubscriptionPlan.STARTER)
        expect(plans).toContain(SubscriptionPlan.PRO)
        expect(plans).toContain(SubscriptionPlan.ENTERPRISE)
      })
    })

    describe('getPaidPlans', () => {
      it('should return only paid plans', () => {
        const plans = getPaidPlans()
        expect(plans.length).toBe(3)
        expect(plans).not.toContain(SubscriptionPlan.FREE)
        expect(plans).toContain(SubscriptionPlan.STARTER)
        expect(plans).toContain(SubscriptionPlan.PRO)
        expect(plans).toContain(SubscriptionPlan.ENTERPRISE)
      })
    })

    describe('canUpgradeTo', () => {
      it('should allow upgrade from FREE to any paid plan', () => {
        expect(canUpgradeTo(SubscriptionPlan.FREE, SubscriptionPlan.STARTER)).toBe(true)
        expect(canUpgradeTo(SubscriptionPlan.FREE, SubscriptionPlan.PRO)).toBe(true)
        expect(canUpgradeTo(SubscriptionPlan.FREE, SubscriptionPlan.ENTERPRISE)).toBe(true)
      })

      it('should allow upgrade from STARTER to higher plans', () => {
        expect(canUpgradeTo(SubscriptionPlan.STARTER, SubscriptionPlan.PRO)).toBe(true)
        expect(canUpgradeTo(SubscriptionPlan.STARTER, SubscriptionPlan.ENTERPRISE)).toBe(true)
      })

      it('should not allow upgrade to same plan', () => {
        expect(canUpgradeTo(SubscriptionPlan.STARTER, SubscriptionPlan.STARTER)).toBe(false)
      })

      it('should not allow downgrade', () => {
        expect(canUpgradeTo(SubscriptionPlan.PRO, SubscriptionPlan.STARTER)).toBe(false)
        expect(canUpgradeTo(SubscriptionPlan.STARTER, SubscriptionPlan.FREE)).toBe(false)
      })
    })
  })
})
