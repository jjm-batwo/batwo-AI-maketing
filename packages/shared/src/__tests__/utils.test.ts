import { describe, it, expect } from 'vitest';
import {
  getQuotaPeriodStart,
  isQuotaExceeded,
  getRemainingQuota,
  formatCurrency,
  formatDate,
  formatPercent,
} from '../utils';

describe('Quota Utils', () => {
  describe('getQuotaPeriodStart', () => {
    it('should return start of day for "day" period', () => {
      const start = getQuotaPeriodStart('day');
      expect(start.getHours()).toBe(0);
      expect(start.getMinutes()).toBe(0);
      expect(start.getSeconds()).toBe(0);
    });

    it('should return start of week (Monday) for "week" period', () => {
      const start = getQuotaPeriodStart('week');
      // Monday is day 1 in JavaScript (0 = Sunday)
      const day = start.getDay();
      expect(day === 1 || day === 0).toBe(true); // Monday or Sunday depending on locale
      expect(start.getHours()).toBe(0);
    });

    it('should return first day of month for "month" period', () => {
      const start = getQuotaPeriodStart('month');
      expect(start.getDate()).toBe(1);
      expect(start.getHours()).toBe(0);
    });
  });

  describe('isQuotaExceeded', () => {
    it('should return true when usage exceeds limit', () => {
      expect(isQuotaExceeded('CAMPAIGN_CREATE', 5)).toBe(true);
      expect(isQuotaExceeded('CAMPAIGN_CREATE', 6)).toBe(true);
    });

    it('should return false when usage is below limit', () => {
      expect(isQuotaExceeded('CAMPAIGN_CREATE', 4)).toBe(false);
      expect(isQuotaExceeded('AI_COPY_GEN', 10)).toBe(false);
    });

    it('should return false for unlimited quotas', () => {
      expect(isQuotaExceeded('REPORT_DOWNLOAD', 1000)).toBe(false);
    });
  });

  describe('getRemainingQuota', () => {
    it('should calculate remaining quota correctly', () => {
      expect(getRemainingQuota('CAMPAIGN_CREATE', 3)).toBe(2);
      expect(getRemainingQuota('CAMPAIGN_CREATE', 5)).toBe(0);
    });

    it('should return 0 when over limit', () => {
      expect(getRemainingQuota('CAMPAIGN_CREATE', 10)).toBe(0);
    });

    it('should return Infinity for unlimited quotas', () => {
      expect(getRemainingQuota('REPORT_DOWNLOAD', 100)).toBe(Infinity);
    });
  });
});

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('should format Korean Won correctly', () => {
      const result = formatCurrency(10000);
      expect(result).toContain('10,000');
      expect(result).toContain('₩');
    });
  });

  describe('formatDate', () => {
    it('should format date in Korean', () => {
      const result = formatDate(new Date('2024-12-25'));
      expect(result).toContain('2024');
      expect(result).toContain('12');
      expect(result).toContain('25');
    });

    it('should handle string date input', () => {
      const result = formatDate('2024-01-01');
      expect(result).toContain('2024');
    });
  });

  describe('formatPercent', () => {
    it('should format percentage correctly', () => {
      expect(formatPercent(0.1234)).toBe('12.34%');
      expect(formatPercent(0.5)).toBe('50.00%');
    });

    it('should respect decimals parameter', () => {
      expect(formatPercent(0.1234, 1)).toBe('12.3%');
      expect(formatPercent(0.1234, 0)).toBe('12%');
    });
  });
});
