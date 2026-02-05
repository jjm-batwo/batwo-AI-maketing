import type { PrismaClient } from '@/generated/prisma'
import type {
  IPaymentLogRepository,
  PaymentLogData,
} from '@domain/repositories/IPaymentLogRepository'

export class PrismaPaymentLogRepository implements IPaymentLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(log: PaymentLogData): Promise<PaymentLogData> {
    const created = await this.prisma.paymentLog.create({
      data: {
        id: log.id,
        userId: log.userId,
        subscriptionId: log.subscriptionId,
        invoiceId: log.invoiceId,
        paymentKey: log.paymentKey,
        orderId: log.orderId,
        amount: log.amount,
        status: log.status,
        method: log.method,
        failReason: log.failReason,
        receiptUrl: log.receiptUrl,
        rawResponse: log.rawResponse as object | undefined,
      },
    })
    return this.toData(created)
  }

  async findByOrderId(orderId: string): Promise<PaymentLogData | null> {
    const record = await this.prisma.paymentLog.findUnique({
      where: { orderId },
    })
    return record ? this.toData(record) : null
  }

  async findByPaymentKey(paymentKey: string): Promise<PaymentLogData | null> {
    const record = await this.prisma.paymentLog.findUnique({
      where: { paymentKey },
    })
    return record ? this.toData(record) : null
  }

  async findBySubscriptionId(subscriptionId: string): Promise<PaymentLogData[]> {
    const records = await this.prisma.paymentLog.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map((r) => this.toData(r))
  }

  async findByUserId(userId: string, limit = 50): Promise<PaymentLogData[]> {
    const records = await this.prisma.paymentLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    return records.map((r) => this.toData(r))
  }

  async update(id: string, data: Partial<PaymentLogData>): Promise<PaymentLogData> {
    const updated = await this.prisma.paymentLog.update({
      where: { id },
      data: {
        paymentKey: data.paymentKey,
        status: data.status,
        method: data.method,
        failReason: data.failReason,
        receiptUrl: data.receiptUrl,
        rawResponse: data.rawResponse as object | undefined,
      },
    })
    return this.toData(updated)
  }

  private toData(record: {
    id: string
    userId: string
    subscriptionId: string | null
    invoiceId: string | null
    paymentKey: string | null
    orderId: string
    amount: number
    status: string
    method: string | null
    failReason: string | null
    receiptUrl: string | null
    rawResponse: unknown
    createdAt: Date
    updatedAt: Date
  }): PaymentLogData {
    return {
      id: record.id,
      userId: record.userId,
      subscriptionId: record.subscriptionId ?? undefined,
      invoiceId: record.invoiceId ?? undefined,
      paymentKey: record.paymentKey ?? undefined,
      orderId: record.orderId,
      amount: record.amount,
      status: record.status,
      method: record.method ?? undefined,
      failReason: record.failReason ?? undefined,
      receiptUrl: record.receiptUrl ?? undefined,
      rawResponse: record.rawResponse as Record<string, unknown> | undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }
  }
}
