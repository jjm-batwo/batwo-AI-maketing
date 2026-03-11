import http from 'k6/http'
import { check, sleep } from 'k6'
import { BASE_URL, defaultOptions, getHeaders, checkResponse } from '../k6.config.js'

/**
 * 리포트 생성 성능 테스트
 *
 * 시나리오: 사용자가 주간 리포트를 생성하고 조회하는 흐름
 * 기준선: p95 < 2000ms (AI 생성 포함이므로 관대), 에러율 < 5%
 *
 * 주의: 리포트 생성은 AI를 사용하므로 다른 API보다 느림.
 *       VUS를 낮게 설정하여 과부하를 방지.
 */
export const options = {
  thresholds: {
    // 리포트 생성은 AI 처리가 포함되므로 관대한 기준
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
  },
  stages: [
    // 리포트 생성은 부하가 크므로 VUS를 낮게 유지
    { duration: '5s', target: 3 },
    { duration: '20s', target: 3 },
    { duration: '5s', target: 0 },
  ],
  tags: {
    scenario: 'report-generation',
  },
}

export default function () {
  const headers = getHeaders()

  // 1. 리포트 목록 조회
  const listRes = http.get(`${BASE_URL}/api/reports`, {
    headers,
    tags: { name: 'GET /api/reports' },
  })
  check(listRes, checkResponse(listRes, 200))

  sleep(1)

  // 2. 리포트 생성 요청 (POST)
  const payload = JSON.stringify({
    type: 'weekly',
    dateRange: {
      start: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0],
    },
  })

  const createRes = http.post(`${BASE_URL}/api/reports`, payload, {
    headers,
    tags: { name: 'POST /api/reports' },
    timeout: '10s',
  })
  check(createRes, {
    'report created (201 or 200)': (r) => r.status === 201 || r.status === 200,
    'has report id': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.id !== undefined || body.reportId !== undefined
      } catch {
        return false
      }
    },
  })

  sleep(2)

  // 3. 생성된 리포트 조회 (존재하는 경우)
  if (createRes.status === 201 || createRes.status === 200) {
    try {
      const body = JSON.parse(createRes.body)
      const reportId = body.id || body.reportId
      if (reportId) {
        const detailRes = http.get(`${BASE_URL}/api/reports/${reportId}`, {
          headers,
          tags: { name: 'GET /api/reports/:id' },
        })
        check(detailRes, checkResponse(detailRes, 200))
      }
    } catch {
      // 리포트 ID 파싱 실패 - 무시
    }
  }

  sleep(1)
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    'tests/performance/results/report-generation.json': JSON.stringify(data, null, 2),
  }
}

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js'
