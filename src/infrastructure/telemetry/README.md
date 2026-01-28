# OpenTelemetry Tracing

바투 마케팅 솔루션의 OpenTelemetry 분산 트레이싱 구현

## 개요

외부 API 호출(Meta Ads, OpenAI)의 성능과 오류를 추적하기 위한 OpenTelemetry 계측입니다.

## 환경 변수

```bash
# OpenTelemetry 활성화 (프로덕션 권장)
OTEL_ENABLED="true"

# OTLP Exporter 엔드포인트
# Jaeger: http://localhost:4318/v1/traces
# Grafana Tempo: https://tempo.example.com:443/v1/traces
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318/v1/traces"
```

## 자동 계측

다음 작업들은 자동으로 추적됩니다:

- **HTTP/HTTPS 요청**: fetch, http/https 모듈
- **Meta Ads API 호출**: `meta.createCampaign`, `meta.getCampaign`, `meta.getCampaignInsights`
- **OpenAI API 호출**: `openai.generateCampaignOptimization`, `openai.generateReportInsights`, `openai.generateAdCopy`

## 수동 계측

새로운 외부 API 호출에 tracing을 추가하려면:

```typescript
import { withSpan } from '@infrastructure/telemetry'

async function myExternalApiCall() {
  return withSpan(
    'myservice.operation',
    async () => {
      // API 호출 로직
      const result = await fetch('https://api.example.com')
      return result.json()
    },
    {
      // Span 속성 (선택)
      'service.endpoint': 'https://api.example.com',
      'operation.type': 'read',
    }
  )
}
```

## Span 속성 추가

```typescript
import { setSpanAttribute, addSpanEvent } from '@infrastructure/telemetry'

async function processData() {
  setSpanAttribute('data.size', 1024)
  setSpanAttribute('data.format', 'json')

  // 이벤트 추가
  addSpanEvent('data.validated', {
    'validation.result': 'success',
  })
}
```

## 로컬 개발 환경 설정

### Jaeger (Docker)

```bash
# Jaeger All-in-One 시작
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest

# UI: http://localhost:16686
```

### Grafana Tempo (Docker Compose)

```yaml
# docker-compose.yml
version: '3'
services:
  tempo:
    image: grafana/tempo:latest
    command: [ "-config.file=/etc/tempo.yaml" ]
    volumes:
      - ./tempo.yaml:/etc/tempo.yaml
    ports:
      - "4318:4318"   # OTLP HTTP
      - "3200:3200"   # Tempo UI
```

## 성능 영향

- **오버헤드**: 약 1-3% CPU, 메모리 영향 최소
- **샘플링**: 프로덕션에서는 샘플링 설정 권장 (현재 100% 추적)
- **비활성화**: `OTEL_ENABLED=false` 시 완전 비활성화

## 모니터링 대시보드

Jaeger UI 주요 메트릭:

- **P95 Latency**: Meta API 호출 지연시간
- **Error Rate**: OpenAI API 오류율
- **Request Volume**: 시간대별 API 호출량
- **Dependency Graph**: 서비스 간 의존성 시각화

## 문제 해결

### Trace가 표시되지 않음

1. `OTEL_ENABLED=true` 확인
2. `OTEL_EXPORTER_OTLP_ENDPOINT` URL 확인
3. 서버 로그에서 `[Telemetry] OpenTelemetry initialized successfully` 확인
4. Exporter 엔드포인트 접근 가능 여부 확인

### 타입 에러

```bash
# OpenTelemetry 타입 설치 확인
npm list @opentelemetry/api
```

## 참고 자료

- [OpenTelemetry JavaScript Docs](https://opentelemetry.io/docs/instrumentation/js/)
- [OTLP Exporter Spec](https://opentelemetry.io/docs/specs/otlp/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Grafana Tempo](https://grafana.com/docs/tempo/)
