export interface BillingKeyResult {
  billingKey: string
  customerKey: string
  cardCompany: string
  cardNumber: string  // masked
  method: string
  authenticatedAt: string
}

export interface ChargeResult {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  approvedAt: string
  receipt: { url: string } | null
  failure: { code: string; message: string } | null
}

export interface CancelResult {
  paymentKey: string
  orderId: string
  status: string
  cancelAmount: number
  canceledAt: string
}

export interface PaymentDetail {
  paymentKey: string
  orderId: string
  status: string
  totalAmount: number
  method: string
  approvedAt: string | null
  receipt: { url: string } | null
  failure: { code: string; message: string } | null
}

export interface IPaymentGateway {
  issueBillingKey(authKey: string, customerKey: string): Promise<BillingKeyResult>
  chargeBilling(
    billingKey: string,
    orderId: string,
    amount: number,
    orderName: string,
    customerKey: string
  ): Promise<ChargeResult>
  cancelPayment(paymentKey: string, reason: string): Promise<CancelResult>
  getPayment(paymentKey: string): Promise<PaymentDetail>
}
