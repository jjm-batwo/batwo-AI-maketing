/**
 * 토스페이먼츠 V2 API 클라이언트
 * 빌링(자동결제) 연동 전용
 */

import type { BillingKeyResult, ChargeResult, CancelResult, PaymentDetail } from '@application/ports/IPaymentGateway'
export type { BillingKeyResult, ChargeResult, CancelResult, PaymentDetail }

export class TossPaymentsClient {
  private readonly baseUrl = 'https://api.tosspayments.com/v1'
  private readonly secretKey: string

  constructor(secretKey?: string) {
    this.secretKey = secretKey || process.env.TOSS_SECRET_KEY || ''
    if (!this.secretKey) {
      throw new Error('TOSS_SECRET_KEY is required')
    }
  }

  private getAuthHeader(): string {
    const encoded = Buffer.from(`${this.secretKey}:`).toString('base64')
    return `Basic ${encoded}`
  }

  private async request<T>(
    method: string,
    path: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      Authorization: this.getAuthHeader(),
      'Content-Type': 'application/json',
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    })

    const data = await response.json()

    if (!response.ok) {
      const errorCode = data.code || 'UNKNOWN_ERROR'
      const errorMessage = data.message || '알 수 없는 오류가 발생했습니다'
      throw new TossPaymentApiError(errorCode, errorMessage, response.status)
    }

    return data as T
  }

  /**
   * 빌링키 발급 (authKey → billingKey)
   */
  async issueBillingKey(authKey: string, customerKey: string): Promise<BillingKeyResult> {
    return this.request<BillingKeyResult>('POST', '/billing/authorizations/issue', {
      authKey,
      customerKey,
    })
  }

  /**
   * 빌링 과금 (billingKey로 결제)
   */
  async chargeBilling(
    billingKey: string,
    orderId: string,
    amount: number,
    orderName: string,
    customerKey: string
  ): Promise<ChargeResult> {
    return this.request<ChargeResult>('POST', `/billing/${billingKey}`, {
      customerKey,
      orderId,
      amount,
      orderName,
    })
  }

  /**
   * 결제 취소
   */
  async cancelPayment(paymentKey: string, cancelReason: string): Promise<CancelResult> {
    return this.request<CancelResult>('POST', `/payments/${paymentKey}/cancel`, {
      cancelReason,
    })
  }

  /**
   * 결제 조회
   */
  async getPayment(paymentKey: string): Promise<PaymentDetail> {
    return this.request<PaymentDetail>('GET', `/payments/${paymentKey}`)
  }
}

/**
 * 토스 API 에러
 */
export class TossPaymentApiError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly statusCode: number
  ) {
    super(message)
    this.name = 'TossPaymentApiError'
  }
}
