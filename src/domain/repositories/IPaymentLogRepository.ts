export interface PaymentLogData {
  id?: string
  userId: string
  subscriptionId?: string
  invoiceId?: string
  paymentKey?: string
  orderId: string
  amount: number
  status: string
  method?: string
  failReason?: string
  receiptUrl?: string
  rawResponse?: Record<string, unknown>
  createdAt?: Date
  updatedAt?: Date
}

export interface IPaymentLogRepository {
  save(log: PaymentLogData): Promise<PaymentLogData>
  findByOrderId(orderId: string): Promise<PaymentLogData | null>
  findByPaymentKey(paymentKey: string): Promise<PaymentLogData | null>
  findBySubscriptionId(subscriptionId: string): Promise<PaymentLogData[]>
  findByUserId(userId: string, limit?: number): Promise<PaymentLogData[]>
  update(id: string, data: Partial<PaymentLogData>): Promise<PaymentLogData>
}
