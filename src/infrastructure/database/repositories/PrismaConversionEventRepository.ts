import type { PrismaClient } from '@/generated/prisma'
import type { IConversionEventRepository, PixelTokenMapping } from '@domain/repositories/IConversionEventRepository'
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
    // 현재 metaResponseId 값을 읽어 재시도 횟수를 계산
    // RETRY_N 패턴 유지: null → RETRY_1 → RETRY_2 → RETRY_3
    const records = await this.prisma.conversionEvent.findMany({
      where: { id: { in: ids } },
      select: { id: true, metaResponseId: true },
    })

    // 각 이벤트별로 다음 재시도 값 계산 후 업데이트
    await Promise.all(
      records.map((r) => {
        const nextRetryId = this.nextRetryId(r.metaResponseId)
        return this.prisma.conversionEvent.update({
          where: { id: r.id },
          data: { metaResponseId: nextRetryId },
        })
      })
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
}
