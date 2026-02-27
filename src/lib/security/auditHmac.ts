/**
 * 감사 리포트 HMAC 서명/검증 유틸리티
 *
 * - crypto.createHmac('sha256', secret) 기반
 * - timing-safe 비교로 timing attack 방지
 * - 키 정렬을 통한 결정적(deterministic) JSON 직렬화 보장
 */

import { createHmac, timingSafeEqual } from 'crypto'
import type { AuditReportDTO } from '@/application/dto/audit/AuditDTO'

// 개발 전용 기본 시크릿 — 프로덕션에서는 반드시 AUDIT_HMAC_SECRET 환경변수 설정 필요
const DEFAULT_SECRET = 'batwo-audit-hmac-dev-only-secret'

// 경고 중복 방지 플래그 — 모듈 스코프에서 1회만 경고 출력
let warnedOnce = false

/**
 * 환경변수에서 HMAC 시크릿을 로드한다.
 *
 * 환경별 정책:
 * - production: AUDIT_HMAC_SECRET 미설정 시 Error throw
 * - development/test: DEFAULT_SECRET fallback 허용, 단 1회 경고 로그 출력
 */
function getSecret(): string {
  const secret = process.env.AUDIT_HMAC_SECRET

  // 빈 문자열도 미설정으로 처리
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing AUDIT_HMAC_SECRET in production')
    }

    // development/test 환경 — fallback 허용, 1회 경고
    if (!warnedOnce) {
      warnedOnce = true
      console.warn(
        '[auditHmac] AUDIT_HMAC_SECRET 환경변수가 설정되지 않았습니다. ' +
          '개발 전용 기본값을 사용합니다. 프로덕션 배포 전 반드시 설정하세요.'
      )
    }

    return DEFAULT_SECRET
  }

  return secret
}

/**
 * 객체를 재귀적으로 키 정렬하여 결정적 JSON 문자열로 직렬화한다.
 * 키 순서가 달라도 동일한 결과를 보장한다.
 */
function deterministicStringify(value: unknown): string {
  if (value === null || value === undefined) {
    return JSON.stringify(value)
  }

  if (Array.isArray(value)) {
    // 배열은 순서가 의미 있으므로 키 정렬만 재귀 적용
    const items = value.map((item) => deterministicStringify(item))
    return `[${items.join(',')}]`
  }

  if (typeof value === 'object') {
    // 객체 키를 알파벳순 정렬
    const sortedKeys = Object.keys(value as Record<string, unknown>).sort()
    const pairs = sortedKeys.map((key) => {
      const v = (value as Record<string, unknown>)[key]
      return `${JSON.stringify(key)}:${deterministicStringify(v)}`
    })
    return `{${pairs.join(',')}}`
  }

  // 기본 타입 (string, number, boolean)은 그대로 직렬화
  return JSON.stringify(value)
}

/**
 * AuditReportDTO에 대한 HMAC-SHA256 서명을 생성한다.
 *
 * @param report - 서명할 감사 리포트
 * @returns base64url 형식의 HMAC 문자열
 * @throws report가 null 또는 undefined이면 Error를 throw
 * @throws production 환경에서 AUDIT_HMAC_SECRET 미설정 시 Error를 throw
 */
export function signReport(report: AuditReportDTO): string {
  if (report === null || report === undefined) {
    throw new Error('report는 null 또는 undefined일 수 없습니다')
  }

  const secret = getSecret()
  const payload = deterministicStringify(report)

  const hmac = createHmac('sha256', secret)
  hmac.update(payload, 'utf8')

  // base64url: base64에서 +→-, /→_, =제거
  return hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * AuditReportDTO의 서명을 검증한다.
 * timing attack 방지를 위해 crypto.timingSafeEqual을 사용한다.
 *
 * @param report - 검증할 감사 리포트
 * @param signature - 검증할 서명 (base64url 형식)
 * @returns 서명이 유효하면 true, 그렇지 않으면 false
 * @throws report가 null 또는 undefined이면 Error를 throw
 * @throws production 환경에서 AUDIT_HMAC_SECRET 미설정 시 Error를 throw (catch 안 함)
 */
export function verifyReport(report: AuditReportDTO, signature: string): boolean {
  if (report === null || report === undefined) {
    throw new Error('report는 null 또는 undefined일 수 없습니다')
  }

  // production에서 AUDIT_HMAC_SECRET 미설정 시 getSecret()이 throw → 전파되어야 함
  // 따라서 signReport 호출 전에 먼저 시크릿을 검증
  const secret = getSecret()

  try {
    const payload = deterministicStringify(report)
    const hmac = createHmac('sha256', secret)
    hmac.update(payload, 'utf8')
    const expectedSignature = hmac
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8')
    const actualBuffer = Buffer.from(signature, 'utf8')

    // 길이가 다르면 false — timingSafeEqual은 동일 길이만 허용
    if (expectedBuffer.length !== actualBuffer.length) {
      return false
    }

    return timingSafeEqual(expectedBuffer, actualBuffer)
  } catch {
    // 예외 발생 시 검증 실패로 처리
    return false
  }
}
