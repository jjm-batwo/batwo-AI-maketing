import type { PrismaClient } from '@/generated/prisma'
import type { IBillingKeyRepository } from '@domain/repositories/IBillingKeyRepository'
import { BillingKey } from '@domain/entities/BillingKey'

export class PrismaBillingKeyRepository implements IBillingKeyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(billingKey: BillingKey): Promise<BillingKey> {
    const data = billingKey.toJSON()
    const created = await this.prisma.billingKey.create({
      data: {
        id: data.id,
        userId: data.userId,
        billingKey: data.encryptedBillingKey,
        cardCompany: data.cardCompany,
        cardNumber: data.cardNumber,
        method: data.method,
        isActive: data.isActive,
        authenticatedAt: data.authenticatedAt,
      },
    })
    return this.toDomain(created)
  }

  async findById(id: string): Promise<BillingKey | null> {
    const record = await this.prisma.billingKey.findUnique({ where: { id } })
    return record ? this.toDomain(record) : null
  }

  async findByUserId(userId: string): Promise<BillingKey[]> {
    const records = await this.prisma.billingKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map((r) => this.toDomain(r))
  }

  async findActiveByUserId(userId: string): Promise<BillingKey | null> {
    const record = await this.prisma.billingKey.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
    return record ? this.toDomain(record) : null
  }

  async update(billingKey: BillingKey): Promise<BillingKey> {
    const data = billingKey.toJSON()
    const updated = await this.prisma.billingKey.update({
      where: { id: data.id },
      data: {
        billingKey: data.encryptedBillingKey,
        cardCompany: data.cardCompany,
        cardNumber: data.cardNumber,
        method: data.method,
        isActive: data.isActive,
      },
    })
    return this.toDomain(updated)
  }

  async deactivate(id: string): Promise<void> {
    await this.prisma.billingKey.update({
      where: { id },
      data: { isActive: false },
    })
  }

  private toDomain(record: {
    id: string
    userId: string
    billingKey: string
    cardCompany: string | null
    cardNumber: string | null
    method: string
    isActive: boolean
    authenticatedAt: Date
    createdAt: Date
    updatedAt: Date
  }): BillingKey {
    return BillingKey.restore({
      id: record.id,
      userId: record.userId,
      encryptedBillingKey: record.billingKey,
      cardCompany: record.cardCompany ?? undefined,
      cardNumber: record.cardNumber ?? undefined,
      method: record.method,
      isActive: record.isActive,
      authenticatedAt: record.authenticatedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
