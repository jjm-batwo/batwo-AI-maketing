import { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import { PaymentStatsDTO } from '@application/dto/admin/PaymentDTO'

export interface GetPaymentStatsInput {
  adminUserId: string
  fromDate?: Date
  toDate?: Date
}

export class GetPaymentStatsUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(input: GetPaymentStatsInput): Promise<PaymentStatsDTO> {
    const stats = await this.invoiceRepository.getPaymentStats(input.fromDate, input.toDate)

    const changePercent =
      stats.revenueLastMonth > 0
        ? ((stats.revenueThisMonth - stats.revenueLastMonth) / stats.revenueLastMonth) * 100
        : stats.revenueThisMonth > 0
          ? 100
          : 0

    return {
      totalRevenue: stats.totalRevenue,
      revenueThisMonth: stats.revenueThisMonth,
      revenueLastMonth: stats.revenueLastMonth,
      revenueChangePercent: Math.round(changePercent * 10) / 10,
      pendingPayments: stats.pendingPayments,
      failedPayments: stats.failedPayments,
      refundedAmount: stats.refundedAmount,
      refundedThisMonth: stats.refundedThisMonth,
      currency: 'KRW',
    }
  }
}
