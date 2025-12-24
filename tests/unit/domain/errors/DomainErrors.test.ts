import { describe, it, expect } from 'vitest'
import { DomainError } from '@domain/errors/DomainError'
import { InvalidCampaignError } from '@domain/errors/InvalidCampaignError'
import { BudgetExceededError } from '@domain/errors/BudgetExceededError'
import { InvalidReportError } from '@domain/errors/InvalidReportError'

describe('DomainError', () => {
  it('should have correct name property', () => {
    const error = new InvalidCampaignError('test error')
    expect(error.name).toBe('InvalidCampaignError')
  })

  it('should be instance of Error', () => {
    const error = new InvalidCampaignError('test')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DomainError)
  })
})

describe('InvalidCampaignError', () => {
  it('should have INVALID_CAMPAIGN code', () => {
    const error = new InvalidCampaignError('test')
    expect(error.code).toBe('INVALID_CAMPAIGN')
  })

  describe('factory methods', () => {
    it('emptyName should create correct error', () => {
      const error = InvalidCampaignError.emptyName()
      expect(error.message).toBe('Campaign name is required')
    })

    it('nameTooLong should create correct error with default maxLength', () => {
      const error = InvalidCampaignError.nameTooLong()
      expect(error.message).toBe('Campaign name cannot exceed 255 characters')
    })

    it('nameTooLong should create correct error with custom maxLength', () => {
      const error = InvalidCampaignError.nameTooLong(100)
      expect(error.message).toBe('Campaign name cannot exceed 100 characters')
    })

    it('invalidBudget should create correct error', () => {
      const error = InvalidCampaignError.invalidBudget()
      expect(error.message).toBe('Daily budget must be greater than zero')
    })

    it('pastStartDate should create correct error', () => {
      const error = InvalidCampaignError.pastStartDate()
      expect(error.message).toBe('Start date cannot be in the past')
    })

    it('invalidDateRange should create correct error', () => {
      const error = InvalidCampaignError.invalidDateRange()
      expect(error.message).toBe('End date cannot be before start date')
    })

    it('invalidStatusTransition should create correct error', () => {
      const error = InvalidCampaignError.invalidStatusTransition('DRAFT', 'COMPLETED')
      expect(error.message).toBe('Cannot change status from DRAFT to COMPLETED')
    })

    it('completedCampaignModification should create correct error', () => {
      const error = InvalidCampaignError.completedCampaignModification()
      expect(error.message).toBe('Cannot modify a completed campaign')
    })

    it('metaCampaignIdAlreadySet should create correct error', () => {
      const error = InvalidCampaignError.metaCampaignIdAlreadySet()
      expect(error.message).toBe('Meta campaign ID is already set')
    })
  })
})

describe('BudgetExceededError', () => {
  it('should have BUDGET_EXCEEDED code', () => {
    const error = new BudgetExceededError('test', 1000, 1500)
    expect(error.code).toBe('BUDGET_EXCEEDED')
  })

  it('should store budget and spent values', () => {
    const error = new BudgetExceededError('test', 1000, 1500)
    expect(error.budget).toBe(1000)
    expect(error.spent).toBe(1500)
  })

  describe('factory methods', () => {
    it('dailyBudgetExceeded should create correct error', () => {
      const error = BudgetExceededError.dailyBudgetExceeded(50000, 75000)
      expect(error.message).toBe('Daily budget of 50000 exceeded. Current spend: 75000')
      expect(error.budget).toBe(50000)
      expect(error.spent).toBe(75000)
    })

    it('lifetimeBudgetExceeded should create correct error', () => {
      const error = BudgetExceededError.lifetimeBudgetExceeded(1000000, 1200000)
      expect(error.message).toBe('Lifetime budget of 1000000 exceeded. Current spend: 1200000')
      expect(error.budget).toBe(1000000)
      expect(error.spent).toBe(1200000)
    })
  })
})

describe('InvalidReportError', () => {
  it('should have INVALID_REPORT code', () => {
    const error = new InvalidReportError('test')
    expect(error.code).toBe('INVALID_REPORT')
  })

  describe('factory methods', () => {
    it('emptyCampaignList should create correct error', () => {
      const error = InvalidReportError.emptyCampaignList()
      expect(error.message).toBe('At least one campaign is required for report')
    })

    it('invalidDateRange should create correct error', () => {
      const error = InvalidReportError.invalidDateRange('Weekly', 7)
      expect(error.message).toBe('Weekly report date range must be 7 days or less')
    })

    it('invalidConfidence should create correct error', () => {
      const error = InvalidReportError.invalidConfidence()
      expect(error.message).toBe('Confidence must be between 0 and 1')
    })

    it('cannotSendBeforeGeneration should create correct error', () => {
      const error = InvalidReportError.cannotSendBeforeGeneration()
      expect(error.message).toBe('Cannot send report that has not been generated')
    })
  })
})
