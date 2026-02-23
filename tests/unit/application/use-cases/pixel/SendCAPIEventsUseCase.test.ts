import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SendCAPIEventsUseCase } from '@application/use-cases/pixel/SendCAPIEventsUseCase'
import type { IConversionEventRepository, PixelTokenMapping } from '@domain/repositories/IConversionEventRepository'
import type { ICAPIService } from '@application/ports/ICAPIService'
import { ConversionEvent } from '@domain/entities/ConversionEvent'

// 테스트 헬퍼: ConversionEvent 픽스처 생성
function makeEvent(overrides: {
  id?: string
  pixelId?: string
  sentToMeta?: boolean
  metaResponseId?: string
  eventTime?: Date
  eventName?: string
} = {}): ConversionEvent {
  const now = new Date()
  const eventTime = overrides.eventTime ?? new Date(now.getTime() - 1000) // 1초 전 (과거)

  return ConversionEvent.restore({
    id: overrides.id ?? 'event-1',
    pixelId: overrides.pixelId ?? 'pixel-1',
    eventName: overrides.eventName ?? 'PageView',
    eventId: `evt-${overrides.id ?? '1'}`,
    eventTime,
    sentToMeta: overrides.sentToMeta ?? false,
    metaResponseId: overrides.metaResponseId,
    createdAt: new Date(now.getTime() - 60000),
  })
}

// IConversionEventRepository Mock (findPixelTokenMappings 포함)
function makeMockEventRepo(
  events: ConversionEvent[] = [],
  pixelMappings: PixelTokenMapping[] = []
): IConversionEventRepository & {
  findUnsentEvents: ReturnType<typeof vi.fn>
  markSentBatch: ReturnType<typeof vi.fn>
  markExpiredBatch: ReturnType<typeof vi.fn>
  incrementRetryBatch: ReturnType<typeof vi.fn>
  findPixelTokenMappings: ReturnType<typeof vi.fn>
} {
  return {
    findUnsentEvents: vi.fn().mockResolvedValue(events),
    markSentBatch: vi.fn().mockResolvedValue(undefined),
    markExpiredBatch: vi.fn().mockResolvedValue(undefined),
    incrementRetryBatch: vi.fn().mockResolvedValue(undefined),
    findPixelTokenMappings: vi.fn().mockResolvedValue(pixelMappings),
  }
}

// ICAPIService Mock
function makeMockCAPIService(eventsReceived = 1): ICAPIService {
  return {
    sendEvent: vi.fn(),
    sendEvents: vi.fn().mockResolvedValue({
      eventsReceived,
      fbTraceId: 'trace-abc123',
    }),
    sendTestEvent: vi.fn(),
    formatEvent: vi.fn(),
  }
}

