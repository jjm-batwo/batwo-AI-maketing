import { Money, Currency } from '../value-objects/Money'
import { InvoiceStatus, canTransitionInvoice } from '../value-objects/InvoiceStatus'
import { InvalidInvoiceError } from '../errors/InvalidInvoiceError'

export interface CreateInvoiceProps {
  subscriptionId: string
  amount: Money
  paymentMethod?: string
}

export interface InvoiceProps extends CreateInvoiceProps {
  id: string
  status: InvoiceStatus
  paidAt?: Date
  refundedAt?: Date
  refundAmount?: Money
  refundReason?: string
  receiptUrl?: string
  createdAt: Date
  updatedAt: Date
}

export class Invoice {
  private constructor(
    private readonly _id: string,
    private readonly _subscriptionId: string,
    private readonly _amount: Money,
    private readonly _status: InvoiceStatus,
    private readonly _paymentMethod: string | undefined,
    private readonly _paidAt: Date | undefined,
    private readonly _refundedAt: Date | undefined,
    private readonly _refundAmount: Money | undefined,
    private readonly _refundReason: string | undefined,
    private readonly _receiptUrl: string | undefined,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  static create(props: CreateInvoiceProps): Invoice {
    Invoice.validateAmount(props.amount)

    const now = new Date()

    return new Invoice(
      crypto.randomUUID(),
      props.subscriptionId,
      props.amount,
      InvoiceStatus.PENDING,
      props.paymentMethod,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      now,
      now
    )
  }

  static restore(props: InvoiceProps): Invoice {
    return new Invoice(
      props.id,
      props.subscriptionId,
      props.amount,
      props.status,
      props.paymentMethod,
      props.paidAt,
      props.refundedAt,
      props.refundAmount,
      props.refundReason,
      props.receiptUrl,
      props.createdAt,
      props.updatedAt
    )
  }

  private static validateAmount(amount: Money): void {
    if (amount.isZero() || amount.amount <= 0) {
      throw InvalidInvoiceError.invalidAmount()
    }
  }

  // Getters
  get id(): string {
    return this._id
  }

  get subscriptionId(): string {
    return this._subscriptionId
  }

  get amount(): Money {
    return this._amount
  }

  get status(): InvoiceStatus {
    return this._status
  }

  get paymentMethod(): string | undefined {
    return this._paymentMethod
  }

  get paidAt(): Date | undefined {
    return this._paidAt ? new Date(this._paidAt) : undefined
  }

  get refundedAt(): Date | undefined {
    return this._refundedAt ? new Date(this._refundedAt) : undefined
  }

  get refundAmount(): Money | undefined {
    return this._refundAmount
  }

  get refundReason(): string | undefined {
    return this._refundReason
  }

  get receiptUrl(): string | undefined {
    return this._receiptUrl
  }

  get createdAt(): Date {
    return new Date(this._createdAt)
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt)
  }

  // State checks
  isPending(): boolean {
    return this._status === InvoiceStatus.PENDING
  }

  isPaid(): boolean {
    return this._status === InvoiceStatus.PAID
  }

  isFailed(): boolean {
    return this._status === InvoiceStatus.FAILED
  }

  isRefunded(): boolean {
    return this._status === InvoiceStatus.REFUNDED
  }

  isPartiallyRefunded(): boolean {
    return this._status === InvoiceStatus.PARTIALLY_REFUNDED
  }

  isRefundRequested(): boolean {
    return this._status === InvoiceStatus.REFUND_REQUESTED
  }

  /**
   * 환불 가능 여부 확인 (결제 완료 또는 부분 환불 상태)
   */
  canBeRefunded(): boolean {
    return this._status === InvoiceStatus.PAID || this._status === InvoiceStatus.PARTIALLY_REFUNDED
  }

  /**
   * 환불 요청 가능 여부 확인 (결제 완료 또는 부분 환불 상태)
   */
  canRequestRefund(): boolean {
    return this._status === InvoiceStatus.PAID || this._status === InvoiceStatus.PARTIALLY_REFUNDED
  }

