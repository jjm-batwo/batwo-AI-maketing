import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Campaign, CampaignProps, CreateCampaignProps } from '@domain/entities/Campaign'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { Money } from '@domain/value-objects/Money'

describe('Campaign', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const validCampaignProps: CreateCampaignProps = {
    userId: 'user-123',
    name: 'Summer Sale Campaign',
    objective: CampaignObjective.CONVERSIONS,
    dailyBudget: Money.create(50000, 'KRW'),
    startDate: new Date('2025-01-20'),
  }

  describe('create', () => {
    it('should create a campaign with valid data', () => {
      const campaign = Campaign.create(validCampaignProps)

      expect(campaign.id).toBeDefined()
      expect(campaign.userId).toBe('user-123')
      expect(campaign.name).toBe('Summer Sale Campaign')
      expect(campaign.objective).toBe(CampaignObjective.CONVERSIONS)
      expect(campaign.status).toBe(CampaignStatus.DRAFT)
      expect(campaign.dailyBudget.amount).toBe(50000)
      expect(campaign.startDate).toEqual(new Date('2025-01-20'))
      expect(campaign.endDate).toBeUndefined()
      expect(campaign.metaCampaignId).toBeUndefined()
    })

    it('should create a campaign with end date', () => {
      const campaign = Campaign.create({
        ...validCampaignProps,
        endDate: new Date('2025-02-20'),
      })

      expect(campaign.endDate).toEqual(new Date('2025-02-20'))
    })

    it('should throw error for negative budget (Money validation)', () => {
      // Money value object throws error before Campaign validation
      expect(() =>
        Campaign.create({
          ...validCampaignProps,
          dailyBudget: Money.create(-1000, 'KRW'),
        })
      ).toThrow('Amount cannot be negative')
    })

    it('should throw InvalidCampaignError for zero budget', () => {
      expect(() =>
        Campaign.create({
          ...validCampaignProps,
          dailyBudget: Money.create(0, 'KRW'),
        })
      ).toThrow('Daily budget must be greater than zero')
    })

    it('should throw InvalidCampaignError for past start date', () => {
      expect(() =>
        Campaign.create({
          ...validCampaignProps,
          startDate: new Date('2025-01-10'), // Past date (today is Jan 15)
        })
      ).toThrow('Start date cannot be in the past')
    })

    it('should throw InvalidCampaignError for end date before start date', () => {
      expect(() =>
        Campaign.create({
          ...validCampaignProps,
          startDate: new Date('2025-01-20'),
          endDate: new Date('2025-01-15'),
        })
      ).toThrow('End date cannot be before start date')
    })

    it('should throw InvalidCampaignError for empty name', () => {
      expect(() =>
        Campaign.create({
          ...validCampaignProps,
          name: '',
        })
      ).toThrow('Campaign name is required')
    })

    it('should throw InvalidCampaignError for name exceeding max length', () => {
      const longName = 'a'.repeat(256)

      expect(() =>
        Campaign.create({
          ...validCampaignProps,
          name: longName,
        })
      ).toThrow('Campaign name cannot exceed 255 characters')
    })
  })

  describe('changeStatus', () => {
    it('should change status from DRAFT to PENDING_REVIEW', () => {
      const campaign = Campaign.create(validCampaignProps)

      const updated = campaign.changeStatus(CampaignStatus.PENDING_REVIEW)

      expect(updated.status).toBe(CampaignStatus.PENDING_REVIEW)
      expect(campaign.status).toBe(CampaignStatus.DRAFT) // Original unchanged
    })

    it('should change status from PENDING_REVIEW to ACTIVE', () => {
      const campaign = Campaign.create(validCampaignProps).changeStatus(
        CampaignStatus.PENDING_REVIEW
      )

      const updated = campaign.changeStatus(CampaignStatus.ACTIVE)

      expect(updated.status).toBe(CampaignStatus.ACTIVE)
    })

    it('should allow pausing an active campaign', () => {
      const campaign = Campaign.create(validCampaignProps)
        .changeStatus(CampaignStatus.PENDING_REVIEW)
        .changeStatus(CampaignStatus.ACTIVE)

      const updated = campaign.changeStatus(CampaignStatus.PAUSED)

      expect(updated.status).toBe(CampaignStatus.PAUSED)
    })

    it('should allow completing an active campaign', () => {
      const campaign = Campaign.create(validCampaignProps)
        .changeStatus(CampaignStatus.PENDING_REVIEW)
        .changeStatus(CampaignStatus.ACTIVE)

      const updated = campaign.changeStatus(CampaignStatus.COMPLETED)

      expect(updated.status).toBe(CampaignStatus.COMPLETED)
    })

    it('should not allow changing status of a completed campaign', () => {
      const campaign = Campaign.create(validCampaignProps)
        .changeStatus(CampaignStatus.PENDING_REVIEW)
        .changeStatus(CampaignStatus.ACTIVE)
        .changeStatus(CampaignStatus.COMPLETED)

      expect(() => campaign.changeStatus(CampaignStatus.ACTIVE)).toThrow(
        'Cannot change status of a completed campaign'
      )
    })
  })

  describe('updateBudget', () => {
    it('should update daily budget', () => {
      const campaign = Campaign.create(validCampaignProps)
      const newBudget = Money.create(100000, 'KRW')

      const updated = campaign.updateBudget(newBudget)

      expect(updated.dailyBudget.amount).toBe(100000)
      expect(campaign.dailyBudget.amount).toBe(50000) // Original unchanged
    })

    it('should throw error for zero budget', () => {
      const campaign = Campaign.create(validCampaignProps)

      expect(() => campaign.updateBudget(Money.create(0, 'KRW'))).toThrow(
        'Daily budget must be greater than zero'
      )
    })

    it('should throw error when updating completed campaign budget', () => {
      const campaign = Campaign.create(validCampaignProps)
        .changeStatus(CampaignStatus.PENDING_REVIEW)
        .changeStatus(CampaignStatus.ACTIVE)
        .changeStatus(CampaignStatus.COMPLETED)

      expect(() => campaign.updateBudget(Money.create(100000, 'KRW'))).toThrow(
        'Cannot update budget of a completed campaign'
      )
    })
  })

  describe('setMetaCampaignId', () => {
    it('should set Meta campaign ID', () => {
      const campaign = Campaign.create(validCampaignProps)

      const updated = campaign.setMetaCampaignId('meta-123456')

      expect(updated.metaCampaignId).toBe('meta-123456')
      expect(campaign.metaCampaignId).toBeUndefined() // Original unchanged
    })

    it('should throw error if Meta campaign ID already set', () => {
      const campaign = Campaign.create(validCampaignProps).setMetaCampaignId('meta-123456')

      expect(() => campaign.setMetaCampaignId('meta-789')).toThrow(
        'Meta campaign ID is already set'
      )
    })
  })

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      const campaign = Campaign.create(validCampaignProps)

      // All operations return new instances
      const updated = campaign.changeStatus(CampaignStatus.PENDING_REVIEW)

      expect(campaign).not.toBe(updated)
      expect(campaign.status).toBe(CampaignStatus.DRAFT)
      expect(updated.status).toBe(CampaignStatus.PENDING_REVIEW)
    })
  })

  describe('restore', () => {
    it('should restore campaign from persisted data', () => {
      const props: CampaignProps = {
        id: 'campaign-123',
        userId: 'user-123',
        name: 'Restored Campaign',
        objective: CampaignObjective.TRAFFIC,
        status: CampaignStatus.ACTIVE,
        dailyBudget: Money.create(30000, 'KRW'),
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31'),
        metaCampaignId: 'meta-456',
        createdAt: new Date('2024-12-01'),
        updatedAt: new Date('2024-12-15'),
      }

      const campaign = Campaign.restore(props)

      expect(campaign.id).toBe('campaign-123')
      expect(campaign.status).toBe(CampaignStatus.ACTIVE)
      expect(campaign.metaCampaignId).toBe('meta-456')
    })
  })

  describe('isActive', () => {
    it('should return true for active campaign', () => {
      const campaign = Campaign.create(validCampaignProps)
        .changeStatus(CampaignStatus.PENDING_REVIEW)
        .changeStatus(CampaignStatus.ACTIVE)

      expect(campaign.isActive()).toBe(true)
    })

    it('should return false for paused campaign', () => {
      const campaign = Campaign.create(validCampaignProps)
        .changeStatus(CampaignStatus.PENDING_REVIEW)
        .changeStatus(CampaignStatus.ACTIVE)
        .changeStatus(CampaignStatus.PAUSED)

      expect(campaign.isActive()).toBe(false)
    })
  })

  describe('isEditable', () => {
    it('should return true for draft campaign', () => {
      const campaign = Campaign.create(validCampaignProps)

      expect(campaign.isEditable()).toBe(true)
    })

    it('should return true for pending review campaign', () => {
      const campaign = Campaign.create(validCampaignProps).changeStatus(
        CampaignStatus.PENDING_REVIEW
      )

      expect(campaign.isEditable()).toBe(true)
    })

    it('should return false for completed campaign', () => {
      const campaign = Campaign.create(validCampaignProps)
        .changeStatus(CampaignStatus.PENDING_REVIEW)
        .changeStatus(CampaignStatus.ACTIVE)
        .changeStatus(CampaignStatus.COMPLETED)

      expect(campaign.isEditable()).toBe(false)
    })
  })

  describe('isCompleted', () => {
    it('should return true for completed campaign', () => {
      const campaign = Campaign.create(validCampaignProps)
        .changeStatus(CampaignStatus.PENDING_REVIEW)
        .changeStatus(CampaignStatus.ACTIVE)
        .changeStatus(CampaignStatus.COMPLETED)

      expect(campaign.isCompleted()).toBe(true)
    })

    it('should return false for active campaign', () => {
      const campaign = Campaign.create(validCampaignProps)
        .changeStatus(CampaignStatus.PENDING_REVIEW)
        .changeStatus(CampaignStatus.ACTIVE)

      expect(campaign.isCompleted()).toBe(false)
    })
  })

  describe('toJSON', () => {
    it('should serialize campaign to JSON', () => {
      const campaign = Campaign.create(validCampaignProps)

      const json = campaign.toJSON()

      expect(json.id).toBe(campaign.id)
      expect(json.userId).toBe('user-123')
      expect(json.name).toBe('Summer Sale Campaign')
      expect(json.objective).toBe(CampaignObjective.CONVERSIONS)
      expect(json.status).toBe(CampaignStatus.DRAFT)
      expect(json.dailyBudget.amount).toBe(50000)
      expect(json.startDate).toEqual(new Date('2025-01-20'))
      expect(json.endDate).toBeUndefined()
      expect(json.createdAt).toBeDefined()
      expect(json.updatedAt).toBeDefined()
    })
  })

  describe('calculateTotalBudget', () => {
    it('should return daily budget when no end date', () => {
      const campaign = Campaign.create(validCampaignProps)

      const total = campaign.calculateTotalBudget()

      expect(total.amount).toBe(50000) // Just daily budget
    })

    it('should calculate total budget for campaign with end date', () => {
      const campaign = Campaign.create({
        ...validCampaignProps,
        startDate: new Date('2025-01-20'),
        endDate: new Date('2025-01-30'), // 10 days
      })

      const total = campaign.calculateTotalBudget()

      expect(total.amount).toBe(500000) // 50000 * 10 days
    })
  })

  describe('invalid status transitions', () => {
    it('should throw error for invalid transition from DRAFT to ACTIVE', () => {
      const campaign = Campaign.create(validCampaignProps)

      expect(() => campaign.changeStatus(CampaignStatus.ACTIVE)).toThrow(
        'Cannot change status from DRAFT to ACTIVE'
      )
    })

    it('should throw error for invalid transition from PENDING_REVIEW to PAUSED', () => {
      const campaign = Campaign.create(validCampaignProps).changeStatus(
        CampaignStatus.PENDING_REVIEW
      )

      expect(() => campaign.changeStatus(CampaignStatus.PAUSED)).toThrow(
        'Cannot change status from PENDING_REVIEW to PAUSED'
      )
    })
  })
})
