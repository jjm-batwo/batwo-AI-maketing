import {
  IMetaAdAccountRepository,
  MetaAdAccountTokenRecord,
} from '@application/ports/IMetaAdAccountRepository'
import { PrismaClient } from '@/generated/prisma'

export class PrismaMetaAdAccountRepository implements IMetaAdAccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUserId(userId: string): Promise<MetaAdAccountTokenRecord | null> {
    const account = await this.prisma.metaAdAccount.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        metaAccountId: true,
        accessToken: true,
        tokenExpiry: true,
      },
    })

    return account
  }

  async findExpiringBefore(thresholdDate: Date): Promise<MetaAdAccountTokenRecord[]> {
    return this.prisma.metaAdAccount.findMany({
      where: {
        tokenExpiry: {
          lte: thresholdDate,
        },
      },
      select: {
        id: true,
        userId: true,
        metaAccountId: true,
        accessToken: true,
        tokenExpiry: true,
      },
    })
  }

  async updateToken(accountId: string, encryptedToken: string, tokenExpiry: Date): Promise<void> {
    await this.prisma.metaAdAccount.update({
      where: { id: accountId },
      data: {
        accessToken: encryptedToken,
        tokenExpiry,
      },
    })
  }
}
