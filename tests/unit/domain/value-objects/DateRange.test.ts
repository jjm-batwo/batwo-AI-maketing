import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { DateRange } from '@domain/value-objects/DateRange'

describe('DateRange', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T10:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('create', () => {
    it('should create valid date range', () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')

      const range = DateRange.create(startDate, endDate)

      expect(range.startDate).toEqual(startDate)
      expect(range.endDate).toEqual(endDate)
    })

    it('should create date range with same start and end date', () => {
      const date = new Date('2025-01-15')

      const range = DateRange.create(date, date)

      expect(range.startDate).toEqual(date)
      expect(range.endDate).toEqual(date)
    })

    it('should throw error for end date before start date', () => {
      const startDate = new Date('2025-01-31')
      const endDate = new Date('2025-01-01')

      expect(() => DateRange.create(startDate, endDate)).toThrow(
        'End date cannot be before start date'
      )
    })
  })

  describe('createOpenEnded', () => {
    it('should create date range without end date', () => {
      const startDate = new Date('2025-01-01')

      const range = DateRange.createOpenEnded(startDate)

      expect(range.startDate).toEqual(startDate)
      expect(range.endDate).toBeUndefined()
      expect(range.isOpenEnded()).toBe(true)
    })
  })

  describe('duration', () => {
    it('should calculate duration in days', () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-10')

      const range = DateRange.create(startDate, endDate)

      expect(range.getDurationInDays()).toBe(9)
    })

    it('should return 0 for same day', () => {
      const date = new Date('2025-01-15')

      const range = DateRange.create(date, date)

      expect(range.getDurationInDays()).toBe(0)
    })

    it('should return undefined for open-ended range', () => {
      const startDate = new Date('2025-01-01')

      const range = DateRange.createOpenEnded(startDate)

      expect(range.getDurationInDays()).toBeUndefined()
    })
  })

  describe('contains', () => {
    it('should check if date is within range', () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')
      const range = DateRange.create(startDate, endDate)

      expect(range.contains(new Date('2025-01-15'))).toBe(true)
      expect(range.contains(new Date('2025-01-01'))).toBe(true) // Start date inclusive
      expect(range.contains(new Date('2025-01-31'))).toBe(true) // End date inclusive
      expect(range.contains(new Date('2024-12-31'))).toBe(false)
      expect(range.contains(new Date('2025-02-01'))).toBe(false)
    })

    it('should check date for open-ended range', () => {
      const startDate = new Date('2025-01-01')
      const range = DateRange.createOpenEnded(startDate)

      expect(range.contains(new Date('2025-01-15'))).toBe(true)
      expect(range.contains(new Date('2025-12-31'))).toBe(true)
      expect(range.contains(new Date('2024-12-31'))).toBe(false)
    })
  })

  describe('overlaps', () => {
    it('should detect overlapping ranges', () => {
      const range1 = DateRange.create(new Date('2025-01-01'), new Date('2025-01-15'))
      const range2 = DateRange.create(new Date('2025-01-10'), new Date('2025-01-20'))

      expect(range1.overlaps(range2)).toBe(true)
      expect(range2.overlaps(range1)).toBe(true)
    })

    it('should detect non-overlapping ranges', () => {
      const range1 = DateRange.create(new Date('2025-01-01'), new Date('2025-01-10'))
      const range2 = DateRange.create(new Date('2025-01-15'), new Date('2025-01-20'))

      expect(range1.overlaps(range2)).toBe(false)
      expect(range2.overlaps(range1)).toBe(false)
    })
  })

  describe('immutability', () => {
    it('should be immutable', () => {
      const startDate = new Date('2025-01-01')
      const endDate = new Date('2025-01-31')
      const range = DateRange.create(startDate, endDate)

      // Modifying original dates should not affect the range
      startDate.setMonth(5)
      endDate.setMonth(5)

      expect(range.startDate.getMonth()).toBe(0) // January
      expect(range.endDate!.getMonth()).toBe(0) // January
    })
  })

  describe('validation', () => {
    it('should validate if range is in the past', () => {
      const pastRange = DateRange.create(new Date('2024-01-01'), new Date('2024-01-31'))

      expect(pastRange.isInPast()).toBe(true)
    })

    it('should validate if range is in the future', () => {
      const futureRange = DateRange.create(new Date('2025-02-01'), new Date('2025-02-28'))

      expect(futureRange.isInFuture()).toBe(true)
    })

    it('should validate if range is current', () => {
      const currentRange = DateRange.create(new Date('2025-01-01'), new Date('2025-01-31'))

      expect(currentRange.isCurrent()).toBe(true)
    })
  })
})
