/**
 * 결제/청구서 상태
 * PENDING: 결제 대기
 * PAID: 결제 완료
 * FAILED: 결제 실패
 * REFUND_REQUESTED: 환불 요청 (관리자 승인 대기)
 * REFUNDED: 전액 환불
 * PARTIALLY_REFUNDED: 부분 환불
 */
export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUND_REQUESTED = 'REFUND_REQUESTED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

/**
 * 상태 전이 규칙
 */
export const INVOICE_STATUS_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.PENDING]: [InvoiceStatus.PAID, InvoiceStatus.FAILED],
  [InvoiceStatus.PAID]: [InvoiceStatus.REFUND_REQUESTED, InvoiceStatus.REFUNDED, InvoiceStatus.PARTIALLY_REFUNDED],
  [InvoiceStatus.FAILED]: [InvoiceStatus.PENDING],
  [InvoiceStatus.REFUND_REQUESTED]: [InvoiceStatus.PAID, InvoiceStatus.REFUNDED, InvoiceStatus.PARTIALLY_REFUNDED],
  [InvoiceStatus.REFUNDED]: [],
  [InvoiceStatus.PARTIALLY_REFUNDED]: [InvoiceStatus.REFUND_REQUESTED, InvoiceStatus.REFUNDED],
}

/**
 * 상태별 레이블
 */
const STATUS_LABELS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING]: '결제 대기',
  [InvoiceStatus.PAID]: '결제 완료',
  [InvoiceStatus.FAILED]: '결제 실패',
  [InvoiceStatus.REFUND_REQUESTED]: '환불 요청',
  [InvoiceStatus.REFUNDED]: '환불 완료',
  [InvoiceStatus.PARTIALLY_REFUNDED]: '부분 환불',
}

/**
 * 상태별 설명
 */
const STATUS_DESCRIPTIONS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING]: '결제 처리 대기 중',
  [InvoiceStatus.PAID]: '결제가 정상 완료됨',
  [InvoiceStatus.FAILED]: '결제 처리 실패',
  [InvoiceStatus.REFUND_REQUESTED]: '환불 요청 - 관리자 승인 대기',
  [InvoiceStatus.REFUNDED]: '전액 환불 완료',
  [InvoiceStatus.PARTIALLY_REFUNDED]: '일부 금액 환불됨',
}

/**
 * 상태별 UI 색상
 */
const STATUS_COLORS: Record<InvoiceStatus, string> = {
  [InvoiceStatus.PENDING]: 'yellow',
  [InvoiceStatus.PAID]: 'green',
  [InvoiceStatus.FAILED]: 'red',
  [InvoiceStatus.REFUND_REQUESTED]: 'blue',
  [InvoiceStatus.REFUNDED]: 'gray',
  [InvoiceStatus.PARTIALLY_REFUNDED]: 'orange',
}

// ========================================
// Helper Functions
// ========================================

/**
 * 상태 전이 가능 여부 확인
 */
export function canTransitionInvoice(from: InvoiceStatus, to: InvoiceStatus): boolean {
  return INVOICE_STATUS_TRANSITIONS[from].includes(to)
}

/**
 * 결제 대기 상태인지 확인
 */
export function isPendingInvoice(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.PENDING
}

/**
 * 결제 완료 상태인지 확인
 */
export function isPaidInvoice(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.PAID
}

/**
 * 결제 실패 상태인지 확인
 */
export function isFailedInvoice(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.FAILED
}

/**
 * 전액 환불 상태인지 확인
 */
export function isRefundedInvoice(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.REFUNDED
}

/**
 * 부분 환불 상태인지 확인
 */
export function isPartiallyRefunded(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.PARTIALLY_REFUNDED
}

/**
 * 환불 가능 상태인지 확인 (PAID 또는 PARTIALLY_REFUNDED)
 */
export function canBeRefunded(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.PAID || status === InvoiceStatus.PARTIALLY_REFUNDED
}

/**
 * 환불 요청 상태인지 확인
 */
export function isRefundRequested(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.REFUND_REQUESTED
}

/**
 * 환불 요청 가능 상태인지 확인 (PAID 또는 PARTIALLY_REFUNDED)
 */
export function canRequestRefund(status: InvoiceStatus): boolean {
  return status === InvoiceStatus.PAID || status === InvoiceStatus.PARTIALLY_REFUNDED
}

/**
 * 상태 레이블 반환
 */
export function getStatusLabel(status: InvoiceStatus): string {
  return STATUS_LABELS[status]
}

/**
 * 상태 설명 반환
 */
export function getStatusDescription(status: InvoiceStatus): string {
  return STATUS_DESCRIPTIONS[status]
}

/**
 * 상태 색상 반환
 */
export function getStatusColor(status: InvoiceStatus): string {
  return STATUS_COLORS[status]
}

/**
 * 모든 결제 상태 반환
 */
export function getAllInvoiceStatuses(): InvoiceStatus[] {
  return Object.values(InvoiceStatus)
}
