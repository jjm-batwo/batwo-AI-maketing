import type { IMetaPixelRepository } from '@domain/repositories/IMetaPixelRepository'
import type { IMetaPixelService } from '@application/ports/IMetaPixelService'
import type {
    TrackingHealthDTO,
    TrackingHealthStatus,
    TrackingHealthSuggestion,
} from '@application/dto/pixel/TrackingHealthDTO'
import { MATCH_RATE_THRESHOLDS } from '@application/dto/pixel/TrackingHealthDTO'
import { PixelNotFoundError } from '@domain/errors'

/**
 * CAPI 전송 통계 제공 인터페이스
 * IConversionEventRepository에서 그루핑 통계를 조회합니다.
 */
export interface ICAPIStatsProvider {
    getCAPIStatsByPixelId(pixelId: string): Promise<{
        sent: number
        failed: number
        expired: number
    }>
}

/**
 * 사용자의 Meta Access Token 조회 인터페이스
 */
export interface IAccessTokenProvider {
    getAccessTokenByUserId(userId: string): Promise<string | null>
}

export interface GetTrackingHealthInput {
    userId: string
    pixelId: string
}

/**
 * 픽셀 하이브리드 트래킹 건강 상태 조회 유스케이스
 *
 * Meta Graph API의 /{pixelId}/stats에서 match_rate_approx를 조회하고
 * CAPI 배치 전송 통계와 결합하여 트래킹 건강 상태를 종합 판정합니다.
 *
 * healthStatus 판정 기준:
 * - matchRate ≥ 0.6 → 'healthy'
 * - 0.4 ≤ matchRate < 0.6 → 'warning'
 * - matchRate < 0.4 → 'critical'
 * - stats null → 'unknown'
 */
export class GetTrackingHealthUseCase {
    constructor(
        private readonly pixelRepository: IMetaPixelRepository,
        private readonly metaPixelService: IMetaPixelService,
        private readonly capiStatsProvider: ICAPIStatsProvider,
        private readonly accessTokenProvider: IAccessTokenProvider,
    ) { }

    async execute(input: GetTrackingHealthInput): Promise<TrackingHealthDTO> {
        // 1. Pixel 조회 + 소유자 검증
        const pixel = await this.pixelRepository.findById(input.pixelId)
        if (!pixel || pixel.userId !== input.userId) {
            throw new PixelNotFoundError(input.pixelId)
        }

        // 2. AccessToken 조회
        const accessToken = await this.accessTokenProvider.getAccessTokenByUserId(input.userId)

        // 3. Meta Pixel Stats 조회 (accessToken이 없으면 건너뜀)
        let matchRate: number | null = null
        let matchedEventCount = 0
        let unmatchedEventCount = 0

        if (accessToken) {
            try {
                const stats = await this.metaPixelService.getPixelStats(accessToken, pixel.metaPixelId)
                if (stats) {
                    matchRate = stats.matchRate
                    matchedEventCount = stats.matchedEventCount
                    unmatchedEventCount = stats.unmatchedEventCount
                }
            } catch {
                // API 오류 시 unknown으로 처리 (서비스 가용성 우선)
            }
        }

        // 4. CAPI 전송 통계 조회
        const capiStats = await this.capiStatsProvider.getCAPIStatsByPixelId(input.pixelId)

        // 5. healthStatus 판정
        const healthStatus = this.determineHealthStatus(matchRate)

        // 6. suggestions 생성
        const suggestions = this.generateSuggestions(healthStatus, matchRate, capiStats)

        return {
            pixelId: pixel.id,
            metaPixelId: pixel.metaPixelId,
            healthStatus,
            matchRate,
            matchedEventCount,
            unmatchedEventCount,
            capiEventsSent: capiStats.sent,
            capiEventsFailed: capiStats.failed,
            capiEventsExpired: capiStats.expired,
            suggestions,
            lastCheckedAt: new Date().toISOString(),
        }
    }

    private determineHealthStatus(matchRate: number | null): TrackingHealthStatus {
        if (matchRate === null) return 'unknown'
        if (matchRate >= MATCH_RATE_THRESHOLDS.HEALTHY) return 'healthy'
        if (matchRate >= MATCH_RATE_THRESHOLDS.WARNING) return 'warning'
        return 'critical'
    }

    private generateSuggestions(
        healthStatus: TrackingHealthStatus,
        matchRate: number | null,
        capiStats: { sent: number; failed: number; expired: number },
    ): TrackingHealthSuggestion[] {
        const suggestions: TrackingHealthSuggestion[] = []

        // matchRate 기반 제안
        if (healthStatus === 'warning') {
            suggestions.push({
                key: 'low_match_rate_warning',
                message:
                    '이벤트 매칭률이 낮습니다. 고객 이메일이나 전화번호를 해시하여 전송하면 매칭률을 높일 수 있습니다.',
                severity: 'warn',
            })
        }

        if (healthStatus === 'critical') {
            suggestions.push({
                key: 'low_match_rate_critical',
                message:
                    '이벤트 매칭률이 매우 낮아 광고 성과에 심각한 영향을 줄 수 있습니다. userData(이메일, 전화번호, IP, 브라우저 정보)를 즉시 추가하세요.',
                severity: 'error',
            })
            suggestions.push({
                key: 'check_capi_setup',
                message:
                    'CAPI(전환 API)가 올바르게 설정되었는지 확인하세요. 픽셀과 CAPI를 함께 사용하면 기여 전환수가 평균 24% 상승합니다.',
                severity: 'error',
            })
        }

        // CAPI 실패 관련 제안
        if (capiStats.failed > 0) {
            suggestions.push({
                key: 'capi_failures',
                message: `CAPI 전송 실패 이벤트가 ${capiStats.failed}건 있습니다. 서버 로그를 확인하세요.`,
                severity: 'info',
            })
        }

        // CAPI 만료 관련 제안
        if (capiStats.expired > 0) {
            suggestions.push({
                key: 'capi_expired',
                message: `7일 초과로 만료된 이벤트가 ${capiStats.expired}건 있습니다. 이벤트 전송 주기를 확인하세요.`,
                severity: 'info',
            })
        }

        return suggestions
    }
}
