import { QUOTA_LIMITS, type QuotaType, type QuotaPeriod } from './constants';

/**
 * 쿼터 기간 시작일 계산
 */
export function getQuotaPeriodStart(period: QuotaPeriod): Date {
  const now = new Date();
  const start = new Date(now);

  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week': {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      break;
    }
    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      break;
  }

  return start;
}

/**
 * 쿼터 초과 여부 확인
 */
export function isQuotaExceeded(type: QuotaType, currentUsage: number): boolean {
  const limit = QUOTA_LIMITS[type];
  if (limit.count === -1) return false; // 무제한
  return currentUsage >= limit.count;
}

/**
 * 남은 쿼터 계산
 */
export function getRemainingQuota(type: QuotaType, currentUsage: number): number {
  const limit = QUOTA_LIMITS[type];
  if (limit.count === -1) return Infinity;
  return Math.max(0, limit.count - currentUsage);
}

/**
 * 통화 포맷 (원화)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
}

/**
 * 날짜 포맷 (한국어)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * 퍼센트 포맷
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}
