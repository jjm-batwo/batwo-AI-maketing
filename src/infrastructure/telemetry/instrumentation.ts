import { NodeSDK } from '@opentelemetry/sdk-node'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'

/**
 * OpenTelemetry SDK 인스턴스
 * 프로덕션 환경에서만 활성화
 */
let sdk: NodeSDK | null = null

/**
 * OpenTelemetry 초기화
 * 환경 변수 OTEL_ENABLED=true 일 때만 활성화
 */
export function initTelemetry(): void {
  const isEnabled = process.env.OTEL_ENABLED === 'true'
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT

  if (!isEnabled) {
    console.log('[Telemetry] OpenTelemetry disabled (OTEL_ENABLED != true)')
    return
  }

  if (!endpoint) {
    console.warn('[Telemetry] OTEL_EXPORTER_OTLP_ENDPOINT not set, skipping initialization')
    return
  }

  try {
    const traceExporter = new OTLPTraceExporter({
      url: endpoint,
      headers: {},
    })

    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: 'batwo-marketing',
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '0.1.0',
      }),
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // HTTP/HTTPS 요청 자동 계측
          '@opentelemetry/instrumentation-http': {
            enabled: true,
          },
          // 불필요한 계측 비활성화 (성능 최적화)
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          '@opentelemetry/instrumentation-dns': {
            enabled: false,
          },
        }),
      ],
    })

    sdk.start()
    console.log('[Telemetry] OpenTelemetry initialized successfully')

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      try {
        await sdk?.shutdown()
        console.log('[Telemetry] OpenTelemetry shut down successfully')
      } catch (error) {
        console.error('[Telemetry] Error shutting down OpenTelemetry', error)
      }
    })
  } catch (error) {
    console.error('[Telemetry] Failed to initialize OpenTelemetry', error)
  }
}

/**
 * OpenTelemetry 종료 (테스트용)
 */
export async function shutdownTelemetry(): Promise<void> {
  if (sdk) {
    await sdk.shutdown()
    sdk = null
  }
}

/**
 * OpenTelemetry 활성화 여부 확인
 */
export function isTelemetryEnabled(): boolean {
  return sdk !== null
}
