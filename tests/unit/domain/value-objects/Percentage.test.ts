import { describe, it, expect } from 'vitest'
import { Percentage } from '@domain/value-objects/Percentage'

describe('Percentage', () => {
  describe('create', () => {
    it('should create percentage from decimal', () => {
      const percentage = Percentage.fromDecimal(0.15)

      expect(percentage.value).toBe(15)
      expect(percentage.decimal).toBe(0.15)
    })

    it('should create percentage from value', () => {
      const percentage = Percentage.fromValue(15)

      expect(percentage.value).toBe(15)
      expect(percentage.decimal).toBeCloseTo(0.15)
    })

    it('should allow 0%', () => {
      const percentage = Percentage.fromValue(0)

      expect(percentage.value).toBe(0)
      expect(percentage.isZero()).toBe(true)
    })

    it('should allow 100%', () => {
      const percentage = Percentage.fromValue(100)

      expect(percentage.value).toBe(100)
    })

    it('should throw for negative percentage', () => {
      expect(() => Percentage.fromValue(-10)).toThrow('Percentage cannot be negative')
    })

    it('should throw for percentage over 100 by default', () => {
      expect(() => Percentage.fromValue(150)).toThrow('Percentage cannot exceed 100')
    })

    it('should allow percentage over 100 when explicitly allowed', () => {
      const percentage = Percentage.fromValue(150, { allowOver100: true })

      expect(percentage.value).toBe(150)
    })
  })

  describe('formatting', () => {
    it('should format to string with % sign', () => {
      const percentage = Percentage.fromValue(15.5)

      expect(percentage.format()).toBe('15.5%')
    })

    it('should format with specified decimal places', () => {
      const percentage = Percentage.fromValue(15.567)

      expect(percentage.format(1)).toBe('15.6%')
      expect(percentage.format(0)).toBe('16%')
    })
  })

  describe('comparison', () => {
    it('should compare percentages', () => {
      const p1 = Percentage.fromValue(15)
      const p2 = Percentage.fromValue(20)
      const p3 = Percentage.fromValue(15)

      expect(p1.isLessThan(p2)).toBe(true)
      expect(p2.isGreaterThan(p1)).toBe(true)
      expect(p1.equals(p3)).toBe(true)
    })
  })

  describe('calculation', () => {
    it('should calculate percentage of a value', () => {
      const percentage = Percentage.fromValue(10)

      expect(percentage.of(1000)).toBe(100)
    })

    it('should calculate difference between percentages', () => {
      const p1 = Percentage.fromValue(20)
      const p2 = Percentage.fromValue(15)

      const diff = p1.difference(p2)

      expect(diff.value).toBe(5)
    })
  })

  describe('immutability', () => {
    it('should be immutable', () => {
      const p1 = Percentage.fromValue(15)
      const p2 = Percentage.fromValue(10)

      const diff = p1.difference(p2)

      expect(p1.value).toBe(15) // Original unchanged
      expect(diff.value).toBe(5)
    })
  })
})
