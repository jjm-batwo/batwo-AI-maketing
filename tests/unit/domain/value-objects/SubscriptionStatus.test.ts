import { describe, it, expect } from 'vitest'
import {
  SubscriptionStatus,
  SUBSCRIPTION_STATUS_TRANSITIONS,
  canTransitionSubscription,
  isActiveSubscription,
  isCancelledSubscription,
  isTrialingSubscription,
  isPastDue,
  getStatusLabel,
  getStatusDescription,
  getAllSubscriptionStatuses,
} from '@domain/value-objects/SubscriptionStatus'

describe('SubscriptionStatus', () => {
  describe('enum values', () => {
    it('should have TRIALING status', () => {
      expect(SubscriptionStatus.TRIALING).toBe('TRIALING')
    })

    it('should have ACTIVE status', () => {
      expect(SubscriptionStatus.ACTIVE).toBe('ACTIVE')
    })

    it('should have PAST_DUE status', () => {
      expect(SubscriptionStatus.PAST_DUE).toBe('PAST_DUE')
    })

    it('should have CANCELLED status', () => {
      expect(SubscriptionStatus.CANCELLED).toBe('CANCELLED')
    })

    it('should have EXPIRED status', () => {
      expect(SubscriptionStatus.EXPIRED).toBe('EXPIRED')
    })
  })

  describe('status transitions', () => {
    it('should allow TRIALING to transition to ACTIVE or CANCELLED', () => {
      const allowed = SUBSCRIPTION_STATUS_TRANSITIONS[SubscriptionStatus.TRIALING]
      expect(allowed).toContain(SubscriptionStatus.ACTIVE)
      expect(allowed).toContain(SubscriptionStatus.CANCELLED)
      expect(allowed).not.toContain(SubscriptionStatus.PAST_DUE)
    })

    it('should allow ACTIVE to transition to PAST_DUE or CANCELLED', () => {
      const allowed = SUBSCRIPTION_STATUS_TRANSITIONS[SubscriptionStatus.ACTIVE]
      expect(allowed).toContain(SubscriptionStatus.PAST_DUE)
      expect(allowed).toContain(SubscriptionStatus.CANCELLED)
    })

    it('should allow PAST_DUE to transition to ACTIVE, CANCELLED, or EXPIRED', () => {
      const allowed = SUBSCRIPTION_STATUS_TRANSITIONS[SubscriptionStatus.PAST_DUE]
      expect(allowed).toContain(SubscriptionStatus.ACTIVE)
      expect(allowed).toContain(SubscriptionStatus.CANCELLED)
      expect(allowed).toContain(SubscriptionStatus.EXPIRED)
    })

    it('should not allow CANCELLED to transition to any status', () => {
      const allowed = SUBSCRIPTION_STATUS_TRANSITIONS[SubscriptionStatus.CANCELLED]
      expect(allowed.length).toBe(0)
    })

    it('should not allow EXPIRED to transition to any status', () => {
      const allowed = SUBSCRIPTION_STATUS_TRANSITIONS[SubscriptionStatus.EXPIRED]
      expect(allowed.length).toBe(0)
    })
  })

  describe('canTransitionSubscription', () => {
    it('should return true for valid transitions', () => {
      expect(canTransitionSubscription(SubscriptionStatus.TRIALING, SubscriptionStatus.ACTIVE)).toBe(
        true
      )
      expect(
        canTransitionSubscription(SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE)
      ).toBe(true)
      expect(
        canTransitionSubscription(SubscriptionStatus.PAST_DUE, SubscriptionStatus.ACTIVE)
      ).toBe(true)
    })

    it('should return false for invalid transitions', () => {
      expect(
        canTransitionSubscription(SubscriptionStatus.CANCELLED, SubscriptionStatus.ACTIVE)
      ).toBe(false)
      expect(
        canTransitionSubscription(SubscriptionStatus.EXPIRED, SubscriptionStatus.ACTIVE)
      ).toBe(false)
      expect(
        canTransitionSubscription(SubscriptionStatus.TRIALING, SubscriptionStatus.PAST_DUE)
      ).toBe(false)
    })
  })

  describe('helper functions', () => {
    describe('isActiveSubscription', () => {
      it('should return true for ACTIVE', () => {
        expect(isActiveSubscription(SubscriptionStatus.ACTIVE)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(isActiveSubscription(SubscriptionStatus.TRIALING)).toBe(false)
        expect(isActiveSubscription(SubscriptionStatus.PAST_DUE)).toBe(false)
        expect(isActiveSubscription(SubscriptionStatus.CANCELLED)).toBe(false)
        expect(isActiveSubscription(SubscriptionStatus.EXPIRED)).toBe(false)
      })
    })

    describe('isCancelledSubscription', () => {
      it('should return true for CANCELLED', () => {
        expect(isCancelledSubscription(SubscriptionStatus.CANCELLED)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(isCancelledSubscription(SubscriptionStatus.ACTIVE)).toBe(false)
        expect(isCancelledSubscription(SubscriptionStatus.EXPIRED)).toBe(false)
      })
    })

    describe('isTrialingSubscription', () => {
      it('should return true for TRIALING', () => {
        expect(isTrialingSubscription(SubscriptionStatus.TRIALING)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(isTrialingSubscription(SubscriptionStatus.ACTIVE)).toBe(false)
      })
    })

    describe('isPastDue', () => {
      it('should return true for PAST_DUE', () => {
        expect(isPastDue(SubscriptionStatus.PAST_DUE)).toBe(true)
      })

      it('should return false for other statuses', () => {
        expect(isPastDue(SubscriptionStatus.ACTIVE)).toBe(false)
      })
    })
  })

  describe('labels and descriptions', () => {
    describe('getStatusLabel', () => {
      it('should return correct labels', () => {
        expect(getStatusLabel(SubscriptionStatus.TRIALING)).toBe('체험 중')
        expect(getStatusLabel(SubscriptionStatus.ACTIVE)).toBe('활성')
        expect(getStatusLabel(SubscriptionStatus.PAST_DUE)).toBe('결제 연체')
        expect(getStatusLabel(SubscriptionStatus.CANCELLED)).toBe('취소됨')
        expect(getStatusLabel(SubscriptionStatus.EXPIRED)).toBe('만료됨')
      })
    })

    describe('getStatusDescription', () => {
      it('should return correct descriptions', () => {
        expect(getStatusDescription(SubscriptionStatus.TRIALING)).toBe('무료 체험 기간 중')
        expect(getStatusDescription(SubscriptionStatus.ACTIVE)).toBe('정상 구독 중')
        expect(getStatusDescription(SubscriptionStatus.PAST_DUE)).toBe(
          '결제 실패로 인한 연체 상태'
        )
        expect(getStatusDescription(SubscriptionStatus.CANCELLED)).toBe('사용자에 의해 취소됨')
        expect(getStatusDescription(SubscriptionStatus.EXPIRED)).toBe('구독 기간 만료')
      })
    })
  })

  describe('getAllSubscriptionStatuses', () => {
    it('should return all statuses', () => {
      const statuses = getAllSubscriptionStatuses()
      expect(statuses.length).toBe(5)
      expect(statuses).toContain(SubscriptionStatus.TRIALING)
      expect(statuses).toContain(SubscriptionStatus.ACTIVE)
      expect(statuses).toContain(SubscriptionStatus.PAST_DUE)
      expect(statuses).toContain(SubscriptionStatus.CANCELLED)
      expect(statuses).toContain(SubscriptionStatus.EXPIRED)
    })
  })
})
