import { SubscriptionPlan } from '../value-objects/SubscriptionPlan'
import { SubscriptionStatus, canTransitionSubscription } from '../value-objects/SubscriptionStatus'
import { InvalidSubscriptionError } from '../errors/InvalidSubscriptionError'

export interface CreateSubscriptionProps {
  userId: string
  plan: SubscriptionPlan
  currentPeriodStart: Date
  currentPeriodEnd: Date
  status?: SubscriptionStatus
  trialEndDate?: Date | null
  trialStartedAt?: Date | null
}

export interface SubscriptionProps extends CreateSubscriptionProps {
  id: string
  status: SubscriptionStatus
  cancelledAt?: Date
  createdAt: Date
  updatedAt: Date
}

export class Subscription {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _plan: SubscriptionPlan,
    private readonly _status: SubscriptionStatus,
    private readonly _currentPeriodStart: Date,
    private readonly _currentPeriodEnd: Date,
    private readonly _cancelledAt: Date | undefined,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
    private readonly _trialEndDate: Date | null = null,
    private readonly _trialStartedAt: Date | null = null
  ) {}

  static startTrial(params: { userId: string }): Subscription {
    const now = new Date()
    const trialEnd = new Date(now)
    trialEnd.setDate(trialEnd.getDate() + 14)

    return new Subscription(
      crypto.randomUUID(),
      params.userId,
      SubscriptionPlan.PRO,
      SubscriptionStatus.TRIALING,
      now,
      trialEnd,
      undefined,
      now,
      now,
      trialEnd,
      now
    )
  }

  static create(props: CreateSubscriptionProps): Subscription {
    Subscription.validatePeriod(props.currentPeriodStart, props.currentPeriodEnd)

    const now = new Date()
    const status = props.status ?? SubscriptionStatus.ACTIVE

    return new Subscription(
      crypto.randomUUID(),
      props.userId,
      props.plan,
      status,
      props.currentPeriodStart,
      props.currentPeriodEnd,
      undefined,
      now,
      now,
      props.trialEndDate ?? null,
      props.trialStartedAt ?? null
    )
  }

  static restore(props: SubscriptionProps): Subscription {
    return new Subscription(
      props.id,
      props.userId,
      props.plan,
      props.status,
      props.currentPeriodStart,
      props.currentPeriodEnd,
      props.cancelledAt,
      props.createdAt,
      props.updatedAt,
      props.trialEndDate ?? null,
      props.trialStartedAt ?? null
    )
  }

  private static validatePeriod(start: Date, end: Date): void {
    if (end <= start) {
      throw InvalidSubscriptionError.invalidPeriod()
    }
  }

  // Getters
  get id(): string {
    return this._id
  }

  get userId(): string {
    return this._userId
  }

  get plan(): SubscriptionPlan {
    return this._plan
  }

  get status(): SubscriptionStatus {
    return this._status
  }

  get currentPeriodStart(): Date {
    return new Date(this._currentPeriodStart)
  }

  get currentPeriodEnd(): Date {
    return new Date(this._currentPeriodEnd)
  }

  get cancelledAt(): Date | undefined {
    return this._cancelledAt ? new Date(this._cancelledAt) : undefined
  }

  get createdAt(): Date {
    return new Date(this._createdAt)
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt)
  }

  get trialEndDate(): Date | null {
    return this._trialEndDate ? new Date(this._trialEndDate) : null
  }

  get trialStartedAt(): Date | null {
    return this._trialStartedAt ? new Date(this._trialStartedAt) : null
  }

  // State checks
  isActive(): boolean {
    return this._status === SubscriptionStatus.ACTIVE
  }

  isCancelled(): boolean {
    return this._status === SubscriptionStatus.CANCELLED
  }

  isTrialing(): boolean {
    return this._status === SubscriptionStatus.TRIALING
  }

  isPastDue(): boolean {
    return this._status === SubscriptionStatus.PAST_DUE
  }

  isExpired(): boolean {
    return this._status === SubscriptionStatus.EXPIRED
  }

  /**
   * 구독이 서비스 접근 권한을 가지고 있는지 확인 (활성 또는 체험 중)
   */
  hasAccess(): boolean {
    return this.isActive() || this.isTrialing()
  }

  /**
   * 만료까지 남은 일수 반환
   */
  daysUntilExpiry(): number {
    const now = new Date()
    const diff = this._currentPeriodEnd.getTime() - now.getTime()
    if (diff <= 0) return 0
    return Math.ceil(diff / (1000 * 60 * 60 * 24))
  }

  trialDaysRemaining(): number {
    if (!this._trialEndDate) return 0
    const now = new Date()
    const diff = this._trialEndDate.getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  isTrialExpired(): boolean {
    if (!this._trialEndDate) return false
    return new Date() > this._trialEndDate
  }

  hasUsedTrial(): boolean {
    return this._trialStartedAt !== null && this._trialStartedAt !== undefined
  }

  // Commands
  /**
   * 구독 취소
   */
  cancel(): Subscription {
    if (this._status === SubscriptionStatus.CANCELLED) {
      throw InvalidSubscriptionError.alreadyCancelled()
    }

    if (this._status === SubscriptionStatus.EXPIRED) {
      throw InvalidSubscriptionError.alreadyExpired()
    }

    if (!canTransitionSubscription(this._status, SubscriptionStatus.CANCELLED)) {
      throw InvalidSubscriptionError.invalidStatusTransition(
        this._status,
        SubscriptionStatus.CANCELLED
      )
    }

    return new Subscription(
      this._id,
      this._userId,
      this._plan,
      SubscriptionStatus.CANCELLED,
      this._currentPeriodStart,
      this._currentPeriodEnd,
      new Date(),
      this._createdAt,
      new Date(),
      this._trialEndDate,
      this._trialStartedAt
    )
  }

  /**
   * 결제 연체로 표시
   */
  markPastDue(): Subscription {
    if (!canTransitionSubscription(this._status, SubscriptionStatus.PAST_DUE)) {
      throw InvalidSubscriptionError.invalidStatusTransition(
        this._status,
        SubscriptionStatus.PAST_DUE
      )
    }

    return new Subscription(
      this._id,
      this._userId,
      this._plan,
      SubscriptionStatus.PAST_DUE,
      this._currentPeriodStart,
      this._currentPeriodEnd,
      this._cancelledAt,
      this._createdAt,
      new Date(),
      this._trialEndDate,
      this._trialStartedAt
    )
  }

  /**
   * 연체 구독 재활성화
   */
  reactivate(): Subscription {
    if (!canTransitionSubscription(this._status, SubscriptionStatus.ACTIVE)) {
      throw InvalidSubscriptionError.invalidStatusTransition(
        this._status,
        SubscriptionStatus.ACTIVE
      )
    }

    return new Subscription(
      this._id,
      this._userId,
      this._plan,
      SubscriptionStatus.ACTIVE,
      this._currentPeriodStart,
      this._currentPeriodEnd,
      this._cancelledAt,
      this._createdAt,
      new Date(),
      this._trialEndDate,
      this._trialStartedAt
    )
  }

  /**
   * 체험판 구독을 활성화
   */
  activate(): Subscription {
    if (this._status !== SubscriptionStatus.TRIALING) {
      throw InvalidSubscriptionError.invalidStatusTransition(
        this._status,
        SubscriptionStatus.ACTIVE
      )
    }

    return new Subscription(
      this._id,
      this._userId,
      this._plan,
      SubscriptionStatus.ACTIVE,
      this._currentPeriodStart,
      this._currentPeriodEnd,
      this._cancelledAt,
      this._createdAt,
      new Date(),
      this._trialEndDate,
      this._trialStartedAt
    )
  }

  /**
   * 구독 갱신 (새 기간 설정)
   */
  renew(newPeriodEnd: Date): Subscription {
    if (
      this._status === SubscriptionStatus.CANCELLED ||
      this._status === SubscriptionStatus.EXPIRED
    ) {
      throw InvalidSubscriptionError.cannotRenewInactiveSubscription()
    }

    const newPeriodStart = this._currentPeriodEnd

    Subscription.validatePeriod(newPeriodStart, newPeriodEnd)

    return new Subscription(
      this._id,
      this._userId,
      this._plan,
      SubscriptionStatus.ACTIVE,
      newPeriodStart,
      newPeriodEnd,
      this._cancelledAt,
      this._createdAt,
      new Date(),
      this._trialEndDate,
      this._trialStartedAt
    )
  }

  /**
   * 플랜 변경
   */
  changePlan(newPlan: SubscriptionPlan): Subscription {
    if (
      this._status === SubscriptionStatus.CANCELLED ||
      this._status === SubscriptionStatus.EXPIRED
    ) {
      throw InvalidSubscriptionError.invalidPlanChange(this._plan, newPlan)
    }

    if (newPlan === this._plan) {
      throw InvalidSubscriptionError.invalidPlanChange(this._plan, newPlan)
    }

    return new Subscription(
      this._id,
      this._userId,
      newPlan,
      this._status,
      this._currentPeriodStart,
      this._currentPeriodEnd,
      this._cancelledAt,
      this._createdAt,
      new Date(),
      this._trialEndDate,
      this._trialStartedAt
    )
  }
  
  /**
   * 만료됨으로 표시
   */
  markExpired(): Subscription {
    if (!canTransitionSubscription(this._status, SubscriptionStatus.EXPIRED)) {
      throw InvalidSubscriptionError.invalidStatusTransition(
        this._status,
        SubscriptionStatus.EXPIRED
      )
    }

    return new Subscription(
      this._id,
      this._userId,
      this._plan,
      SubscriptionStatus.EXPIRED,
      this._currentPeriodStart,
      this._currentPeriodEnd,
      this._cancelledAt,
      this._createdAt,
      new Date(),
      this._trialEndDate,
      this._trialStartedAt
    )
  }

  toJSON(): SubscriptionProps {
    return {
      id: this._id,
      userId: this._userId,
      plan: this._plan,
      status: this._status,
      currentPeriodStart: this._currentPeriodStart,
      currentPeriodEnd: this._currentPeriodEnd,
      cancelledAt: this._cancelledAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      trialEndDate: this._trialEndDate,
      trialStartedAt: this._trialStartedAt,
    }
  }
}
