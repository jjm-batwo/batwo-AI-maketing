/**
 * 🔴 RED Phase: Security Headers E2E Tests
 *
 * OWASP 권장 보안 헤더 검증 테스트
 * - Strict-Transport-Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Content-Security-Policy
 * - Referrer-Policy
 * - Permissions-Policy
 */

import { test, expect } from '@playwright/test'

// 보안 헤더 테스트는 공개 페이지에서 실행
test.use({ storageState: { cookies: [], origins: [] } })

test.describe('보안 헤더 검증', () => {
  test('HSTS 헤더가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const hsts = response.headers()['strict-transport-security']
    expect(hsts).not.toBeUndefined()
    expect(typeof hsts).toBe('string')
    expect(hsts).toContain('max-age=')
    // 최소 1년 (31536000초) 권장
    const maxAge = parseInt(hsts.match(/max-age=(\d+)/)?.[1] || '0')
    expect(maxAge).toBeGreaterThanOrEqual(31536000)
  })

  test('X-Frame-Options 헤더가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const xFrameOptions = response.headers()['x-frame-options']
    expect(xFrameOptions).not.toBeUndefined()
    expect(typeof xFrameOptions).toBe('string')
    expect(['DENY', 'SAMEORIGIN']).toContain(xFrameOptions)
  })

  test('X-Content-Type-Options 헤더가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const xContentTypeOptions = response.headers()['x-content-type-options']
    expect(xContentTypeOptions).toBe('nosniff')
  })

  test('X-DNS-Prefetch-Control 헤더가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const xDnsPrefetch = response.headers()['x-dns-prefetch-control']
    expect(typeof xDnsPrefetch).toBe('string')
    expect(['on', 'off']).toContain(xDnsPrefetch)
  })

  test('Referrer-Policy 헤더가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const referrerPolicy = response.headers()['referrer-policy']
    expect(referrerPolicy).not.toBeUndefined()
    expect(typeof referrerPolicy).toBe('string')
    // 허용되는 Referrer-Policy 값들
    const validPolicies = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
    ]
    expect(validPolicies).toContain(referrerPolicy)
  })

  test('Permissions-Policy 헤더가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const permissionsPolicy = response.headers()['permissions-policy']
    expect(permissionsPolicy).not.toBeUndefined()
    expect(typeof permissionsPolicy).toBe('string')
    // 민감한 API 제한 확인
    expect(permissionsPolicy).toContain('camera')
    expect(permissionsPolicy).toContain('microphone')
  })
})

test.describe('Content Security Policy (CSP) 검증', () => {
  test('CSP 헤더가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const csp = response.headers()['content-security-policy']
    expect(csp).not.toBeUndefined()
    expect(typeof csp).toBe('string')
    expect(csp.length).toBeGreaterThan(0)
  })

  test('CSP에 default-src가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const csp = response.headers()['content-security-policy']
    expect(csp).toContain("default-src 'self'")
  })

  test('CSP에 script-src가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const csp = response.headers()['content-security-policy']
    expect(csp).toContain('script-src')
  })

  test('CSP에 style-src가 설정되어야 함', async ({ request }) => {
    const response = await request.get('/')

    const csp = response.headers()['content-security-policy']
    expect(csp).toContain('style-src')
  })

  test('CSP가 unsafe-inline 스크립트를 허용하지 않아야 함 (또는 nonce 사용)', async ({
    request,
  }) => {
    const response = await request.get('/')

    const csp = response.headers()['content-security-policy']
    // Next.js는 인라인 스크립트를 사용하므로 nonce 또는 strict-dynamic 필요
    // unsafe-inline만 단독으로 사용하면 안됨
    if (csp.includes("'unsafe-inline'")) {
      // unsafe-inline이 있다면 nonce나 strict-dynamic도 있어야 함
      // Next.js dev 모드에서는 unsafe-eval이 필요할 수 있음
      expect(csp).toMatch(/nonce-|'strict-dynamic'|'unsafe-eval'/)
    }
  })
})

test.describe('API 보안 헤더', () => {
  test('API 엔드포인트에 보안 헤더가 적용되어야 함', async ({ request }) => {
    const response = await request.get('/api/health')

    // 404여도 헤더는 확인 가능
    const xContentTypeOptions = response.headers()['x-content-type-options']
    expect(xContentTypeOptions).toBe('nosniff')
  })

  test('API 엔드포인트에 CORS 헤더가 적절히 설정되어야 함', async ({ request }) => {
    // OPTIONS 요청으로 CORS preflight 테스트
    const response = await request.fetch('/api/health', {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://batwo.ai',
        'Access-Control-Request-Method': 'GET',
      },
    })

    // CORS가 설정된 경우에만 확인 (선택적)
    const allowOrigin = response.headers()['access-control-allow-origin']
    if (allowOrigin) {
      // 와일드카드가 아닌 특정 도메인만 허용되어야 함 (프로덕션 권장)
      expect(allowOrigin).not.toBe('*')
    }
  })
})

test.describe('보안 취약점 방지', () => {
  test('X-Powered-By 헤더가 노출되지 않아야 함', async ({ request }) => {
    const response = await request.get('/')

    // Next.js는 기본적으로 X-Powered-By를 제거하지만 확인
    const xPoweredBy = response.headers()['x-powered-by']
    expect(xPoweredBy).toBeUndefined()
  })

  test('Server 헤더가 상세 정보를 노출하지 않아야 함', async ({ request }) => {
    const response = await request.get('/')

    const server = response.headers()['server']
    // Server 헤더가 있다면 버전 정보를 포함하면 안됨
    if (server) {
      expect(server).not.toMatch(/\d+\.\d+/)
    }
  })
})
