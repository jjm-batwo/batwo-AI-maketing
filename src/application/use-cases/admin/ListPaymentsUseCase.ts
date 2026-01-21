import { IInvoiceRepository } from '@domain/repositories/IInvoiceRepository'
import { InvoiceStatus } from '@domain/value-objects/InvoiceStatus'
import { PaymentListDTO, PaymentDTO } from '@application/dto/admin/PaymentDTO'

export interface ListPaymentsInput {
  adminUserId: string
  page?: number
  limit?: number
  status?: InvoiceStatus | InvoiceStatus[]
  userId?: string
  fromDate?: Date
  toDate?: Date
}

export class ListPaymentsUseCase {
  constructor(private readonly invoiceRepository: IInvoiceRepository) {}

  async execute(input: ListPaymentsInput): Promise<PaymentListDTO> {
    const page = input.page || 1
    const limit = input.limit || 20

    const result = await this.invoiceRepository.findByFilters(
      {
        userId: input.userId,
        status: input.status,
        createdAtFrom: input.fromDate,
        createdAtTo: input.toDate,
      },
      { page, limit }
    )

    const payments: PaymentDTO[] = result.data.map((invoice) => ({
      id: invoice.id,
      userId: '', // Will be populated by infrastructure layer with joins
      userEmail: '', // Will be populated by infrastructure layer
      userName: null, // Will be populated by infrastructure layer
      subscriptionId: invoice.subscriptionId,
      amount: invoice.amount.amount,
      currency: invoice.amount.currency,
      status: invoice.status,
      paymentMethod: invoice.paymentMethod ?? null,
      paidAt: invoice.paidAt ?? null,
      refundedAt: invoice.refundedAt ?? null,
      refundAmount: invoice.refundAmount?.amount ?? null,
      refundReason: invoice.refundReason ?? null,
      receiptUrl: invoice.receiptUrl ?? null,
      createdAt: invoice.createdAt,
    }))

    return {
      data: payments,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    }
  }
}
