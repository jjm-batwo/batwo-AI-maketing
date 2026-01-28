# OpenTelemetry 트레이싱 구현 완료

## 구현 개요

Infrastructure 계층에 OpenTelemetry 분산 트레이싱을 성공적으로 구현했습니다.

## 구현된 파일

### 1. 패키지 의존성
**파일**: `package.json`

추가된 패키지:
```json
{
  "@opentelemetry/api": "^1.9.0",
  "@opentelemetry/auto-instrumentations-node": "^0.53.0",
  "@opentelemetry/exporter-trace-otlp-http": "^0.54.0",
  "@opentelemetry/sdk-node": "^0.54.0"
}
```

### 2. Telemetry 인프라
**디렉토리**: `src/infrastructure/telemetry/`

#### `instrumentation.ts`
- OpenTelemetry SDK 초기화
- OTLP HTTP Exporter 설정
- 자동 계측 (HTTP/HTTPS) 활성화
- 환경 변수 기반 조건부 활성화
- Graceful shutdown 처리

주요 함수:
- `initTelemetry()`: SDK 초기화
- `shutdownTelemetry()`: SDK 종료 (테스트용)
- `isTelemetryEnabled()`: 활성화 여부 확인

#### `tracer.ts`
- Tracer 인스턴스 export
- 헬퍼 함수 제공

주요 함수:
```typescript
// 함수를 span으로 감싸기
withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>
): Promise<T>

// 현재 span에 속성 추가
setSpanAttribute(key: string, value: string | number | boolean): void

// 현재 span에 이벤트 추가
addSpanEvent(name: string, attributes?: Record<...>): void
```

#### `index.ts`
- Public API export
- 타입 재export

#### `README.md`
- 사용법 문서
- 환경 설정 가이드
- 로컬 개발 환경 설정 (Jaeger, Grafana Tempo)
- 문제 해결 가이드

### 3. 외부 API 트레이싱

#### Meta Ads Client (`src/infrastructure/external/meta-ads/MetaAdsClient.ts`)

추가된 tracing:
- `meta.createCampaign` - 캠페인 생성
  - Attributes: `meta.adAccountId`, `meta.campaign.name`, `meta.campaign.objective`
- `meta.getCampaign` - 캠페인 조회
  - Attributes: `meta.campaignId`
- `meta.getCampaignInsights` - 캠페인 통계 조회
  - Attributes: `meta.campaignId`, `meta.datePreset`

#### OpenAI AIService (`src/infrastructure/external/openai/AIService.ts`)

추가된 tracing:
- `openai.generateCampaignOptimization` - 캠페인 최적화
  - Attributes: `openai.model`, `openai.operation=campaign_optimization`
- `openai.generateReportInsights` - 리포트 인사이트
  - Attributes: `openai.model`, `openai.operation=report_insights`
- `openai.generateAdCopy` - 광고 카피 생성
  - Attributes: `openai.model`, `openai.operation=ad_copy`
- `openai.generateBudgetRecommendation` - 예산 추천
  - Attributes: `openai.model`, `openai.operation=budget_recommendation`

### 4. Next.js 통합
**파일**: `instrumentation.ts` (프로젝트 루트)

변경사항:
- OpenTelemetry 초기화를 `register()` 함수에 추가
- Node.js 런타임에서만 활성화 (Edge 런타임 제외)
- Sentry보다 먼저 초기화되어 전체 요청 추적

### 5. 환경 변수
**파일**: `.env.example`

추가된 설정:
```bash
# -------------------------------------------
# Observability - OpenTelemetry (선택)
# -------------------------------------------
# OpenTelemetry 활성화 여부 (프로덕션 권장)
OTEL_ENABLED="false"
# OTLP Exporter 엔드포인트 (예: Jaeger, Grafana Tempo)
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318/v1/traces"
```

## 사용법

### 1. 활성화

`.env.local` 파일에 추가:
```bash
OTEL_ENABLED="true"
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318/v1/traces"
```

### 2. 로컬 Jaeger 실행

```bash
docker run -d --name jaeger \
  -e COLLECTOR_OTLP_ENABLED=true \
  -p 16686:16686 \
  -p 4318:4318 \
  jaegertracing/all-in-one:latest
```

Jaeger UI: http://localhost:16686

### 3. 애플리케이션 시작

```bash
npm run dev
```

### 4. 추적 확인

1. API 요청 실행 (예: 캠페인 생성)
2. Jaeger UI에서 "batwo-marketing" 서비스 선택
3. Trace 목록에서 요청 확인
4. Span 세부정보에서 Meta/OpenAI API 호출 타이밍 확인

## 추가 구현 예시

새로운 외부 서비스 추적:

```typescript
import { withSpan } from '@infrastructure/telemetry'

class NewServiceClient {
  async fetchData(id: string) {
    return withSpan(
      'newservice.fetchData',
      async () => {
        const response = await fetch(`https://api.example.com/data/${id}`)
        return response.json()
      },
      {
        'service.id': id,
        'service.endpoint': 'fetchData',
      }
    )
  }
}
```

## 성능 고려사항

- **오버헤드**: 약 1-3% CPU, 메모리 영향 최소
- **조건부 활성화**: `OTEL_ENABLED` 환경 변수로 제어
- **비프로덕션 환경**: 기본적으로 비활성화 (`false`)
- **자동 계측**: HTTP/HTTPS만 활성화, FS/DNS 비활성화

## 검증 완료

- ✅ TypeScript 타입 체크 통과 (`npm run type-check`)
- ✅ OpenTelemetry SDK 정상 초기화
- ✅ Meta Ads API 호출 tracing 추가
- ✅ OpenAI API 호출 tracing 추가
- ✅ 환경 변수 설정 문서화
- ✅ 사용법 README 작성

## 다음 단계 (선택)

1. **샘플링 설정**: 프로덕션에서 트래픽 기반 샘플링
2. **커스텀 메트릭**: OpenTelemetry Metrics API 추가
3. **로그 통합**: OpenTelemetry Logs 통합
4. **대시보드 구성**: Grafana에서 SLI/SLO 대시보드 생성
5. **알람 설정**: P95 latency, error rate 기반 알람

## 참고 문서

- `src/infrastructure/telemetry/README.md` - 상세 사용 가이드
- [OpenTelemetry JS Docs](https://opentelemetry.io/docs/instrumentation/js/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
