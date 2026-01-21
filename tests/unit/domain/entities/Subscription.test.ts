import { describe, it, expect, beforeEach } from 'vitest'
import { Subscription, type CreateSubscriptionProps } from '@domain/entities/Subscription'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'
import { InvalidSubscriptionError } from '@domain/errors/InvalidSubscriptionError'

describe('Subscription', () => {
  let validProps: CreateSubscriptionProps

  beforeEach(() => {
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days later

    validProps = {
      userId: 'user-123',
      plan: SubscriptionPlan.STARTER,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    }
  })

  describe('create', () => {
    it('should create subscription with valid props', () => {
      const subscription = Subscription.create(validProps)

      expect(subscription.userId).toBe(validProps.userId)
      expect(subscription.plan).toBe(SubscriptionPlan.STARTER)
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE)
      expect(subscription.id).toBeDefined()
      expect(subscription.createdAt).toBeDefined()
      expect(subscription.updatedAt).toBeDefined()
    })

    it('should create trialing subscription when specified', () => {
      const subscription = Subscription.create({
        ...validProps,
        status: SubscriptionStatus.TRIALING,
      })

      expect(subscription.status).toBe(SubscriptionStatus.TRIALING)
    })

    it('should throw error if period end is before period start', () => {
      const invalidProps = {
        ...validProps,
        currentPeriodEnd: new Date(validProps.currentPeriodStart.getTime() - 1000),
      }

      expect(() => Subscription.create(invalidProps)).toThrow(InvalidSubscriptionError)
    })
  })

  describe('restore', () => {
    it('should restore subscription from existing props', () => {
      const now = new Date()
      const existingProps = {
        id: 'sub-123',
        userId: 'user-123',
        plan: SubscriptionPlan.PRO,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      }

      const subscription = Subscription.restore(existingProps)

      expect(subscription.id).toBe(existingProps.id)
      expect(subscription.plan).toBe(SubscriptionPlan.PRO)
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE)
    })
  })

  describe('cancel', () => {
    it('should cancel an active subscription', () => {
      const subscription = Subscription.create(validProps)
      const cancelled = subscription.cancel()

      expect(cancelled.status).toBe(SubscriptionStatus.CANCELLED)
      expect(cancelled.cancelledAt).toBeDefined()
    })

    it('should cancel a trialing subscription', () => {
      const subscription = Subscription.create({
        ...validProps,
        status: SubscriptionStatus.TRIALING,
      })
      const cancelled = subscription.cancel()

      expect(cancelled.status).toBe(SubscriptionStatus.CANCELLED)
    })

    it('should throw error when cancelling already cancelled subscription', () => {
      const subscription = Subscription.create(validProps)
      const cancelled = subscription.cancel()

      expect(() => cancelled.cancel()).toThrow(InvalidSubscriptionError)
    })

    it('should throw error when cancelling expired subscription', () => {
      const now = new Date()
      const expired = Subscription.restore({
        id: 'sub-123',
        userId: 'user-123',
        plan: SubscriptionPlan.STARTER,
        status: SubscriptionStatus.EXPIRED,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      })

      expect(() => expired.cancel()).toThrow(InvalidSubscriptionError)
    })
  })

  describe('markPastDue', () => {
    it('should mark active subscription as past due', () => {
      const subscription = Subscription.create(validProps)
      const pastDue = subscription.markPastDue()

      expect(pastDue.status).toBe(SubscriptionStatus.PAST_DUE)
    })

    it('should not mark non-active subscription as past due', () => {
      const subscription = Subscription.create({
        ...validProps,
        status: SubscriptionStatus.TRIALING,
      })

      expect(() => subscription.markPastDue()).toThrow(InvalidSubscriptionError)
    })
  })

  describe('reactivate', () => {
    it('should reactivate a past due subscription', () => {
      const subscription = Subscription.create(validProps)
      const pastDue = subscription.markPastDue()
      const reactivated = pastDue.reactivate()

      expect(reactivated.status).toBe(SubscriptionStatus.ACTIVE)
    })

    it('should not reactivate a cancelled subscription', () => {
      const subscription = Subscription.create(validProps)
      const cancelled = subscription.cancel()

      expect(() => cancelled.reactivate()).toThrow(InvalidSubscriptionError)
    })
  })

  describe('activate', () => {
    it('should activate a trialing subscription', () => {
      const subscription = Subscription.create({
        ...validProps,
        status: SubscriptionStatus.TRIALING,
      })
      const activated = subscription.activate()

      expect(activated.status).toBe(SubscriptionStatus.ACTIVE)
    })

    it('should throw error when activating non-trialing subscription', () => {
      const subscription = Subscription.create(validProps)

      expect(() => subscription.activate()).toThrow(InvalidSubscriptionError)
    })
  })

  describe('renew', () => {
    it('should renew active subscription with new period', () => {
      const subscription = Subscription.create(validProps)
      const newPeriodEnd = new Date(
        subscription.currentPeriodEnd.getTime() + 30 * 24 * 60 * 60 * 1000
      )

      const renewed = subscription.renew(newPeriodEnd)

      expect(renewed.currentPeriodStart.getTime()).toBe(subscription.currentPeriodEnd.getTime())
      expect(renewed.currentPeriodEnd.getTime()).toBe(newPeriodEnd.getTime())
      expect(renewed.status).toBe(SubscriptionStatus.ACTIVE)
    })

    it('should throw error when renewing cancelled subscription', () => {
      const subscription = Subscription.create(validProps).cancel()
      const newPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

      expect(() => subscription.renew(newPeriodEnd)).toThrow(InvalidSubscriptionError)
    })
  })

  describe('changePlan', () => {
    it('should change plan for active subscription', () => {
      const subscription = Subscription.create(validProps)
      const changed = subscription.changePlan(SubscriptionPlan.PRO)

      expect(changed.plan).toBe(SubscriptionPlan.PRO)
    })

    it('should throw error when changing plan to same plan', () => {
      const subscription = Subscription.create(validProps)

      expect(() => subscription.changePlan(SubscriptionPlan.STARTER)).toThrow(
        InvalidSubscriptionError
      )
    })

    it('should throw error when changing plan of cancelled subscription', () => {
      const subscription = Subscription.create(validProps).cancel()

      expect(() => subscription.changePlan(SubscriptionPlan.PRO)).toThrow(InvalidSubscriptionError)
    })
  })

  describe('state checks', () => {
    it('should correctly identify active subscription', () => {
      const subscription = Subscription.create(validProps)

      expect(subscription.isActive()).toBe(true)
      expect(subscription.isCancelled()).toBe(false)
      expect(subscription.isTrialing()).toBe(false)
      expect(subscription.isPastDue()).toBe(false)
    })

    it('should correctly identify cancelled subscription', () => {
      const subscription = Subscription.create(validProps).cancel()

      expect(subscription.isActive()).toBe(false)
      expect(subscription.isCancelled()).toBe(true)
    })

    it('should correctly identify trialing subscription', () => {
      const subscription = Subscription.create({
        ...validProps,
        status: SubscriptionStatus.TRIALING,
      })

      expect(subscription.isTrialing()).toBe(true)
      expect(subscription.isActive()).toBe(false)
    })

    it('should correctly identify past due subscription', () => {
      const subscription = Subscription.create(validProps).markPastDue()

      expect(subscription.isPastDue()).toBe(true)
      expect(subscription.isActive()).toBe(false)
    })

    it('should correctly check if subscription has access (active or trialing)', () => {
      const active = Subscription.create(validProps)
      const trialing = Subscription.create({
        ...validProps,
        status: SubscriptionStatus.TRIALING,
      })
      const cancelled = Subscription.create(validProps).cancel()

      expect(active.hasAccess()).toBe(true)
      expect(trialing.hasAccess()).toBe(true)
      expect(cancelled.hasAccess()).toBe(false)
    })
  })

  describe('daysUntilExpiry', () => {
    it('should return correct days until expiry', () => {
      const now = new Date()
      const periodEnd = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) // 15 days later

      const subscription = Subscription.create({
        ...validProps,
        currentPeriodEnd: periodEnd,
      })

      const days = subscription.daysUntilExpiry()
      expect(days).toBeGreaterThanOrEqual(14)
      expect(days).toBeLessThanOrEqual(15)
    })

    it('should return 0 for expired subscription', () => {
      const now = new Date()
      const past = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const subscription = Subscription.restore({
        id: 'sub-123',
        userId: 'user-123',
        plan: SubscriptionPlan.STARTER,
        status: SubscriptionStatus.EXPIRED,
        currentPeriodStart: new Date(past.getTime() - 30 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: past,
        createdAt: now,
        updatedAt: now,
      })

      expect(subscription.daysUntilExpiry()).toBe(0)
    })
  })

  describe('toJSON', () => {
    it('should serialize subscription to JSON', () => {
      const subscription = Subscription.create(validProps)
      const json = subscription.toJSON()

      expect(json.id).toBe(subscription.id)
      expect(json.userId).toBe(subscription.userId)
      expect(json.plan).toBe(subscription.plan)
      expect(json.status).toBe(subscription.status)
      expect(json.currentPeriodStart.getTime()).toBe(subscription.currentPeriodStart.getTime())
      expect(json.currentPeriodEnd.getTime()).toBe(subscription.currentPeriodEnd.getTime())
    })
  })
})
