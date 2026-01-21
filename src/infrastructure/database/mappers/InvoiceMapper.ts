import { Invoice as PrismaInvoice, InvoiceStatus as PrismaStatus } from '@/generated/prisma'
import { Invoice } from '@domain/entities/Invoice'
import { InvoiceStatus } from '@domain/value-objects/InvoiceStatus'
import { Money, Currency } from '@domain/value-objects/Money'

export class InvoiceMapper {
  static toDomain(prisma: PrismaInvoice): Invoice {
    return Invoice.restore({
      id: prisma.id,
      subscriptionId: prisma.subscriptionId,
      amount: Money.create(prisma.amount, prisma.currency as Currency),
      status: prisma.status as InvoiceStatus,
      paymentMethod: prisma.paymentMethod ?? undefined,
      paidAt: prisma.paidAt ?? undefined,
      refundedAt: prisma.refundedAt ?? undefined,
      refundAmount: prisma.refundAmount
        ? Money.create(prisma.refundAmount, prisma.currency as Currency)
        : undefined,
      refundReason: prisma.refundReason ?? undefined,
      receiptUrl: prisma.receiptUrl ?? undefined,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    })
  }

  static toCreateInput(invoice: Invoice) {
    return {
      id: invoice.id,
      subscriptionId: invoice.subscriptionId,
      amount: invoice.amount.amount,
      currency: invoice.amount.currency,
      status: invoice.status as PrismaStatus,
      paymentMethod: invoice.paymentMethod ?? null,
      paidAt: invoice.paidAt ?? null,
      refundedAt: invoice.refundedAt ?? null,
      refundAmount: invoice.refundAmount?.amount ?? null,
      refundReason: invoice.refundReason ?? null,
      receiptUrl: invoice.receiptUrl ?? null,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    }
  }

  static toUpdateInput(invoice: Invoice) {
    return {
      status: invoice.status as PrismaStatus,
      paymentMethod: invoice.paymentMethod ?? null,
      paidAt: invoice.paidAt ?? null,
      refundedAt: invoice.refundedAt ?? null,
      refundAmount: invoice.refundAmount?.amount ?? null,
      refundReason: invoice.refundReason ?? null,
      receiptUrl: invoice.receiptUrl ?? null,
      updatedAt: invoice.updatedAt,
    }
  }
}
