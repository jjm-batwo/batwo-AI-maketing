import type { ConversionEvent } from '@domain/entities/ConversionEvent'

/**
 * ConversionEvent 리포지토리 포트 (도메인 레이어)
 *
 * CAPI 배치 전송에 필요한 이벤트 조회/업데이트 인터페이스.
 */

/**
 * 픽셀 ID → Meta 픽셀 ID + 복호화된 accessToken 매핑
 * SendCAPIEventsUseCase에서 Meta API 호출에 필요한 정보를 Repository를 통해 조회
 */
export interface PixelTokenMapping {
  pixelId: string
  metaPixelId: string
  accessToken: string
}

export interface IConversionEventRepository {
  /**
   * sentToMeta=false인 미전송 이벤트 조회 (최대 limit건)
   */
  findUnsentEvents(limit?: number): Promise<ConversionEvent[]>

  /**
   * 전송 성공한 이벤트 일괄 마킹
   * @param ids 이벤트 ID 목록
   * @param metaResponseId Meta에서 받은 응답 ID (또는 'FAILED', 'EXPIRED')
   */
  markSentBatch(ids: string[], metaResponseId: string): Promise<void>

  /**
   * stale 이벤트 일괄 EXPIRED 마킹 (sentToMeta=true, metaResponseId='EXPIRED')
   * @param ids 이벤트 ID 목록
   */
  markExpiredBatch(ids: string[]): Promise<void>

  /**
   * 전송 실패 시 재시도 횟수 증가 (metaResponseId: RETRY_1 → RETRY_2 → RETRY_3)
   * @param ids 이벤트 ID 목록
   */
  incrementRetryBatch(ids: string[]): Promise<void>

  /**
   * pixelId 목록으로 Meta 전송에 필요한 픽셀/토큰 매핑 조회
   * MetaPixel → User → MetaAdAccount(accessToken) 관계를 통해 조회하며,
   * accessToken은 복호화된 상태로 반환
   * @param pixelIds 조회할 픽셀 ID 목록
   */
  findPixelTokenMappings(pixelIds: string[]): Promise<PixelTokenMapping[]>
}