  /**
   * 남은 환불 가능 금액
   */
  remainingRefundableAmount(): Money {
    // PAID, PARTIALLY_REFUNDED, REFUND_REQUESTED 상태에서만 환불 가능 금액 계산
    if (!this.canBeRefunded() && this._status !== InvoiceStatus.REFUND_REQUESTED) {
      return Money.create(0, this._amount.currency)
    }

    if (this._refundAmount) {
      return this._amount.subtract(this._refundAmount)
    }

    return this._amount
  }

  // Commands
  /**
   * 결제 완료 처리
   */
  markPaid(receiptUrl?: string): Invoice {
    if (!canTransitionInvoice(this._status, InvoiceStatus.PAID)) {
      throw InvalidInvoiceError.invalidStatusTransition(this._status, InvoiceStatus.PAID)
    }

    return new Invoice(
      this._id,
      this._subscriptionId,
      this._amount,
      InvoiceStatus.PAID,
      this._paymentMethod,
      new Date(),
      this._refundedAt,
      this._refundAmount,
      this._refundReason,
      receiptUrl,
      this._createdAt,
      new Date()
    )
  }

  /**
   * 결제 실패 처리
   */
  markFailed(): Invoice {
    if (!canTransitionInvoice(this._status, InvoiceStatus.FAILED)) {
      throw InvalidInvoiceError.invalidStatusTransition(this._status, InvoiceStatus.FAILED)
    }

    return new Invoice(
      this._id,
      this._subscriptionId,
      this._amount,
      InvoiceStatus.FAILED,
      this._paymentMethod,
      this._paidAt,
      this._refundedAt,
      this._refundAmount,
      this._refundReason,
      this._receiptUrl,
      this._createdAt,
      new Date()
    )
  }

  /**
   * 결제 재시도 (FAILED → PENDING)
   */
  retry(): Invoice {
    if (!canTransitionInvoice(this._status, InvoiceStatus.PENDING)) {
      throw InvalidInvoiceError.invalidStatusTransition(this._status, InvoiceStatus.PENDING)
    }

    return new Invoice(
      this._id,
      this._subscriptionId,
      this._amount,
      InvoiceStatus.PENDING,
      this._paymentMethod,
      this._paidAt,
      this._refundedAt,
      this._refundAmount,
      this._refundReason,
      this._receiptUrl,
      this._createdAt,
      new Date()
    )
  }

  /**
   * 환불 요청 (사용자가 환불 요청)
   * PAID/PARTIALLY_REFUNDED → REFUND_REQUESTED
   */
  requestRefund(reason: string): Invoice {
    if (!this.canBeRefunded()) {
      if (this._status === InvoiceStatus.REFUNDED) {
        throw InvalidInvoiceError.alreadyRefunded()
      }
      if (this._status === InvoiceStatus.REFUND_REQUESTED) {
        throw new Error('Refund already requested')
      }
      throw InvalidInvoiceError.cannotRefundUnpaidInvoice()
    }

    if (!reason || reason.trim().length === 0) {
      throw InvalidInvoiceError.refundReasonRequired()
    }

    return new Invoice(
      this._id,
      this._subscriptionId,
      this._amount,
      InvoiceStatus.REFUND_REQUESTED,
      this._paymentMethod,
      this._paidAt,
      this._refundedAt,
      this._refundAmount,
      reason.trim(),
      this._receiptUrl,
      this._createdAt,
      new Date()
    )
  }

  /**
   * 환불 승인 처리 (관리자가 환불 승인)
   * REFUND_REQUESTED → REFUNDED/PARTIALLY_REFUNDED
   */
  processRefund(refundAmount: number): Invoice {
    if (this._status !== InvoiceStatus.REFUND_REQUESTED) {
      throw new Error('Invoice is not in refund requested status')
    }

    const refundMoney = Money.create(refundAmount, this._amount.currency)

    if (refundMoney.isZero() || refundMoney.amount <= 0) {
      throw InvalidInvoiceError.invalidRefundAmount()
    }

    if (refundMoney.isGreaterThan(this._amount)) {
      throw InvalidInvoiceError.refundExceedsAmount()
    }

    const remaining = this.remainingRefundableAmount()
    if (refundMoney.isGreaterThan(remaining)) {
      throw InvalidInvoiceError.refundExceedsRemaining()
    }

    const totalRefundAmount = this._refundAmount
      ? this._refundAmount.add(refundMoney)
      : refundMoney

    const isFullRefund = totalRefundAmount.equals(this._amount)
    const newStatus = isFullRefund ? InvoiceStatus.REFUNDED : InvoiceStatus.PARTIALLY_REFUNDED

    return new Invoice(
      this._id,
      this._subscriptionId,
      this._amount,
      newStatus,
      this._paymentMethod,
      this._paidAt,
      new Date(),
      totalRefundAmount,
      this._refundReason,
      this._receiptUrl,
      this._createdAt,
      new Date()
    )
  }

