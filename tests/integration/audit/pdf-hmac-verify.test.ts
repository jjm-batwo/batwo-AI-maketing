/**
 * PDF/Share HMAC 검증 통합 테스트
 *
 * signReport()로 생성한 서명이 verifyReport()를 통과하는지,
 * 변조된 report 또는 무효 서명은 반드시 거부되는지 검증한다.
 */
import { describe, it, expect } from 'vitest'
import { signReport, verifyReport } from '@/lib/security/auditHmac'
import type { AuditReportDTO } from '@/application/dto/audit/AuditDTO'

// 테스트용 AuditReportDTO mock
const mockReport: AuditReportDTO = {
  overall: 75,
  grade: 'B',
  categories: [
    {
      name: '예산 효율성',
      score: 80,
      findings: [],
      recommendations: [],
    },
  ],
  estimatedWaste: { amount: 100000, currency: 'KRW' },
  estimatedImprovement: { amount: 50000, currency: 'KRW' },
  totalCampaigns: 5,
  activeCampaigns: 3,
  analyzedAt: '2026-02-27T10:00:00.000Z',
}

describe('PDF/Share HMAC 검증', () => {
  it('유효 서명 → 검증 통과', () => {
    const sig = signReport(mockReport)
    expect(verifyReport(mockReport, sig)).toBe(true)
  })

  it('무효 서명 → 검증 실패', () => {
    expect(verifyReport(mockReport, 'invalid-signature')).toBe(false)
  })

  it('변조된 report + 원본 서명 → 검증 실패', () => {
    const sig = signReport(mockReport)
    const tampered: AuditReportDTO = { ...mockReport, overall: 99 }
    expect(verifyReport(tampered, sig)).toBe(false)
  })
})
