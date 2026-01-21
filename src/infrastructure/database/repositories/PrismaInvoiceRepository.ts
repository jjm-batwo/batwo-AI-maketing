import { PrismaClient, InvoiceStatus as PrismaStatus, Prisma } from '@/generated/prisma'
import { IInvoiceRepository, InvoiceFilters, PaymentStats } from '@domain/repositories/IInvoiceRepository'
import { PaginatedResult } from '@domain/repositories/ICampaignRepository'
import { Invoice } from '@domain/entities/Invoice'
import { InvoiceStatus } from '@domain/value-objects/InvoiceStatus'
import { InvoiceMapper } from '../mappers/InvoiceMapper'

export class PrismaInvoiceRepository implements IInvoiceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Invoice | null> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    })

    if (!invoice) {
      return null
    }

    return InvoiceMapper.toDomain(invoice)
  }

  async findBySubscriptionId(subscriptionId: string): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    })

    return invoices.map(InvoiceMapper.toDomain)
  }

  async findByUserId(userId: string): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        subscription: {
          userId,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return invoices.map(InvoiceMapper.toDomain)
  }

  async findByFilters(
    filters: InvoiceFilters,
    pagination: { page: number; limit: number }
  ): Promise<PaginatedResult<Invoice>> {
    const where: Prisma.InvoiceWhereInput = {}

    if (filters.subscriptionId) {
      where.subscriptionId = filters.subscriptionId
    }

    if (filters.userId) {
      where.subscription = {
        userId: filters.userId,
      }
    }

    if (filters.status) {
      where.status = Array.isArray(filters.status)
        ? { in: filters.status as PrismaStatus[] }
        : (filters.status as PrismaStatus)
    }

    if (filters.createdAtFrom || filters.createdAtTo) {
      where.createdAt = {}
      if (filters.createdAtFrom) {
        where.createdAt.gte = filters.createdAtFrom
      }
      if (filters.createdAtTo) {
        where.createdAt.lte = filters.createdAtTo
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip: (pagination.page - 1) * pagination.limit,
        take: pagination.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.invoice.count({ where }),
    ])

    return {
      data: data.map(InvoiceMapper.toDomain),
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    }
  }

  async save(invoice: Invoice): Promise<Invoice> {
    const data = InvoiceMapper.toCreateInput(invoice)

    const created = await this.prisma.invoice.create({
      data: {
        id: data.id,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        paymentMethod: data.paymentMethod,
        paidAt: data.paidAt,
        refundedAt: data.refundedAt,
        refundAmount: data.refundAmount,
        refundReason: data.refundReason,
        receiptUrl: data.receiptUrl,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        subscription: {
          connect: { id: data.subscriptionId },
        },
      },
    })

    return InvoiceMapper.toDomain(created)
  }

  async update(invoice: Invoice): Promise<Invoice> {
    const data = InvoiceMapper.toUpdateInput(invoice)

    const updated = await this.prisma.invoice.update({
      where: { id: invoice.id },
      data,
    })

    return InvoiceMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.invoice.delete({
      where: { id },
    })
  }

  async sumPaidAmount(filters?: { from?: Date; to?: Date }): Promise<number> {
    const where: Parameters<typeof this.prisma.invoice.aggregate>[0]['where'] = {
      status: 'PAID',
    }

    if (filters?.from || filters?.to) {
      where.paidAt = {}
      if (filters.from) {
        where.paidAt.gte = filters.from
      }
      if (filters.to) {
        where.paidAt.lte = filters.to
      }
    }

    const result = await this.prisma.invoice.aggregate({
      where,
      _sum: { amount: true },
    })

    return result._sum.amount ?? 0
  }

  async sumRefundedAmount(filters?: { from?: Date; to?: Date }): Promise<number> {
    const where: Parameters<typeof this.prisma.invoice.aggregate>[0]['where'] = {
      status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] },
    }

    if (filters?.from || filters?.to) {
      where.refundedAt = {}
      if (filters.from) {
        where.refundedAt.gte = filters.from
      }
      if (filters.to) {
        where.refundedAt.lte = filters.to
      }
    }

    const result = await this.prisma.invoice.aggregate({
      where,
      _sum: { refundAmount: true },
    })

    return result._sum.refundAmount ?? 0
  }

  async countByStatus(): Promise<Record<InvoiceStatus, number>> {
    const result = await this.prisma.invoice.groupBy({
      by: ['status'],
      _count: { status: true },
    })

    const counts: Record<InvoiceStatus, number> = {
      [InvoiceStatus.PENDING]: 0,
      [InvoiceStatus.PAID]: 0,
      [InvoiceStatus.FAILED]: 0,
      [InvoiceStatus.REFUND_REQUESTED]: 0,
      [InvoiceStatus.REFUNDED]: 0,
      [InvoiceStatus.PARTIALLY_REFUNDED]: 0,
    }

    for (const row of result) {
      counts[row.status as InvoiceStatus] = row._count.status
    }

    return counts
  }

  async getPaymentStats(fromDate?: Date, toDate?: Date): Promise<PaymentStats> {
    const now = new Date()
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

    const [
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      byStatus,
      refundedThisMonth,
    ] = await Promise.all([
      this.sumPaidAmount(fromDate || toDate ? { from: fromDate, to: toDate } : undefined),
      this.sumPaidAmount({ from: startOfThisMonth }),
      this.sumPaidAmount({ from: startOfLastMonth, to: endOfLastMonth }),
      this.countByStatus(),
      this.sumRefundedAmount({ from: startOfThisMonth }),
    ])

    const refundedAmount = await this.sumRefundedAmount(
      fromDate || toDate ? { from: fromDate, to: toDate } : undefined
    )

    return {
      totalRevenue,
      revenueThisMonth,
      revenueLastMonth,
      pendingPayments: byStatus[InvoiceStatus.PENDING],
      failedPayments: byStatus[InvoiceStatus.FAILED],
      refundedAmount,
      refundedThisMonth,
    }
  }

  async findPendingRefunds(): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: 'REFUND_REQUESTED',
      },
      orderBy: { createdAt: 'desc' },
    })

    return invoices.map(InvoiceMapper.toDomain)
  }

  async findRecentPayments(limit: number): Promise<Invoice[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: 'PAID',
      },
      orderBy: { paidAt: 'desc' },
      take: limit,
    })

    return invoices.map(InvoiceMapper.toDomain)
  }
}
