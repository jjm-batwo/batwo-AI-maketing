import http from 'k6/http'
import { check, sleep } from 'k6'
import { BASE_URL, defaultOptions, getHeaders, checkResponse } from '../k6.config.js'

/**
 * 캠페인 목록 조회 성능 테스트
 *
 * 시나리오: 사용자가 대시보드에서 캠페인 목록을 조회하는 흐름
 * 기준선: p95 < 500ms, 에러율 < 1%
 */
export const options = {
  ...defaultOptions,
  thresholds: {
    ...defaultOptions.thresholds,
    // 캠페인 목록은 자주 조회되므로 더 엄격한 기준
    http_req_duration: ['p(95)<500', 'p(99)<800'],
  },
  tags: {
    scenario: 'campaigns-list',
  },
}

export default function () {
  const headers = getHeaders()

  // 1. 캠페인 목록 조회 (기본)
  const listRes = http.get(`${BASE_URL}/api/campaigns`, { headers, tags: { name: 'GET /api/campaigns' } })
  check(listRes, {
    ...checkResponse(listRes, 200),
    'has campaigns array': (r) => {
      try {
        const body = JSON.parse(r.body)
        return Array.isArray(body.campaigns) || Array.isArray(body.data) || Array.isArray(body)
      } catch {
        return false
      }
    },
  })

  sleep(1)

  // 2. 캠페인 목록 조회 (페이지네이션)
  const paginatedRes = http.get(`${BASE_URL}/api/campaigns?limit=10&offset=0`, {
    headers,
    tags: { name: 'GET /api/campaigns?paginated' },
  })
  check(paginatedRes, checkResponse(paginatedRes, 200))

  sleep(0.5)
}

// ─── 시나리오 설명 ──────────────────────────────────────────────────────────
export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'tests/performance/results/campaigns-list.json': JSON.stringify(data, null, 2),
  }
}

// k6 내장 textSummary 사용
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
