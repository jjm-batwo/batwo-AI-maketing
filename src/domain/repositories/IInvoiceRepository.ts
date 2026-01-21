import { Invoice } from '../entities/Invoice'
import { InvoiceStatus } from '../value-objects/InvoiceStatus'
import { PaginationOptions, PaginatedResult } from './ICampaignRepository'

export interface InvoiceFilters {
  subscriptionId?: string
  userId?: string
  status?: InvoiceStatus | InvoiceStatus[]
  createdAtFrom?: Date
  createdAtTo?: Date
  paidAtFrom?: Date
  paidAtTo?: Date
}

export interface PaymentStats {
  totalRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  pendingPayments: number
  failedPayments: number
  refundedAmount: number
  refundedThisMonth: number
}

export interface IInvoiceRepository {
  save(invoice: Invoice): Promise<Invoice>
  findById(id: string): Promise<Invoice | null>
  findBySubscriptionId(subscriptionId: string): Promise<Invoice[]>
  findByUserId(userId: string): Promise<Invoice[]>
  findByFilters(
    filters: InvoiceFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Invoice>>
  update(invoice: Invoice): Promise<Invoice>
  delete(id: string): Promise<void>
  getPaymentStats(fromDate?: Date, toDate?: Date): Promise<PaymentStats>
  findPendingRefunds(): Promise<Invoice[]>
  findRecentPayments(limit: number): Promise<Invoice[]>
}