describe('SendCAPIEventsUseCase', () => {
  let eventRepo: ReturnType<typeof makeMockEventRepo>
  let capiService: ICAPIService
  let useCase: SendCAPIEventsUseCase

  beforeEach(() => {
    vi.clearAllMocks()
    eventRepo = makeMockEventRepo()
    capiService = makeMockCAPIService()
    useCase = new SendCAPIEventsUseCase(eventRepo, capiService)
  })

  describe('execute - 기본 흐름', () => {
    it('should_return_zero_counts_when_no_unsent_events_exist', async () => {
      // GIVEN: 미전송 이벤트 없음
      eventRepo.findUnsentEvents.mockResolvedValue([])

      // WHEN
      const result = await useCase.execute()

      // THEN
      expect(result.processed).toBe(0)
      expect(result.sent).toBe(0)
      expect(result.expired).toBe(0)
      expect(result.failed).toBe(0)
      expect(capiService.sendEvents).not.toHaveBeenCalled()
    })

    it('should_send_valid_events_to_meta_and_mark_as_sent', async () => {
      // GIVEN: 픽셀 1개, 이벤트 2개, 계정 토큰 존재
      const events = [
        makeEvent({ id: 'e1', pixelId: 'pixel-1' }),
        makeEvent({ id: 'e2', pixelId: 'pixel-1' }),
      ]
      eventRepo.findUnsentEvents.mockResolvedValue(events)
      eventRepo.findPixelTokenMappings.mockResolvedValue([
        { pixelId: 'pixel-1', metaPixelId: 'meta-pixel-1', accessToken: 'access-token-abc' },
      ])

      ;(capiService.sendEvents as ReturnType<typeof vi.fn>).mockResolvedValue({
        eventsReceived: 2,
        fbTraceId: 'trace-xyz',
      })

      // WHEN
      const result = await useCase.execute()

      // THEN: sent=2
      expect(result.sent).toBe(2)
      expect(result.expired).toBe(0)
      expect(result.failed).toBe(0)
      expect(eventRepo.markSentBatch).toHaveBeenCalled()
    })

    it('should_mark_stale_events_as_expired_without_sending_to_meta', async () => {
      // GIVEN: 8일 전 이벤트 (stale)
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
      const staleEvent = makeEvent({ id: 'e-stale', pixelId: 'pixel-1', eventTime: eightDaysAgo })
      eventRepo.findUnsentEvents.mockResolvedValue([staleEvent])
      // stale 이벤트는 activeEvents가 없어 findPixelTokenMappings 호출 안 됨

      // WHEN
      const result = await useCase.execute()

      // THEN: Meta 전송 없이 EXPIRED 마킹
      expect(result.expired).toBe(1)
      expect(result.sent).toBe(0)
      expect(capiService.sendEvents).not.toHaveBeenCalled()
      expect(eventRepo.markExpiredBatch).toHaveBeenCalled()
    })

    it('should_increment_retry_count_when_meta_api_call_fails', async () => {
      // GIVEN: 이벤트 1개, CAPI 전송 실패
      const event = makeEvent({ id: 'e1', pixelId: 'pixel-1' })
      eventRepo.findUnsentEvents.mockResolvedValue([event])
      eventRepo.findPixelTokenMappings.mockResolvedValue([
        { pixelId: 'pixel-1', metaPixelId: 'meta-pixel-1', accessToken: 'access-token-abc' },
      ])
      ;(capiService.sendEvents as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Meta API error')
      )

      // WHEN
      const result = await useCase.execute()

      // THEN: 재시도 횟수 증가, sent=0
      expect(result.failed).toBe(1)
      expect(result.sent).toBe(0)
      expect(eventRepo.incrementRetryBatch).toHaveBeenCalled()
    })

    it('should_mark_event_as_failed_when_retry_count_exceeds_3', async () => {
      // GIVEN: metaResponseId가 'RETRY_3'인 이벤트 (3회 초과)
      const event = makeEvent({
        id: 'e1',
        pixelId: 'pixel-1',
        metaResponseId: 'RETRY_3',
      })
      eventRepo.findUnsentEvents.mockResolvedValue([event])
      eventRepo.findPixelTokenMappings.mockResolvedValue([
        { pixelId: 'pixel-1', metaPixelId: 'meta-pixel-1', accessToken: 'access-token-abc' },
      ])

      // WHEN
      const result = await useCase.execute()

      // THEN: FAILED 마킹
      expect(result.failed).toBe(1)
      expect(eventRepo.markSentBatch).toHaveBeenCalledWith(
        expect.arrayContaining([event.id]),
        'FAILED'
      )
      expect(eventRepo.incrementRetryBatch).not.toHaveBeenCalled()
    })

    it('should_group_events_by_pixel_and_use_correct_access_token', async () => {
      // GIVEN: 픽셀 2개, 각각 다른 accessToken
      const eventsPixel1 = [makeEvent({ id: 'e1', pixelId: 'pixel-1' })]
      const eventsPixel2 = [makeEvent({ id: 'e2', pixelId: 'pixel-2' })]
      eventRepo.findUnsentEvents.mockResolvedValue([...eventsPixel1, ...eventsPixel2])

      // pixel-1 → token-A, pixel-2 → token-B
      eventRepo.findPixelTokenMappings.mockResolvedValue([
        { pixelId: 'pixel-1', metaPixelId: 'meta-pixel-1', accessToken: 'token-A' },
        { pixelId: 'pixel-2', metaPixelId: 'meta-pixel-2', accessToken: 'token-B' },
      ])

      ;(capiService.sendEvents as ReturnType<typeof vi.fn>).mockResolvedValue({
        eventsReceived: 1,
        fbTraceId: 'trace-1',
      })

      // WHEN
      await useCase.execute()

      // THEN: sendEvents가 2번 호출 (픽셀별로)
      expect(capiService.sendEvents).toHaveBeenCalledTimes(2)
    })
  })
})
