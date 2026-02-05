import type { BillingKeyResult, ChargeResult, CancelResult, PaymentDetail } from '@infrastructure/payment/TossPaymentsClient'

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
