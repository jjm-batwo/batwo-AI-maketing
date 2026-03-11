import { sleep } from 'k6'
import { BASE_URL, getHeaders } from './k6.config.js'
import http from 'k6/http'
import { check } from 'k6'
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'

/**
 * 전체 시나리오 통합 실행
 *
 * 모든 주요 API 엔드포인트를 순차적으로 테스트합니다.
 * 사용법: k6 run tests/performance/run-all.js
 */
export const options = {
  scenarios: {
    campaigns: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '20s', target: 5 },
        { duration: '5s', target: 0 },
      ],
      exec: 'campaignScenario',
      tags: { scenario: 'campaigns' },
    },
    kpi: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 5 },
        { duration: '20s', target: 5 },
        { duration: '5s', target: 0 },
      ],
      startTime: '40s', // campaigns 완료 후 시작
      exec: 'kpiScenario',
      tags: { scenario: 'kpi' },
    },
    reports: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5s', target: 2 },
        { duration: '15s', target: 2 },
        { duration: '5s', target: 0 },
      ],
      startTime: '80s', // kpi 완료 후 시작
      exec: 'reportScenario',
      tags: { scenario: 'reports' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.05'],
  },
}

// ─── 캠페인 시나리오 ───────────────────────────────────────────────────────
export function campaignScenario() {
  const headers = getHeaders()

  const res = http.get(`${BASE_URL}/api/campaigns`, {
    headers,
    tags: { name: 'GET /api/campaigns' },
  })
  check(res, {
    'campaigns: status 200': (r) => r.status === 200,
    'campaigns: response < 500ms': (r) => r.timings.duration < 500,
  })

  sleep(1)
}

// ─── KPI 시나리오 ──────────────────────────────────────────────────────────
export function kpiScenario() {
  const headers = getHeaders()

  const res = http.get(`${BASE_URL}/api/kpi/dashboard`, {
    headers,
    tags: { name: 'GET /api/kpi/dashboard' },
  })
  check(res, {
    'kpi: status 200': (r) => r.status === 200,
    'kpi: response < 800ms': (r) => r.timings.duration < 800,
  })

  sleep(1)
}

// ─── 리포트 시나리오 ───────────────────────────────────────────────────────
export function reportScenario() {
  const headers = getHeaders()

  const res = http.get(`${BASE_URL}/api/reports`, {
    headers,
    tags: { name: 'GET /api/reports' },
  })
  check(res, {
    'reports: status 200': (r) => r.status === 200,
    'reports: response < 1000ms': (r) => r.timings.duration < 1000,
  })

  sleep(2)
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'tests/performance/results/run-all.json': JSON.stringify(data, null, 2),
  }
}
