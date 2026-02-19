import { Money } from '../value-objects/Money'
import { AdSetStatus, canAdSetTransition, isAdSetTerminalStatus } from '../value-objects/AdSetStatus'
import { BillingEvent } from '../value-objects/BillingEvent'
import { OptimizationGoal } from '../value-objects/OptimizationGoal'
import { BidStrategy } from '../value-objects/BidStrategy'
import { InvalidAdSetError } from '../errors/InvalidAdSetError'

// 광고 세트 생성 속성
export interface CreateAdSetProps {
  campaignId: string
  name: string
  dailyBudget?: Money
  lifetimeBudget?: Money
  currency?: string
  billingEvent?: BillingEvent
  optimizationGoal?: OptimizationGoal
  bidStrategy?: BidStrategy
  targeting?: Record<string, unknown>
  placements?: Record<string, unknown>
  schedule?: Record<string, unknown>
  startDate: Date
  endDate?: Date
}

// 광고 세트 전체 속성 (DB 복원용)
export interface AdSetProps extends CreateAdSetProps {
  id: string
  status: AdSetStatus
  metaAdSetId?: string
  createdAt: Date
  updatedAt: Date
}

export class AdSet {
  private constructor(
    private readonly _id: string,
    private readonly _campaignId: string,
    private readonly _name: string,
    private readonly _status: AdSetStatus,
    private readonly _dailyBudget: Money | undefined,
    private readonly _lifetimeBudget: Money | undefined,
    private readonly _currency: string,
    private readonly _billingEvent: BillingEvent,
    private readonly _optimizationGoal: OptimizationGoal,
    private readonly _bidStrategy: BidStrategy,
    private readonly _targeting: Record<string, unknown> | undefined,
    private readonly _placements: Record<string, unknown> | undefined,
    private readonly _schedule: Record<string, unknown> | undefined,
    private readonly _startDate: Date,
    private readonly _endDate: Date | undefined,
    private readonly _metaAdSetId: string | undefined,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  static create(props: CreateAdSetProps): AdSet {
    AdSet.validateName(props.name)
    AdSet.validateBudget(props.dailyBudget, props.lifetimeBudget)
    AdSet.validateDates(props.startDate, props.endDate)

    const now = new Date()
    const id = crypto.randomUUID()

    return new AdSet(
      id,
      props.campaignId,
      props.name,
      AdSetStatus.DRAFT,
      props.dailyBudget,
      props.lifetimeBudget,
      props.currency ?? 'KRW',
      props.billingEvent ?? BillingEvent.IMPRESSIONS,
      props.optimizationGoal ?? OptimizationGoal.CONVERSIONS,
      props.bidStrategy ?? BidStrategy.LOWEST_COST_WITHOUT_CAP,
      props.targeting,
      props.placements,
      props.schedule,
      props.startDate,
      props.endDate,
      undefined,
      now,
      now
    )
  }

  static restore(props: AdSetProps): AdSet {
    return new AdSet(
      props.id,
      props.campaignId,
      props.name,
      props.status,
      props.dailyBudget,
      props.lifetimeBudget,
      props.currency ?? 'KRW',
      props.billingEvent ?? BillingEvent.IMPRESSIONS,
      props.optimizationGoal ?? OptimizationGoal.CONVERSIONS,
      props.bidStrategy ?? BidStrategy.LOWEST_COST_WITHOUT_CAP,
      props.targeting,
      props.placements,
      props.schedule,
      props.startDate,
      props.endDate,
      props.metaAdSetId,
      props.createdAt,
      props.updatedAt
    )
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw InvalidAdSetError.emptyName()
    }
    if (name.length > 255) {
      throw InvalidAdSetError.nameTooLong()
    }
  }

  private static validateBudget(dailyBudget?: Money, lifetimeBudget?: Money): void {
    if (!dailyBudget && !lifetimeBudget) {
      throw InvalidAdSetError.noBudget()
    }
    if (dailyBudget && dailyBudget.isZero()) {
      throw InvalidAdSetError.invalidBudget()
    }
    if (lifetimeBudget && lifetimeBudget.isZero()) {
      throw InvalidAdSetError.invalidBudget()
    }
  }

