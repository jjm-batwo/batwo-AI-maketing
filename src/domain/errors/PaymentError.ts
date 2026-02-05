import { DomainError } from './DomainError'

export class PaymentError extends DomainError {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
  }

  static billingAuthFailed(reason?: string): PaymentError {
    return new PaymentError(
      'BILLING_AUTH_FAILED',
      `빌링 인증에 실패했습니다${reason ? `: ${reason}` : ''}`
    )
  }

  static billingKeyIssueFailed(reason?: string): PaymentError {
    return new PaymentError(
      'BILLING_KEY_ISSUE_FAILED',
      `빌링키 발급에 실패했습니다${reason ? `: ${reason}` : ''}`
    )
  }

  static chargeFailed(reason?: string): PaymentError {
    return new PaymentError(
      'CHARGE_FAILED',
      `결제에 실패했습니다${reason ? `: ${reason}` : ''}`
    )
  }

  static cancelFailed(reason?: string): PaymentError {
    return new PaymentError(
      'CANCEL_FAILED',
      `결제 취소에 실패했습니다${reason ? `: ${reason}` : ''}`
    )
  }

  static billingKeyNotFound(): PaymentError {
    return new PaymentError(
      'BILLING_KEY_NOT_FOUND',
      '등록된 결제 수단을 찾을 수 없습니다'
    )
  }

  static billingKeyInactive(): PaymentError {
    return new PaymentError(
      'BILLING_KEY_INACTIVE',
      '비활성화된 결제 수단입니다'
    )
  }

  static subscriptionAlreadyActive(): PaymentError {
    return new PaymentError(
      'SUBSCRIPTION_ALREADY_ACTIVE',
      '이미 활성 구독이 있습니다'
    )
  }

  static invalidPlan(): PaymentError {
    return new PaymentError(
      'INVALID_PLAN',
      '유효하지 않은 플랜입니다'
    )
  }

  static samePlanChange(): PaymentError {
    return new PaymentError(
      'SAME_PLAN_CHANGE',
      '동일한 플랜으로 변경할 수 없습니다'
    )
  }

  static webhookSignatureInvalid(): PaymentError {
    return new PaymentError(
      'WEBHOOK_SIGNATURE_INVALID',
      '웹훅 서명이 유효하지 않습니다'
    )
  }

  static decryptionFailed(): PaymentError {
    return new PaymentError(
      'DECRYPTION_FAILED',
      '빌링키 복호화에 실패했습니다'
    )
  }
}
