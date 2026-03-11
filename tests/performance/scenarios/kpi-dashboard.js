import http from 'k6/http'
import { check, sleep } from 'k6'
import { BASE_URL, defaultOptions, getHeaders, checkResponse } from '../k6.config.js'

/**
 * KPI 대시보드 조회 성능 테스트
 *
 * 시나리오: 사용자가 대시보드에 접속하여 KPI 데이터를 조회하는 흐름
 * 기준선: p95 < 500ms, 에러율 < 1%
 */
export const options = {
  ...defaultOptions,
  thresholds: {
    ...defaultOptions.thresholds,
    // KPI 대시보드는 실시간 데이터를 포함하므로 약간 관대
    http_req_duration: ['p(95)<800', 'p(99)<1200'],
  },
  tags: {
    scenario: 'kpi-dashboard',
  },
}

export default function () {
  const headers = getHeaders()

  // 1. 대시보드 KPI 요약 조회
  const kpiRes = http.get(`${BASE_URL}/api/kpi/dashboard`, {
    headers,
    tags: { name: 'GET /api/kpi/dashboard' },
  })
  check(kpiRes, {
    ...checkResponse(kpiRes, 200),
    'has KPI data': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body !== null && typeof body === 'object'
      } catch {
        return false
      }
    },
  })

  sleep(1)

  // 2. KPI 일별 추이 조회 (최근 7일)
  const trendRes = http.get(`${BASE_URL}/api/kpi/dashboard?datePreset=last_7d`, {
    headers,
    tags: { name: 'GET /api/kpi/dashboard?last_7d' },
  })
  check(trendRes, checkResponse(trendRes, 200))

  sleep(0.5)

  // 3. KPI 일별 추이 조회 (최근 30일 - 더 무거운 쿼리)
  const trend30Res = http.get(`${BASE_URL}/api/kpi/dashboard?datePreset=last_30d`, {
    headers,
    tags: { name: 'GET /api/kpi/dashboard?last_30d' },
  })
  check(trend30Res, checkResponse(trend30Res, 200))

  sleep(1)
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'tests/performance/results/kpi-dashboard.json': JSON.stringify(data, null, 2),
  }
}

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
