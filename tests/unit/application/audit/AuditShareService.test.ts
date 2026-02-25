/**
 * AuditShareCache 단위 테스트
 *
 * 감사 결과 공유 토큰 캐시의 핵심 비즈니스 로직을 검증한다.
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { auditShareCache, type AuditReportDTO } from '@/lib/cache/auditShareCache'

// ============================================================================
// 테스트 픽스처
// ============================================================================

const SAMPLE_REPORT: AuditReportDTO = {
  overall: 72,
  grade: 'B',
  categories: [
    {
      name: '예산 효율성',
      score: 65,
      findings: [{ type: 'warning', message: '예산 낭비가 감지되었습니다' }],
      recommendations: [
        {
          priority: 'high',
          message: '예산 한도를 조정하세요',
          estimatedImpact: '월 50만원 절감',
        },
      ],
    },
  ],
  estimatedWaste: { amount: 500000, currency: 'KRW' },
  estimatedImprovement: { amount: 1200000, currency: 'KRW' },
  totalCampaigns: 8,
  activeCampaigns: 5,
  analyzedAt: '2026-02-25T10:00:00.000Z',
}

// ============================================================================
// 테스트 스위트
// ============================================================================

describe('AuditShareCache', () => {
  beforeEach(() => {
    auditShareCache.clearAll()
  })

  afterEach(() => {
    auditShareCache.clearAll()
    vi.useRealTimers()
  })

  describe('set()', () => {
    it('should_return_uuid_token_when_report_stored', () => {
      const token = auditShareCache.set(SAMPLE_REPORT)

      expect(token).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    })

    it('should_generate_unique_tokens_for_each_call', () => {
      const token1 = auditShareCache.set(SAMPLE_REPORT)
      const token2 = auditShareCache.set(SAMPLE_REPORT)

      expect(token1).not.toBe(token2)
    })

    it('should_increment_size_when_report_stored', () => {
      expect(auditShareCache.size()).toBe(0)

      auditShareCache.set(SAMPLE_REPORT)
      expect(auditShareCache.size()).toBe(1)

      auditShareCache.set(SAMPLE_REPORT)
      expect(auditShareCache.size()).toBe(2)
    })
  })

  describe('get()', () => {
    it('should_return_report_when_valid_token_provided', () => {
      const token = auditShareCache.set(SAMPLE_REPORT)
      const entry = auditShareCache.get(token)

      expect(entry).not.toBeNull()
      expect(entry!.report).toEqual(SAMPLE_REPORT)
    })

    it('should_return_null_when_unknown_token_provided', () => {
      const entry = auditShareCache.get('00000000-0000-4000-8000-000000000000')

      expect(entry).toBeNull()
    })

    it('should_return_null_when_token_has_expired', () => {
      vi.useFakeTimers()
      const token = auditShareCache.set(SAMPLE_REPORT)

      // 7일 + 1초 경과
      vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 + 1000)

      const entry = auditShareCache.get(token)
      expect(entry).toBeNull()
    })

    it('should_return_report_when_token_not_yet_expired', () => {
      vi.useFakeTimers()
      const token = auditShareCache.set(SAMPLE_REPORT)

      // 6일 23시간 경과 (아직 유효)
      vi.advanceTimersByTime(6 * 24 * 60 * 60 * 1000 + 23 * 60 * 60 * 1000)

      const entry = auditShareCache.get(token)
      expect(entry).not.toBeNull()
      expect(entry!.report.overall).toBe(72)
    })

    it('should_remove_expired_entry_from_cache_on_access', () => {
      vi.useFakeTimers()
      const token = auditShareCache.set(SAMPLE_REPORT)
      expect(auditShareCache.size()).toBe(1)

      vi.advanceTimersByTime(7 * 24 * 60 * 60 * 1000 + 1000)
      auditShareCache.get(token) // 접근 시 만료 항목 삭제

      expect(auditShareCache.size()).toBe(0)
    })

    it('should_store_created_at_timestamp_when_report_stored', () => {
      vi.useFakeTimers()
      const now = Date.now()
      const token = auditShareCache.set(SAMPLE_REPORT)
      const entry = auditShareCache.get(token)

      expect(entry!.createdAt).toBe(now)
    })
  })

  describe('clearAll()', () => {
    it('should_reset_size_to_zero_when_cleared', () => {
      auditShareCache.set(SAMPLE_REPORT)
      auditShareCache.set(SAMPLE_REPORT)
      auditShareCache.clearAll()

      expect(auditShareCache.size()).toBe(0)
    })
  })
})
