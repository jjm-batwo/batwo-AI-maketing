import type { IPaymentLogRepository } from '@domain/repositories/IPaymentLogRepository'
import type { PaymentHistoryItemDTO } from '@application/dto/payment/PaymentDTOs'

export class GetPaymentHistoryUseCase {
  constructor(
    private readonly paymentLogRepo: IPaymentLogRepository
  ) {}

  async execute(userId: string, limit = 50): Promise<PaymentHistoryItemDTO[]> {
    const logs = await this.paymentLogRepo.findByUserId(userId, limit)
    return logs.map((log) => ({
      id: log.id!,
      orderId: log.orderId,
      paymentKey: log.paymentKey,
      amount: log.amount,
      status: log.status,
      method: log.method,
      failReason: log.failReason,
      receiptUrl: log.receiptUrl,
      createdAt: log.createdAt!,
    }))
  }
}
