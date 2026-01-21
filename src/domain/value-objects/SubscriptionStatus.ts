/**
 * 구독 상태
 * TRIALING: 무료 체험 중
 * ACTIVE: 활성 구독
 * PAST_DUE: 결제 연체
 * CANCELLED: 취소됨
 * EXPIRED: 만료됨
 */
export enum SubscriptionStatus {
  TRIALING = 'TRIALING',
  ACTIVE = 'ACTIVE',
  PAST_DUE = 'PAST_DUE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

/**
 * 상태 전이 규칙
 */
export const SUBSCRIPTION_STATUS_TRANSITIONS: Record<SubscriptionStatus, SubscriptionStatus[]> = {
  [SubscriptionStatus.TRIALING]: [SubscriptionStatus.ACTIVE, SubscriptionStatus.CANCELLED],
  [SubscriptionStatus.ACTIVE]: [SubscriptionStatus.PAST_DUE, SubscriptionStatus.CANCELLED],
  [SubscriptionStatus.PAST_DUE]: [
    SubscriptionStatus.ACTIVE,
    SubscriptionStatus.CANCELLED,
    SubscriptionStatus.EXPIRED,
  ],
  [SubscriptionStatus.CANCELLED]: [],
  [SubscriptionStatus.EXPIRED]: [],
}

/**
 * 상태별 레이블
 */
const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.TRIALING]: '체험 중',
  [SubscriptionStatus.ACTIVE]: '활성',
  [SubscriptionStatus.PAST_DUE]: '결제 연체',
  [SubscriptionStatus.CANCELLED]: '취소됨',
  [SubscriptionStatus.EXPIRED]: '만료됨',
}

/**
 * 상태별 설명
 */
const STATUS_DESCRIPTIONS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.TRIALING]: '무료 체험 기간 중',
  [SubscriptionStatus.ACTIVE]: '정상 구독 중',
  [SubscriptionStatus.PAST_DUE]: '결제 실패로 인한 연체 상태',
  [SubscriptionStatus.CANCELLED]: '사용자에 의해 취소됨',
  [SubscriptionStatus.EXPIRED]: '구독 기간 만료',
}

// ========================================
// Helper Functions
// ========================================

/**
 * 상태 전이 가능 여부 확인
 */
export function canTransitionSubscription(
  from: SubscriptionStatus,
  to: SubscriptionStatus
): boolean {
  return SUBSCRIPTION_STATUS_TRANSITIONS[from].includes(to)
}

/**
 * 활성 구독인지 확인
 */
export function isActiveSubscription(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.ACTIVE
}

/**
 * 취소된 구독인지 확인
 */
export function isCancelledSubscription(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.CANCELLED
}

/**
 * 체험 중인지 확인
 */
export function isTrialingSubscription(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.TRIALING
}

/**
 * 결제 연체 상태인지 확인
 */
export function isPastDue(status: SubscriptionStatus): boolean {
  return status === SubscriptionStatus.PAST_DUE
}

/**
 * 상태 레이블 반환
 */
export function getStatusLabel(status: SubscriptionStatus): string {
  return STATUS_LABELS[status]
}

/**
 * 상태 설명 반환
 */
export function getStatusDescription(status: SubscriptionStatus): string {
  return STATUS_DESCRIPTIONS[status]
}

/**
 * 모든 구독 상태 반환
 */
export function getAllSubscriptionStatuses(): SubscriptionStatus[] {
  return Object.values(SubscriptionStatus)
}