  /**
   * 환불 거절 (관리자가 환불 거절)
   * REFUND_REQUESTED → PAID (원래 상태로 복구)
   */
  rejectRefund(rejectionReason?: string): Invoice {
    if (this._status !== InvoiceStatus.REFUND_REQUESTED) {
      throw new Error('Invoice is not in refund requested status')
    }

    // 기존 부분 환불이 있었으면 PARTIALLY_REFUNDED로, 없으면 PAID로 복구
    const restoredStatus = this._refundAmount
      ? InvoiceStatus.PARTIALLY_REFUNDED
      : InvoiceStatus.PAID

    return new Invoice(
      this._id,
      this._subscriptionId,
      this._amount,
      restoredStatus,
      this._paymentMethod,
      this._paidAt,
      this._refundedAt,
      this._refundAmount,
      rejectionReason ? `거절: ${rejectionReason}` : this._refundReason,
      this._receiptUrl,
      this._createdAt,
      new Date()
    )
  }

  /**
   * 환불 처리 (직접 환불 - 관리자 승인 없이)
   */
  refund(refundAmount: Money, reason: string): Invoice {
    // 환불 가능 상태 확인
    if (!this.canBeRefunded()) {
      if (this._status === InvoiceStatus.REFUNDED) {
        throw InvalidInvoiceError.alreadyRefunded()
      }
      throw InvalidInvoiceError.cannotRefundUnpaidInvoice()
    }

    // 환불 금액 검증
    if (refundAmount.isZero() || refundAmount.amount <= 0) {
      throw InvalidInvoiceError.invalidRefundAmount()
    }

    // 환불 사유 검증
    if (!reason || reason.trim().length === 0) {
      throw InvalidInvoiceError.refundReasonRequired()
    }

    // 환불 금액이 원금을 초과하는지 확인
    if (refundAmount.isGreaterThan(this._amount)) {
      throw InvalidInvoiceError.refundExceedsAmount()
    }

    // 남은 환불 가능 금액 확인
    const remaining = this.remainingRefundableAmount()
    if (refundAmount.isGreaterThan(remaining)) {
      throw InvalidInvoiceError.refundExceedsRemaining()
    }

    // 기존 환불 금액 + 새 환불 금액
    const totalRefundAmount = this._refundAmount
      ? this._refundAmount.add(refundAmount)
      : refundAmount

    // 전액 환불인지 부분 환불인지 결정
    const isFullRefund = totalRefundAmount.equals(this._amount)
    const newStatus = isFullRefund ? InvoiceStatus.REFUNDED : InvoiceStatus.PARTIALLY_REFUNDED

    return new Invoice(
      this._id,
      this._subscriptionId,
      this._amount,
      newStatus,
      this._paymentMethod,
      this._paidAt,
      new Date(),
      totalRefundAmount,
      reason,
      this._receiptUrl,
      this._createdAt,
      new Date()
    )
  }

  toJSON(): {
    id: string
    subscriptionId: string
    amount: { amount: number; currency: Currency }
    status: InvoiceStatus
    paymentMethod?: string
    paidAt?: Date
    refundedAt?: Date
    refundAmount?: { amount: number; currency: Currency }
    refundReason?: string
    receiptUrl?: string
    createdAt: Date
    updatedAt: Date
  } {
    return {
      id: this._id,
      subscriptionId: this._subscriptionId,
      amount: this._amount.toJSON(),
      status: this._status,
      paymentMethod: this._paymentMethod,
      paidAt: this._paidAt,
      refundedAt: this._refundedAt,
      refundAmount: this._refundAmount?.toJSON(),
      refundReason: this._refundReason,
      receiptUrl: this._receiptUrl,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
