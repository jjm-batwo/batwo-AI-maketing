import { InvoiceStatus } from '@domain/value-objects/InvoiceStatus'
import { Invoice } from '@domain/entities/Invoice'

export interface PaymentDTO {
  id: string
  userId: string
  userEmail: string
  userName: string | null
  subscriptionId: string
  amount: number
  currency: string
  status: InvoiceStatus
  paymentMethod: string | null
  paidAt: Date | null
  refundedAt: Date | null
  refundAmount: number | null
  refundReason: string | null
  receiptUrl: string | null
  createdAt: Date
}

export interface PaymentListDTO {
  data: PaymentDTO[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaymentStatsDTO {
  totalRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  revenueChangePercent: number
  pendingPayments: number
  failedPayments: number
  refundedAmount: number
  refundedThisMonth: number
  currency: string
}

export function toPaymentDTO(
  invoice: Invoice,
  userEmail: string,
  userName: string | null,
  currency: string = 'KRW'
): PaymentDTO {
  return {
    id: invoice.id,
    userId: '', // To be filled by caller
    userEmail,
    userName,
    subscriptionId: invoice.subscriptionId,
    amount: invoice.amount.amount,
    currency,
    status: invoice.status,
    paymentMethod: invoice.paymentMethod ?? null,
    paidAt: invoice.paidAt ?? null,
    refundedAt: invoice.refundedAt ?? null,
    refundAmount: invoice.refundAmount?.amount ?? null,
    refundReason: invoice.refundReason ?? null,
    receiptUrl: invoice.receiptUrl ?? null,
    createdAt: invoice.createdAt,
  }
}
