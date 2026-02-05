import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatDateShort,
} from '@infrastructure/pdf/templates/BaseReportTemplate'

describe('BaseReportTemplate - Utility Functions', () => {
  describe('formatNumber', () => {
    it('should format numbers with Korean locale', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(0)).toBe('0')
    })

    it('should round decimal numbers', () => {
      expect(formatNumber(1234.56)).toBe('1,235')
      expect(formatNumber(1234.49)).toBe('1,234')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with KRW default', () => {
      expect(formatCurrency(10000)).toBe('₩10,000')
      expect(formatCurrency(1234567)).toBe('₩1,234,567')
    })

    it('should format currency with custom currency', () => {
      expect(formatCurrency(10000, 'USD')).toContain('10,000')
    })

    it('should not show decimals for KRW', () => {
      expect(formatCurrency(10000.99)).toBe('₩10,001')
    })
  })

  describe('formatPercent', () => {
    it('should format percentage with default 2 decimals', () => {
      expect(formatPercent(12.3456)).toBe('12.35%')
      expect(formatPercent(0.12)).toBe('0.12%')
    })

    it('should format percentage with custom decimals', () => {
      expect(formatPercent(12.3456, 1)).toBe('12.3%')
      expect(formatPercent(12.3456, 0)).toBe('12%')
    })
  })

  describe('formatDate', () => {
    it('should format date with Korean locale', () => {
      const result = formatDate('2024-01-15')
      expect(result).toMatch(/2024년/)
      expect(result).toMatch(/1월/)
      expect(result).toMatch(/15일/)
    })

    it('should handle ISO date strings', () => {
      const result = formatDate('2024-01-15T00:00:00Z')
      expect(result).toMatch(/2024년/)
    })
  })

  describe('formatDateShort', () => {
    it('should format date without year', () => {
      const result = formatDateShort('2024-01-15')
      expect(result).not.toMatch(/2024년/)
      expect(result).toMatch(/1월/)
    })
  })
})
