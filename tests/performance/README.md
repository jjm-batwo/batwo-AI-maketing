# 성능 테스트 (k6)

## 개요

[k6](https://grafana.com/docs/k6/latest/)를 사용한 API 성능 테스트입니다.
주요 API 엔드포인트에 대한 기준선(baseline) 시나리오를 정의합니다.

## 사전 요구사항

```bash
# k6 설치 (macOS)
brew install k6

# 또는 다른 방법: https://grafana.com/docs/k6/latest/set-up/install-k6/
```

## 실행 방법

```bash
# 전체 시나리오 실행
npm run test:perf

# 개별 시나리오 실행
k6 run tests/performance/scenarios/campaigns-list.js
k6 run tests/performance/scenarios/kpi-dashboard.js
k6 run tests/performance/scenarios/report-generation.js

# 환경 변수 사용
k6 run \
  -e BASE_URL=http://localhost:3000 \
  -e AUTH_TOKEN=your-token \
  -e VUS=20 \
  -e DURATION=60s \
  tests/performance/scenarios/campaigns-list.js
```

## 시나리오

| 시나리오 | 파일 | 기준선 (p95) | 설명 |
|---------|------|-------------|------|
| 캠페인 목록 | `campaigns-list.js` | < 500ms | 대시보드 캠페인 목록 조회 |
| KPI 대시보드 | `kpi-dashboard.js` | < 800ms | KPI 요약 및 추이 조회 |
| 리포트 생성 | `report-generation.js` | < 3000ms | 주간 리포트 생성 (AI 포함) |
| 통합 실행 | `run-all.js` | < 1000ms | 전체 엔드포인트 순차 테스트 |

## 임계값 (Thresholds)

- **캠페인 목록**: p95 < 500ms, p99 < 800ms, 에러율 < 1%
- **KPI 대시보드**: p95 < 800ms, p99 < 1200ms, 에러율 < 1%
- **리포트 생성**: p95 < 3000ms, p99 < 5000ms, 에러율 < 5%

## 결과

테스트 결과는 `results/` 디렉토리에 JSON 형식으로 저장됩니다.
