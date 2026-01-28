export { initTelemetry, shutdownTelemetry, isTelemetryEnabled } from './instrumentation'
export { tracer, withSpan, setSpanAttribute, addSpanEvent } from './tracer'
export type { Span, Context } from './tracer'
