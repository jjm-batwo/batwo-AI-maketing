/**
 * 트래킹 건강 상태 DTO
 *
 * Pixel(브라우저) + CAPI(서버) 하이브리드 트래킹의 상태를 종합 판정합니다.
 * matchRate는 Meta Graph API /{pixelId}/stats의 match_rate_approx를 기반으로
 * EMQ(Event Match Quality) 근사치로 사용합니다.
 */

/** 건강 상태 판정 레벨 */
export type TrackingHealthStatus = 'healthy' | 'warning' | 'critical' | 'unknown'

/** matchRate 임계값 상수 */
export const MATCH_RATE_THRESHOLDS = {
    /** 이 값 이상이면 healthy (≈ EMQ 6.0+) */
    HEALTHY: 0.6,
    /** 이 값 이상이면 warning, 미만이면 critical (≈ EMQ 4.0) */
    WARNING: 0.4,
} as const

/** 개선 제안 항목 */
export interface TrackingHealthSuggestion {
    /** 제안 키 (i18n 매핑용) */
    key: string
    /** 제안 메시지 (기본 한국어) */
    message: string
    /** 심각도: info | warn | error */
    severity: 'info' | 'warn' | 'error'
}

/** 트래킹 건강 상태 응답 DTO */
export interface TrackingHealthDTO {
    pixelId: string
    metaPixelId: string
    healthStatus: TrackingHealthStatus
    /** match_rate_approx (0~1, null이면 데이터 없음) */
    matchRate: number | null
    matchedEventCount: number
    unmatchedEventCount: number
    /** CAPI 배치 전송 통계 */
    capiEventsSent: number
    capiEventsFailed: number
    capiEventsExpired: number
    /** 개선 제안 목록 */
    suggestions: TrackingHealthSuggestion[]
    lastCheckedAt: string
}
