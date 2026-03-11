/**
 * k6 성능 테스트 - 공통 설정
 *
 * 사용법:
 *   npm run test:perf              (전체 시나리오)
 *   k6 run tests/performance/scenarios/campaigns-list.js
 *
 * 환경 변수:
 *   BASE_URL          - API 서버 URL (기본: http://localhost:3000)
 *   AUTH_TOKEN         - 인증 토큰
 *   VUS               - 가상 사용자 수 (기본: 10)
 *   DURATION           - 테스트 지속 시간 (기본: 30s)
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
export const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

// ─── 공통 임계값 (thresholds) ──────────────────────────────────────────────
export const defaultThresholds = {
  // 95번째 백분위 응답 시간 < 500ms
  http_req_duration: ['p(95)<500'],
  // 실패율 < 1%
  http_req_failed: ['rate<0.01'],
  // 95번째 백분위 대기 시간 < 400ms
  http_req_waiting: ['p(95)<400'],
}

// ─── 공통 시나리오 옵션 ─────────────────────────────────────────────────────
export const defaultOptions = {
  thresholds: defaultThresholds,
  stages: [
    // Ramp-up: 10초에 걸쳐 VUS까지 증가
    { duration: '10s', target: parseInt(__ENV.VUS || '10') },
    // Steady state: 지속 시간 동안 유지
    { duration: __ENV.DURATION || '30s', target: parseInt(__ENV.VUS || '10') },
    // Ramp-down: 5초에 걸쳐 0으로 감소
    { duration: '5s', target: 0 },
  ],
}

// ─── 공통 헤더 ──────────────────────────────────────────────────────────────
export function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`
  }

  return headers
}

// ─── 응답 검증 헬퍼 ─────────────────────────────────────────────────────────
export function checkResponse(res, expectedStatus = 200) {
  const checks = {}
  checks[`status is ${expectedStatus}`] = (r) => r.status === expectedStatus
  checks['response time < 500ms'] = (r) => r.timings.duration < 500
  checks['no server errors'] = (r) => r.status < 500
  return checks
}
