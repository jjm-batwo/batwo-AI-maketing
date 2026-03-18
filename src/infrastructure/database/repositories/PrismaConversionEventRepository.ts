import type { PrismaClient } from '@/generated/prisma'
import type {
  IConversionEventRepository,
  PixelTokenMapping,
} from '@domain/repositories/IConversionEventRepository'
import { ConversionEvent } from '@domain/entities/ConversionEvent'
import type { UserData, CustomData } from '@domain/entities/ConversionEvent'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

const DEFAULT_BATCH_LIMIT = 1000

/**
 * Prisma 기반 ConversionEvent 리포지토리 구현
 *
 * CAPI 배치 전송 크론에서 사용.
 * sentToMeta=false인 이벤트를 조회하고 전송 결과를 업데이트한다.
 */
export class PrismaConversionEventRepository implements IConversionEventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findUnsentEvents(limit: number = DEFAULT_BATCH_LIMIT): Promise<ConversionEvent[]> {
    const records = await this.prisma.conversionEvent.findMany({
      where: { sentToMeta: false },
      orderBy: { createdAt: 'asc' }, // 오래된 이벤트 먼저 처리
      take: limit,
    })

    return records.map((r) =>
      ConversionEvent.restore({
        id: r.id,
        pixelId: r.pixelId,
        eventName: r.eventName,
        eventId: r.eventId,
        eventTime: r.eventTime,
        eventSourceUrl: r.eventSourceUrl ?? undefined,
        userData: (r.userData as UserData) ?? undefined,
        customData: (r.customData as CustomData) ?? undefined,
        sentToMeta: r.sentToMeta,
        metaResponseId: r.metaResponseId ?? undefined,
        createdAt: r.createdAt,
      })
    )
  }

  async markSentBatch(ids: string[], metaResponseId: string): Promise<void> {
    await this.prisma.conversionEvent.updateMany({
      where: { id: { in: ids } },
      data: {
        sentToMeta: true,
        metaResponseId,
      },
    })
  }

  async markExpiredBatch(ids: string[]): Promise<void> {
    await this.prisma.conversionEvent.updateMany({
      where: { id: { in: ids } },
      data: {
        sentToMeta: true,
        metaResponseId: 'EXPIRED',
      },
    })
  }

  async incrementRetryBatch(ids: string[]): Promise<void> {
    if (ids.length === 0) return

    // Supabase Best Practice: N+1 제거 → 단일 SQL (data-n-plus-one)
    // N개 SELECT + N개 UPDATE → 단일 UPDATE with CASE 표현식
    // RETRY_N 패턴 유지: null → RETRY_1 → RETRY_2 → RETRY_3
    await this.prisma.$executeRawUnsafe(
      `UPDATE "ConversionEvent"
       SET "metaResponseId" = CASE
         WHEN "metaResponseId" IS NULL OR "metaResponseId" NOT LIKE 'RETRY_%'
           THEN 'RETRY_1'
         ELSE 'RETRY_' || (
           COALESCE(
             NULLIF(regexp_replace("metaResponseId", '^RETRY_', ''), '')::int,
             0
           ) + 1
         )::text
       END
       WHERE id = ANY($1)`,
      ids
    )
  }

  /**
   * pixelId 목록으로 Meta 전송에 필요한 픽셀/토큰 매핑 조회
   * MetaPixel → userId → MetaAdAccount(accessToken) 두 단계 조회.
   * accessToken은 safeDecryptToken으로 복호화하여 반환 (평문/암호화 모두 처리)
   */
  async findPixelTokenMappings(pixelIds: string[]): Promise<PixelTokenMapping[]> {
    // 1단계: pixelId → metaPixelId, userId 조회
    const pixels = await this.prisma.metaPixel.findMany({
      where: { id: { in: pixelIds } },
      select: { id: true, metaPixelId: true, userId: true },
    })

    if (pixels.length === 0) return []

    // 2단계: userId → accessToken 조회 (MetaAdAccount는 userId당 1개)
    const uniqueUserIds = [...new Set(pixels.map((p) => p.userId))]
    const accounts = await this.prisma.metaAdAccount.findMany({
      where: { userId: { in: uniqueUserIds } },
      select: { userId: true, accessToken: true },
    })
    const tokenByUserId = new Map(accounts.map((a) => [a.userId, a.accessToken]))

    // 3단계: 매핑 조합
    const mappings: PixelTokenMapping[] = []
    for (const p of pixels) {
      const rawToken = tokenByUserId.get(p.userId)
      if (!rawToken) continue
      mappings.push({
        pixelId: p.id,
        metaPixelId: p.metaPixelId,
        accessToken: safeDecryptToken(rawToken),
      })
    }
    return mappings
  }

  /**
   * 재시도 ID 계산
   * null / undefined → 'RETRY_1'
   * 'RETRY_1' → 'RETRY_2'
   * 'RETRY_2' → 'RETRY_3'
   * 'RETRY_3' 이상 → 'FAILED' (UseCase에서 처리하므로 여기선 방어 코드)
   */
  private nextRetryId(current: string | null): string {
    if (!current || !current.startsWith('RETRY_')) return 'RETRY_1'
    const num = parseInt(current.replace('RETRY_', ''), 10)
    if (isNaN(num)) return 'RETRY_1'
    return `RETRY_${num + 1}`
  }

  /**
   * 특정 픽셀의 CAPI 이벤트 전송 통계 (sent, expired, failed) 조회
   */
  async countByPixelIdGrouped(
    pixelId: string
  ): Promise<{ sent: number; failed: number; expired: number }> {
    const events = await this.prisma.conversionEvent.groupBy({
      by: ['metaResponseId'],
      where: { pixelId },
      _count: true,
    })

    let sent = 0
    let failed = 0
    let expired = 0

    for (const e of events) {
      if (e.metaResponseId === 'EXPIRED') {
        expired += e._count
      } else if (e.metaResponseId === 'FAILED') {
        failed += e._count
      } else if (
        e.metaResponseId &&
        e.metaResponseId !== 'RETRY_1' &&
        e.metaResponseId !== 'RETRY_2' &&
        e.metaResponseId !== 'RETRY_3'
      ) {
        sent += e._count
      }
    }

    return { sent, failed, expired }
  }

  async countByEventName(
    pixelId: string,
    eventName: string,
    since: Date
  ): Promise<{ count: number; value: number }> {
    const result = await this.prisma.conversionEvent.aggregate({
      where: { pixelId, eventName, eventTime: { gte: since } },
      _count: true,
    })
    return { count: result._count, value: 0 }
  }
}
