import { describe, it, expect } from 'vitest'
import { Money } from '@domain/value-objects/Money'

describe('Money', () => {
  describe('create', () => {
    it('should create money with valid amount and currency', () => {
      const money = Money.create(10000, 'KRW')

      expect(money.amount).toBe(10000)
      expect(money.currency).toBe('KRW')
    })

    it('should throw error for negative amount', () => {
      expect(() => Money.create(-100, 'KRW')).toThrow('Amount cannot be negative')
    })

    it('should throw error for invalid currency', () => {
      // @ts-expect-error Testing invalid currency input
      expect(() => Money.create(100, 'INVALID')).toThrow('Invalid currency')
    })

    it('should default to KRW currency', () => {
      const money = Money.create(5000)

      expect(money.currency).toBe('KRW')
    })
  })

  describe('add', () => {
    it('should add two money values with same currency', () => {
      const money1 = Money.create(10000, 'KRW')
      const money2 = Money.create(5000, 'KRW')

      const result = money1.add(money2)

      expect(result.amount).toBe(15000)
      expect(result.currency).toBe('KRW')
    })

    it('should throw error when adding different currencies', () => {
      const krw = Money.create(10000, 'KRW')
      const usd = Money.create(100, 'USD')

      expect(() => krw.add(usd)).toThrow('Cannot add money with different currencies')
    })
  })

  describe('subtract', () => {
    it('should subtract money values with same currency', () => {
      const money1 = Money.create(10000, 'KRW')
      const money2 = Money.create(3000, 'KRW')

      const result = money1.subtract(money2)

      expect(result.amount).toBe(7000)
    })

    it('should throw error when result would be negative', () => {
      const money1 = Money.create(1000, 'KRW')
      const money2 = Money.create(5000, 'KRW')

      expect(() => money1.subtract(money2)).toThrow('Insufficient amount')
    })
  })

  describe('multiply', () => {
    it('should multiply money by a factor', () => {
      const money = Money.create(10000, 'KRW')

      const result = money.multiply(1.5)

      expect(result.amount).toBe(15000)
    })

    it('should round to nearest integer for KRW', () => {
      const money = Money.create(10000, 'KRW')

      const result = money.multiply(0.333)

      expect(result.amount).toBe(3330)
    })
  })

  describe('immutability', () => {
    it('should be immutable after creation', () => {
      const money = Money.create(10000, 'KRW')

      // Operations should return new instances
      const added = money.add(Money.create(5000, 'KRW'))

      expect(money.amount).toBe(10000) // Original unchanged
      expect(added.amount).toBe(15000) // New instance with result
    })
  })

  describe('formatting', () => {
    it('should format KRW to locale string', () => {
      const money = Money.create(1000000, 'KRW')

      const formatted = money.format()

      expect(formatted).toContain('1,000,000')
    })

    it('should format USD with dollar sign', () => {
      const money = Money.create(1000, 'USD')

      const formatted = money.format()

      expect(formatted).toContain('$')
    })
  })

  describe('comparison', () => {
    it('should check equality', () => {
      const money1 = Money.create(10000, 'KRW')
      const money2 = Money.create(10000, 'KRW')
      const money3 = Money.create(5000, 'KRW')

      expect(money1.equals(money2)).toBe(true)
      expect(money1.equals(money3)).toBe(false)
    })

    it('should compare greater than', () => {
      const money1 = Money.create(10000, 'KRW')
      const money2 = Money.create(5000, 'KRW')

      expect(money1.isGreaterThan(money2)).toBe(true)
      expect(money2.isGreaterThan(money1)).toBe(false)
    })

    it('should check if zero', () => {
      const zero = Money.create(0, 'KRW')
      const nonZero = Money.create(100, 'KRW')

      expect(zero.isZero()).toBe(true)
      expect(nonZero.isZero()).toBe(false)
    })

    it('should compare less than', () => {
      const money1 = Money.create(5000, 'KRW')
      const money2 = Money.create(10000, 'KRW')

      expect(money1.isLessThan(money2)).toBe(true)
      expect(money2.isLessThan(money1)).toBe(false)
    })

    it('should throw error when comparing different currencies with isGreaterThan', () => {
      const krw = Money.create(10000, 'KRW')
      const usd = Money.create(10, 'USD')

      expect(() => krw.isGreaterThan(usd)).toThrow('Cannot compare money with different currencies')
    })

    it('should throw error when comparing different currencies with isLessThan', () => {
      const krw = Money.create(10000, 'KRW')
      const usd = Money.create(10, 'USD')

      expect(() => krw.isLessThan(usd)).toThrow('Cannot compare money with different currencies')
    })
  })

  describe('subtract', () => {
    it('should subtract two money values with same currency', () => {
      const money1 = Money.create(10000, 'KRW')
      const money2 = Money.create(3000, 'KRW')

      const result = money1.subtract(money2)

      expect(result.amount).toBe(7000)
    })

    it('should throw error when subtracting different currencies', () => {
      const krw = Money.create(10000, 'KRW')
      const usd = Money.create(10, 'USD')

      expect(() => krw.subtract(usd)).toThrow('Cannot subtract money with different currencies')
    })

    it('should throw error for insufficient amount', () => {
      const money1 = Money.create(5000, 'KRW')
      const money2 = Money.create(10000, 'KRW')

      expect(() => money1.subtract(money2)).toThrow('Insufficient amount')
    })
  })

  describe('toJSON', () => {
    it('should serialize to JSON', () => {
      const money = Money.create(10000, 'KRW')

      const json = money.toJSON()

      expect(json.amount).toBe(10000)
      expect(json.currency).toBe('KRW')
    })
  })
})
