import type { IConversionEventRepository } from '@domain/repositories/IConversionEventRepository'
import type { ICAPIService, CAPIEventInput } from '@application/ports/ICAPIService'
import type { ConversionEvent } from '@domain/entities/ConversionEvent'

const MAX_BATCH_LIMIT = 1000

// metaResponseId 기반 재시도 횟수 추출
const RETRY_PATTERN = /^RETRY_(\d+)$/
const MAX_RETRY_COUNT = 3

/**
 * CAPI 배치 전송 유스케이스
 *
 * Vercel Cron(5분 간격)에서 호출됨.
 * sentToMeta=false인 ConversionEvent를 최대 1000건 조회하여:
 *   - stale(7일+) 이벤트 → EXPIRED 마킹 (Meta 전송 없음)
 *   - 3회 초과 실패 이벤트 → FAILED 마킹
 *   - 정상 이벤트 → pixelId별 그룹핑 후 Meta CAPI 전송
 */
export interface SendCAPIEventsResult {
  processed: number
  sent: number
  expired: number
  failed: number
  errors: string[]
}

export class SendCAPIEventsUseCase {
  constructor(
    private readonly conversionEventRepository: IConversionEventRepository,
    private readonly capiService: ICAPIService
  ) {}

  async execute(): Promise<SendCAPIEventsResult> {
    const result: SendCAPIEventsResult = {
      processed: 0,
      sent: 0,
      expired: 0,
      failed: 0,
      errors: [],
    }

    // 1. 미전송 이벤트 조회 (최대 1000건)
    const events = await this.conversionEventRepository.findUnsentEvents(MAX_BATCH_LIMIT)
    if (events.length === 0) {
      return result
    }
    result.processed = events.length

    // 2. stale 이벤트 분리 (7일+ → EXPIRED, Meta 전송 없음)
    const staleEvents = events.filter((e) => e.isStale())
    const activeEvents = events.filter((e) => !e.isStale())

    if (staleEvents.length > 0) {
      const staleIds = staleEvents.map((e) => e.id)
      await this.conversionEventRepository.markExpiredBatch(staleIds)
      result.expired += staleEvents.length
    }

    if (activeEvents.length === 0) {
      return result
    }

    // 3. 고유 pixelId 수집 → Repository를 통해 픽셀/토큰 매핑 조회
    const uniquePixelIds = [...new Set(activeEvents.map((e) => e.pixelId))]
    const pixelMappings = await this.conversionEventRepository.findPixelTokenMappings(uniquePixelIds)
    // pixelId → { metaPixelId, accessToken } 매핑
    const mappingByPixelId = new Map(pixelMappings.map((m) => [m.pixelId, m]))

    // 4. pixelId별로 이벤트 그룹핑 후 전송
    const eventsByPixel = new Map<string, ConversionEvent[]>()
    for (const event of activeEvents) {
      const group = eventsByPixel.get(event.pixelId) ?? []
      group.push(event)
      eventsByPixel.set(event.pixelId, group)
    }

    for (const [pixelId, pixelEvents] of eventsByPixel) {
      const mapping = mappingByPixelId.get(pixelId)
      if (!mapping) {
        // pixelId에 해당하는 MetaPixel 또는 accessToken이 없으면 실패 처리
        result.failed += pixelEvents.length
        result.errors.push(`MetaPixel not found: ${pixelId}`)
        continue
      }

      // 3회 초과 실패 이벤트와 정상 이벤트 분리
      const failedPermanently: ConversionEvent[] = []
      const sendable: ConversionEvent[] = []

      for (const event of pixelEvents) {
        if (this.isMaxRetryExceeded(event.metaResponseId)) {
          failedPermanently.push(event)
        } else {
          sendable.push(event)
        }
      }

      // 3회 초과 → FAILED 마킹
      if (failedPermanently.length > 0) {
        const failedIds = failedPermanently.map((e) => e.id)
        await this.conversionEventRepository.markSentBatch(failedIds, 'FAILED')
        result.failed += failedPermanently.length
      }

      // 정상 이벤트 → Meta CAPI 전송
      if (sendable.length > 0) {
        await this.sendEventsForPixel(
          mapping.metaPixelId,
          mapping.accessToken,
          sendable,
          result
        )
      }
    }

    return result
  }

  /**
   * 특정 픽셀의 이벤트들을 Meta CAPI로 전송하고 결과 업데이트
   */
  private async sendEventsForPixel(
    metaPixelId: string,
    accessToken: string,
    events: ConversionEvent[],
    result: SendCAPIEventsResult
  ): Promise<void> {
    const capiInputs: CAPIEventInput[] = events.map((e) => ({
      eventName: e.eventName,
      eventTime: e.eventTime,
      eventId: e.eventId,
      eventSourceUrl: e.eventSourceUrl,
      userData: e.userData,
      customData: e.customData,
      actionSource: 'website',
    }))

    try {
      const response = await this.capiService.sendEvents(accessToken, metaPixelId, capiInputs)
      const ids = events.map((e) => e.id)
      const traceId = response.fbTraceId ?? `SENT_${Date.now()}`
      await this.conversionEventRepository.markSentBatch(ids, traceId)
      result.sent += events.length
    } catch (error) {
      // 전송 실패 → 재시도 횟수 증가
      const ids = events.map((e) => e.id)
      await this.conversionEventRepository.incrementRetryBatch(ids)
      result.failed += events.length
      const message = error instanceof Error ? error.message : String(error)
      result.errors.push(`Pixel ${metaPixelId}: ${message}`)
    }
  }

  /**
   * metaResponseId 기반으로 최대 재시도 횟수 초과 여부 확인
   * 'RETRY_3' 이상이면 true
   */
  private isMaxRetryExceeded(metaResponseId: string | undefined): boolean {
    if (!metaResponseId) return false
    const match = metaResponseId.match(RETRY_PATTERN)
    if (!match) return false
    return parseInt(match[1], 10) >= MAX_RETRY_COUNT
  }
}