  private static validateDates(startDate: Date, endDate?: Date): void {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (startDate < today) {
      throw InvalidAdSetError.pastStartDate()
    }
    if (endDate && endDate < startDate) {
      throw InvalidAdSetError.invalidDateRange()
    }
  }

  // Getters
  get id(): string { return this._id }
  get campaignId(): string { return this._campaignId }
  get name(): string { return this._name }
  get status(): AdSetStatus { return this._status }
  get dailyBudget(): Money | undefined { return this._dailyBudget }
  get lifetimeBudget(): Money | undefined { return this._lifetimeBudget }
  get currency(): string { return this._currency }
  get billingEvent(): BillingEvent { return this._billingEvent }
  get optimizationGoal(): OptimizationGoal { return this._optimizationGoal }
  get bidStrategy(): BidStrategy { return this._bidStrategy }
  get targeting(): Record<string, unknown> | undefined {
    return this._targeting ? { ...this._targeting } : undefined
  }
  get placements(): Record<string, unknown> | undefined {
    return this._placements ? { ...this._placements } : undefined
  }
  get schedule(): Record<string, unknown> | undefined {
    return this._schedule ? { ...this._schedule } : undefined
  }
  get startDate(): Date { return new Date(this._startDate) }
  get endDate(): Date | undefined {
    return this._endDate ? new Date(this._endDate) : undefined
  }
  get metaAdSetId(): string | undefined { return this._metaAdSetId }
  get createdAt(): Date { return new Date(this._createdAt) }
  get updatedAt(): Date { return new Date(this._updatedAt) }

  // 상태 변경
  changeStatus(newStatus: AdSetStatus): AdSet {
    if (isAdSetTerminalStatus(this._status)) {
      throw InvalidAdSetError.invalidStatusTransition(this._status, newStatus)
    }
    if (!canAdSetTransition(this._status, newStatus)) {
      throw InvalidAdSetError.invalidStatusTransition(this._status, newStatus)
    }

    return new AdSet(
      this._id, this._campaignId, this._name, newStatus,
      this._dailyBudget, this._lifetimeBudget, this._currency,
      this._billingEvent, this._optimizationGoal, this._bidStrategy,
      this._targeting, this._placements, this._schedule,
      this._startDate, this._endDate, this._metaAdSetId,
      this._createdAt, new Date()
    )
  }

  // 예산 변경
  updateBudget(props: { dailyBudget?: Money | undefined; lifetimeBudget?: Money | undefined }): AdSet {
    const newDaily = 'dailyBudget' in props ? props.dailyBudget : this._dailyBudget
    const newLifetime = 'lifetimeBudget' in props ? props.lifetimeBudget : this._lifetimeBudget

    AdSet.validateBudget(newDaily, newLifetime)

    return new AdSet(
      this._id, this._campaignId, this._name, this._status,
      newDaily, newLifetime, this._currency,
      this._billingEvent, this._optimizationGoal, this._bidStrategy,
      this._targeting, this._placements, this._schedule,
      this._startDate, this._endDate, this._metaAdSetId,
      this._createdAt, new Date()
    )
  }

  // 타겟팅 변경
  updateTargeting(targeting: Record<string, unknown>): AdSet {
    return new AdSet(
      this._id, this._campaignId, this._name, this._status,
      this._dailyBudget, this._lifetimeBudget, this._currency,
      this._billingEvent, this._optimizationGoal, this._bidStrategy,
      targeting, this._placements, this._schedule,
      this._startDate, this._endDate, this._metaAdSetId,
      this._createdAt, new Date()
    )
  }

  toJSON(): AdSetProps {
    return {
      id: this._id,
      campaignId: this._campaignId,
      name: this._name,
      status: this._status,
      dailyBudget: this._dailyBudget,
      lifetimeBudget: this._lifetimeBudget,
      currency: this._currency,
      billingEvent: this._billingEvent,
      optimizationGoal: this._optimizationGoal,
      bidStrategy: this._bidStrategy,
      targeting: this._targeting,
      placements: this._placements,
      schedule: this._schedule,
      startDate: this._startDate,
      endDate: this._endDate,
      metaAdSetId: this._metaAdSetId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
