/**
 * auditHmac 단위 테스트
 *
 * TDD: 테스트를 먼저 작성하고 구현을 작성한다.
 * - signReport: AuditReportDTO에 대한 HMAC-SHA256 서명 생성
 * - verifyReport: 서명 검증 (timing-safe 비교)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { AuditReportDTO } from '@/application/dto/audit/AuditDTO'

// 테스트용 샘플 리포트
const sampleReport: AuditReportDTO = {
  overall: 72,
  grade: 'B',
  categories: [
    {
      name: '예산 효율',
      score: 65,
      findings: [{ type: 'warning', message: '예산 낭비 감지' }],
      recommendations: [
        {
          priority: 'high',
          message: '예산 재배분 권장',
          estimatedImpact: '월 30만원 절감',
        },
      ],
    },
  ],
  estimatedWaste: { amount: 300000, currency: 'KRW' },
  estimatedImprovement: { amount: 500000, currency: 'KRW' },
  totalCampaigns: 5,
  activeCampaigns: 3,
  analyzedAt: '2026-02-27T00:00:00.000Z',
}

describe('auditHmac', () => {
  // 환경변수 mock — 실제 환경변수에 의존하지 않도록 격리
  beforeEach(() => {
    vi.stubEnv('AUDIT_HMAC_SECRET', 'test-secret-key-for-unit-tests')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  describe('signReport', () => {
    it('케이스 1: base64url 형식의 문자열을 반환한다', async () => {
      const { signReport } = await import('@/lib/security/auditHmac')
      const signature = signReport(sampleReport)

      // base64url 형식: +, /, = 없이 영숫자와 -, _ 만 포함
      expect(typeof signature).toBe('string')
      expect(signature.length).toBeGreaterThan(0)
      expect(signature).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it('케이스 6: 동일한 report에 대해 항상 동일한 서명을 반환한다 (결정적)', async () => {
      const { signReport } = await import('@/lib/security/auditHmac')
      const sig1 = signReport(sampleReport)
      const sig2 = signReport(sampleReport)

      expect(sig1).toBe(sig2)
    })

    it('케이스 5: null을 전달하면 Error를 throw한다', async () => {
      const { signReport } = await import('@/lib/security/auditHmac')

      expect(() => signReport(null as unknown as AuditReportDTO)).toThrow()
    })

    it('케이스 5b: undefined를 전달하면 Error를 throw한다', async () => {
      const { signReport } = await import('@/lib/security/auditHmac')

      expect(() => signReport(undefined as unknown as AuditReportDTO)).toThrow()
    })
  })

  describe('verifyReport', () => {
    it('케이스 2: 올바른 서명이면 true를 반환한다', async () => {
      const { signReport, verifyReport } = await import('@/lib/security/auditHmac')
      const signature = signReport(sampleReport)

      expect(verifyReport(sampleReport, signature)).toBe(true)
    })

    it('케이스 3: report가 변조되면 false를 반환한다', async () => {
      const { signReport, verifyReport } = await import('@/lib/security/auditHmac')
      const originalSignature = signReport(sampleReport)

      // overall 점수를 변조
      const tamperedReport: AuditReportDTO = { ...sampleReport, overall: 99 }

      expect(verifyReport(tamperedReport, originalSignature)).toBe(false)
    })

    it('케이스 4: 서명이 변조되면 false를 반환한다', async () => {
      const { verifyReport } = await import('@/lib/security/auditHmac')
      const tamperedSignature = 'aGVsbG8td29ybGQ' // 임의의 base64url 문자열

      expect(verifyReport(sampleReport, tamperedSignature)).toBe(false)
    })

    it('케이스 7: 구현 소스에 crypto.timingSafeEqual 호출이 포함되어 있다', async () => {
      // ESM에서 Node.js built-in의 named export는 vi.spyOn으로 spy 불가 (configurable: false)
      // 대신 구현 소스 코드에 timingSafeEqual이 실제로 사용되는지 파일 내용으로 확인한다
      const fs = await import('fs')
      const path = await import('path')

      const implPath = path.resolve(
        process.cwd(),
        'src/lib/security/auditHmac.ts'
      )
      const source = fs.readFileSync(implPath, 'utf8')

      expect(source).toContain('timingSafeEqual')
    })
  })

  describe('HMAC 시크릿 환경별 정책', () => {
    // warnedOnce 모듈 스코프 플래그를 리셋하기 위해 각 테스트마다 모듈을 새로 로드
    beforeEach(() => {
      vi.resetModules()
    })

    it('production + secret 미설정 → signReport throw', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('AUDIT_HMAC_SECRET', '') // 빈 문자열 = falsy
      const { signReport } = await import('@/lib/security/auditHmac')
      expect(() => signReport(sampleReport)).toThrow('Missing AUDIT_HMAC_SECRET')
    })

    it('production + secret 미설정 → verifyReport throw', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('AUDIT_HMAC_SECRET', '')
      const { verifyReport } = await import('@/lib/security/auditHmac')
      expect(() => verifyReport(sampleReport, 'any-sig')).toThrow('Missing AUDIT_HMAC_SECRET')
    })

    it('production + secret 설정 → 정상 동작', async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('AUDIT_HMAC_SECRET', 'prod-secret-key')
      const { signReport, verifyReport } = await import('@/lib/security/auditHmac')
      const sig = signReport(sampleReport)
      expect(verifyReport(sampleReport, sig)).toBe(true)
    })

    it('test 환경 + secret 미설정 → fallback 정상 동작', async () => {
      vi.stubEnv('NODE_ENV', 'test')
      vi.stubEnv('AUDIT_HMAC_SECRET', '') // 빈 문자열 = 미설정으로 처리
      const { signReport, verifyReport } = await import('@/lib/security/auditHmac')
      const sig = signReport(sampleReport)
      expect(verifyReport(sampleReport, sig)).toBe(true)
    })

    it('fallback 사용 시 경고 로그 1회만 출력', async () => {
      vi.stubEnv('NODE_ENV', 'development')
      vi.stubEnv('AUDIT_HMAC_SECRET', '') // 빈 문자열 = 미설정으로 처리
      const { signReport } = await import('@/lib/security/auditHmac')

      // console.warn 스파이
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      signReport(sampleReport)
      signReport(sampleReport) // 2번째 호출
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('AUDIT_HMAC_SECRET'))
      warnSpy.mockRestore()
    })
  })
})
