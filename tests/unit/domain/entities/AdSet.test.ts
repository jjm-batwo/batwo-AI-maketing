import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AdSet } from '@domain/entities/AdSet'
import { AdSetStatus } from '@domain/value-objects/AdSetStatus'
import { BillingEvent } from '@domain/value-objects/BillingEvent'
import { OptimizationGoal } from '@domain/value-objects/OptimizationGoal'
import { BidStrategy } from '@domain/value-objects/BidStrategy'
import { Money } from '@domain/value-objects/Money'
import { InvalidAdSetError } from '@domain/errors/InvalidAdSetError'

describe('AdSet Entity', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const validProps = {
    campaignId: 'campaign-123',
    name: '타겟 광고 세트',
    dailyBudget: Money.create(50000, 'KRW'),
    startDate: new Date('2025-01-20'),
  }

  describe('create', () => {
    it('should create an adset with valid data and daily budget', () => {
      const adSet = AdSet.create(validProps)

      expect(adSet.id).toBeDefined()
      expect(adSet.campaignId).toBe('campaign-123')
      expect(adSet.name).toBe('타겟 광고 세트')
      expect(adSet.status).toBe(AdSetStatus.DRAFT)
      expect(adSet.dailyBudget?.amount).toBe(50000)
      expect(adSet.lifetimeBudget).toBeUndefined()
      expect(adSet.startDate).toEqual(new Date('2025-01-20'))
      expect(adSet.endDate).toBeUndefined()
      expect(adSet.billingEvent).toBe(BillingEvent.IMPRESSIONS)
      expect(adSet.optimizationGoal).toBe(OptimizationGoal.CONVERSIONS)
      expect(adSet.bidStrategy).toBe(BidStrategy.LOWEST_COST_WITHOUT_CAP)
    })

    it('should create an adset with lifetime budget', () => {
      const adSet = AdSet.create({
        ...validProps,
        dailyBudget: undefined,
        lifetimeBudget: Money.create(1000000, 'KRW'),
        endDate: new Date('2025-02-20'),
      })

      expect(adSet.dailyBudget).toBeUndefined()
      expect(adSet.lifetimeBudget?.amount).toBe(1000000)
    })

    it('should create an adset with custom billing event and optimization goal', () => {
      const adSet = AdSet.create({
        ...validProps,
        billingEvent: BillingEvent.LINK_CLICKS,
        optimizationGoal: OptimizationGoal.LINK_CLICKS,
        bidStrategy: BidStrategy.COST_CAP,
      })

      expect(adSet.billingEvent).toBe(BillingEvent.LINK_CLICKS)
      expect(adSet.optimizationGoal).toBe(OptimizationGoal.LINK_CLICKS)
      expect(adSet.bidStrategy).toBe(BidStrategy.COST_CAP)
    })

    it('should create an adset with targeting and placements', () => {
      const targeting = { ageMin: 25, ageMax: 45, locations: ['Seoul'] }
      const placements = { platforms: ['facebook', 'instagram'] }

      const adSet = AdSet.create({
        ...validProps,
        targeting,
        placements,
      })

      expect(adSet.targeting).toEqual(targeting)
      expect(adSet.placements).toEqual(placements)
    })

    it('should throw error when name is empty', () => {
      expect(() =>
        AdSet.create({ ...validProps, name: '' })
      ).toThrow('AdSet name is required')
    })

    it('should throw error when name is whitespace only', () => {
      expect(() =>
        AdSet.create({ ...validProps, name: '   ' })
      ).toThrow('AdSet name is required')
    })

    it('should throw error when name exceeds 255 characters', () => {
      const longName = 'a'.repeat(256)
      expect(() =>
        AdSet.create({ ...validProps, name: longName })
      ).toThrow('AdSet name cannot exceed 255 characters')
    })

    it('should throw error when neither daily nor lifetime budget provided', () => {
      expect(() =>
        AdSet.create({
          ...validProps,
          dailyBudget: undefined,
        })
      ).toThrow('Either daily budget or lifetime budget is required')
    })

    it('should throw error when daily budget is zero', () => {
      expect(() =>
        AdSet.create({
          ...validProps,
          dailyBudget: Money.create(0, 'KRW'),
        })
      ).toThrow('Budget must be greater than zero')
    })

    it('should throw error when lifetime budget is zero', () => {
      expect(() =>
        AdSet.create({
          ...validProps,
          dailyBudget: undefined,
          lifetimeBudget: Money.create(0, 'KRW'),
        })
      ).toThrow('Budget must be greater than zero')
    })

    it('should throw error when start date is in the past', () => {
      expect(() =>
        AdSet.create({
          ...validProps,
          startDate: new Date('2025-01-10'),
        })
      ).toThrow('Start date cannot be in the past')
    })

    it('should throw error when end date is before start date', () => {
      expect(() =>
        AdSet.create({
          ...validProps,
          startDate: new Date('2025-01-20'),
          endDate: new Date('2025-01-15'),
        })
      ).toThrow('End date cannot be before start date')
    })
  })

  describe('changeStatus', () => {
    it('should change status from DRAFT to ACTIVE', () => {
      const adSet = AdSet.create(validProps)
      const updated = adSet.changeStatus(AdSetStatus.ACTIVE)

      expect(updated.status).toBe(AdSetStatus.ACTIVE)
      expect(adSet.status).toBe(AdSetStatus.DRAFT) // 원본 불변
    })

    it('should change status from ACTIVE to PAUSED', () => {
      const adSet = AdSet.create(validProps).changeStatus(AdSetStatus.ACTIVE)
      const updated = adSet.changeStatus(AdSetStatus.PAUSED)

      expect(updated.status).toBe(AdSetStatus.PAUSED)
    })

    it('should change status from PAUSED to ACTIVE', () => {
      const adSet = AdSet.create(validProps)
        .changeStatus(AdSetStatus.ACTIVE)
        .changeStatus(AdSetStatus.PAUSED)

      const updated = adSet.changeStatus(AdSetStatus.ACTIVE)
      expect(updated.status).toBe(AdSetStatus.ACTIVE)
    })

    it('should change status from ACTIVE to ARCHIVED', () => {
      const adSet = AdSet.create(validProps).changeStatus(AdSetStatus.ACTIVE)
      const updated = adSet.changeStatus(AdSetStatus.ARCHIVED)

      expect(updated.status).toBe(AdSetStatus.ARCHIVED)
    })

    it('should change status from PAUSED to ARCHIVED', () => {
      const adSet = AdSet.create(validProps)
        .changeStatus(AdSetStatus.ACTIVE)
        .changeStatus(AdSetStatus.PAUSED)

      const updated = adSet.changeStatus(AdSetStatus.ARCHIVED)
      expect(updated.status).toBe(AdSetStatus.ARCHIVED)
    })

    it('should change status from DRAFT to DELETED', () => {
      const adSet = AdSet.create(validProps)
      const updated = adSet.changeStatus(AdSetStatus.DELETED)

      expect(updated.status).toBe(AdSetStatus.DELETED)
    })

    it('should throw error for invalid transition from DRAFT to PAUSED', () => {
      const adSet = AdSet.create(validProps)

      expect(() => adSet.changeStatus(AdSetStatus.PAUSED)).toThrow(
        'Cannot change status from DRAFT to PAUSED'
      )
    })

    it('should throw error for invalid transition from ARCHIVED', () => {
      const adSet = AdSet.create(validProps)
        .changeStatus(AdSetStatus.ACTIVE)
        .changeStatus(AdSetStatus.ARCHIVED)

      expect(() => adSet.changeStatus(AdSetStatus.ACTIVE)).toThrow(
        'Cannot change status from ARCHIVED to ACTIVE'
      )
    })

    it('should throw error for invalid transition from DELETED', () => {
      const adSet = AdSet.create(validProps)
        .changeStatus(AdSetStatus.DELETED)

      expect(() => adSet.changeStatus(AdSetStatus.ACTIVE)).toThrow(
        'Cannot change status from DELETED to ACTIVE'
      )
    })
  })

  describe('updateBudget', () => {
    it('should update daily budget', () => {
      const adSet = AdSet.create(validProps)
      const updated = adSet.updateBudget({
        dailyBudget: Money.create(100000, 'KRW'),
      })

      expect(updated.dailyBudget?.amount).toBe(100000)
      expect(adSet.dailyBudget?.amount).toBe(50000) // 원본 불변
    })

    it('should update lifetime budget', () => {
      const adSet = AdSet.create({
        ...validProps,
        dailyBudget: undefined,
        lifetimeBudget: Money.create(500000, 'KRW'),
      })

      const updated = adSet.updateBudget({
        lifetimeBudget: Money.create(1000000, 'KRW'),
      })

      expect(updated.lifetimeBudget?.amount).toBe(1000000)
    })

    it('should throw error when both budgets become undefined', () => {
      const adSet = AdSet.create(validProps)

      expect(() =>
        adSet.updateBudget({ dailyBudget: undefined })
      ).toThrow('Either daily budget or lifetime budget is required')
    })
  })

  describe('updateTargeting', () => {
    it('should update targeting', () => {
      const adSet = AdSet.create(validProps)
      const newTargeting = { ageMin: 18, ageMax: 65, locations: ['Busan'] }

      const updated = adSet.updateTargeting(newTargeting)

      expect(updated.targeting).toEqual(newTargeting)
      expect(adSet.targeting).toBeUndefined() // 원본 불변
    })
  })

  describe('restore', () => {
    it('should restore adset from persisted data', () => {
      const props = {
        id: 'adset-123',
        campaignId: 'campaign-456',
        name: '복원된 광고 세트',
        status: AdSetStatus.ACTIVE,
        dailyBudget: Money.create(30000, 'KRW'),
        lifetimeBudget: undefined,
        currency: 'KRW' as const,
        billingEvent: BillingEvent.IMPRESSIONS,
        optimizationGoal: OptimizationGoal.REACH,
        bidStrategy: BidStrategy.COST_CAP,
        targeting: { ageMin: 20 },
        placements: undefined,
        schedule: undefined,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        metaAdSetId: 'meta-789',
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-15'),
      }

      const adSet = AdSet.restore(props)

      expect(adSet.id).toBe('adset-123')
      expect(adSet.campaignId).toBe('campaign-456')
      expect(adSet.status).toBe(AdSetStatus.ACTIVE)
      expect(adSet.dailyBudget?.amount).toBe(30000)
      expect(adSet.optimizationGoal).toBe(OptimizationGoal.REACH)
      expect(adSet.bidStrategy).toBe(BidStrategy.COST_CAP)
      expect(adSet.metaAdSetId).toBe('meta-789')
    })
  })

  describe('toJSON', () => {
    it('should serialize adset to JSON', () => {
      const adSet = AdSet.create(validProps)
      const json = adSet.toJSON()

      expect(json.id).toBe(adSet.id)
      expect(json.campaignId).toBe('campaign-123')
      expect(json.name).toBe('타겟 광고 세트')
      expect(json.status).toBe(AdSetStatus.DRAFT)
      expect(json.dailyBudget?.amount).toBe(50000)
      expect(json.startDate).toEqual(new Date('2025-01-20'))
      expect(json.createdAt).toBeDefined()
      expect(json.updatedAt).toBeDefined()
    })
  })

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      const adSet = AdSet.create(validProps)
      const updated = adSet.changeStatus(AdSetStatus.ACTIVE)

      expect(adSet).not.toBe(updated)
      expect(adSet.status).toBe(AdSetStatus.DRAFT)
      expect(updated.status).toBe(AdSetStatus.ACTIVE)
    })
  })
})
