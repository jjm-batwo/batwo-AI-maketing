import { Money } from '../value-objects/Money'
import {
  CampaignStatus,
  canTransition,
  isEditableStatus,
  isActiveStatus,
  isTerminalStatus,
} from '../value-objects/CampaignStatus'
import { CampaignObjective } from '../value-objects/CampaignObjective'
import { AdvantageConfig } from '../value-objects/AdvantageConfig'
import { InvalidCampaignError } from '../errors/InvalidCampaignError'
import { AggregateRoot } from '../events/AggregateRoot'
import {
  CampaignCreatedEvent,
  CampaignStatusChangedEvent,
  CampaignBudgetUpdatedEvent,
} from '../events'

export interface TargetAudience {
  ageMin?: number
  ageMax?: number
  genders?: ('male' | 'female' | 'all')[]
  locations?: string[]
  interests?: string[]
  behaviors?: string[]
}

export interface CreateCampaignProps {
  userId: string
  name: string
  objective: CampaignObjective
  dailyBudget: Money
  startDate: Date
  endDate?: Date
  targetAudience?: TargetAudience
  buyingType?: string
  advantageConfig?: AdvantageConfig
}

export interface CampaignProps extends CreateCampaignProps {
  id: string
  status: CampaignStatus
  metaCampaignId?: string
  buyingType?: string
  advantageConfig?: AdvantageConfig
  createdAt: Date
  updatedAt: Date
}

export class Campaign extends AggregateRoot {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _name: string,
    private readonly _objective: CampaignObjective,
    private readonly _status: CampaignStatus,
    private readonly _dailyBudget: Money,
    private readonly _startDate: Date,
    private readonly _endDate: Date | undefined,
    private readonly _targetAudience: TargetAudience | undefined,
    private readonly _metaCampaignId: string | undefined,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
    private readonly _buyingType: string = 'AUCTION',
    private readonly _advantageConfig: AdvantageConfig | undefined = undefined,
  ) {
    super()
  }

  static create(props: CreateCampaignProps): Campaign {
    Campaign.validateName(props.name)
    Campaign.validateBudget(props.dailyBudget)
    Campaign.validateDates(props.startDate, props.endDate)

    const now = new Date()
    const campaignId = crypto.randomUUID()

    const campaign = new Campaign(
      campaignId,
      props.userId,
      props.name,
      props.objective,
      CampaignStatus.DRAFT,
      props.dailyBudget,
      props.startDate,
      props.endDate,
      props.targetAudience,
      undefined,
      now,
      now,
      props.buyingType ?? 'AUCTION',
      props.advantageConfig,
    )

    // Raise domain event
    campaign.addDomainEvent(
      new CampaignCreatedEvent(
        campaignId,
        props.userId,
        props.name,
        props.objective,
        props.dailyBudget,
        props.startDate,
        props.endDate,
        props.targetAudience
      )
    )

    return campaign
  }

  static restore(props: CampaignProps): Campaign {
    return new Campaign(
      props.id,
      props.userId,
      props.name,
      props.objective,
      props.status,
      props.dailyBudget,
      props.startDate,
      props.endDate,
      props.targetAudience,
      props.metaCampaignId,
      props.createdAt,
      props.updatedAt,
      props.buyingType ?? 'AUCTION',
      props.advantageConfig,
    )
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw InvalidCampaignError.emptyName()
    }

    if (name.length > 255) {
      throw InvalidCampaignError.nameTooLong()
    }
  }

  private static validateBudget(budget: Money): void {
    if (budget.isZero() || budget.amount < 0) {
      throw InvalidCampaignError.invalidBudget()
    }
  }

  private static validateDates(startDate: Date, endDate?: Date): void {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    if (startDate < today) {
      throw InvalidCampaignError.pastStartDate()
    }

    if (endDate && endDate < startDate) {
      throw InvalidCampaignError.invalidDateRange()
    }
  }

  // Getters
  get id(): string {
    return this._id
  }
  get userId(): string {
    return this._userId
  }
  get name(): string {
    return this._name
  }
  get objective(): CampaignObjective {
    return this._objective
  }
  get status(): CampaignStatus {
    return this._status
  }
  get dailyBudget(): Money {
    return this._dailyBudget
  }
  get startDate(): Date {
    return new Date(this._startDate)
  }
  get endDate(): Date | undefined {
    return this._endDate ? new Date(this._endDate) : undefined
  }
  get targetAudience(): TargetAudience | undefined {
    return this._targetAudience ? { ...this._targetAudience } : undefined
  }
  get metaCampaignId(): string | undefined {
    return this._metaCampaignId
  }
  get buyingType(): string {
    return this._buyingType
  }
  get advantageConfig(): AdvantageConfig | undefined {
    return this._advantageConfig
  }
  get createdAt(): Date {
    return new Date(this._createdAt)
  }
  get updatedAt(): Date {
    return new Date(this._updatedAt)
  }

  // State checks
  isActive(): boolean {
    return isActiveStatus(this._status)
  }

  isEditable(): boolean {
    return isEditableStatus(this._status) || this._status === CampaignStatus.PENDING_REVIEW
  }

  isCompleted(): boolean {
    return isTerminalStatus(this._status)
  }

  // Commands
  changeStatus(newStatus: CampaignStatus): Campaign {
    if (isTerminalStatus(this._status)) {
      throw new Error('Cannot change status of a completed campaign')
    }

    if (!canTransition(this._status, newStatus)) {
      throw InvalidCampaignError.invalidStatusTransition(this._status, newStatus)
    }

    const previousStatus = this._status

    const campaign = new Campaign(
      this._id,
      this._userId,
      this._name,
      this._objective,
      newStatus,
      this._dailyBudget,
      this._startDate,
      this._endDate,
      this._targetAudience,
      this._metaCampaignId,
      this._createdAt,
      new Date(),
      this._buyingType,
      this._advantageConfig,
    )

    // Raise domain event
    campaign.addDomainEvent(
      new CampaignStatusChangedEvent(
        this._id,
        this._userId,
        previousStatus,
        newStatus,
        this._metaCampaignId
      )
    )

    return campaign
  }

  updateBudget(newBudget: Money): Campaign {
    if (isTerminalStatus(this._status)) {
      throw new Error('Cannot update budget of a completed campaign')
    }

    Campaign.validateBudget(newBudget)

    const previousBudget = this._dailyBudget

    const campaign = new Campaign(
      this._id,
      this._userId,
      this._name,
      this._objective,
      this._status,
      newBudget,
      this._startDate,
      this._endDate,
      this._targetAudience,
      this._metaCampaignId,
      this._createdAt,
      new Date(),
      this._buyingType,
      this._advantageConfig,
    )

    // Raise domain event
    campaign.addDomainEvent(
      new CampaignBudgetUpdatedEvent(
        this._id,
        this._userId,
        previousBudget,
        newBudget,
        this._metaCampaignId
      )
    )

    return campaign
  }

  update(props: {
    name?: string
    dailyBudget?: Money
    startDate?: Date
    endDate?: Date | null
    targetAudience?: TargetAudience | null
  }): Campaign {
    if (isTerminalStatus(this._status)) {
      throw new Error('Cannot update a completed campaign')
    }

    // For ACTIVE campaigns, only budget updates are allowed
    if (
      this._status === CampaignStatus.ACTIVE &&
      (props.name !== undefined ||
        props.startDate !== undefined ||
        props.endDate !== undefined ||
        props.targetAudience !== undefined)
    ) {
      const hasOnlyBudget =
        Object.keys(props).filter((k) => k !== 'dailyBudget').length === 0 ||
        (props.name === undefined &&
          props.startDate === undefined &&
          props.endDate === undefined &&
          props.targetAudience === undefined)

      if (!hasOnlyBudget) {
        throw new Error('Only budget can be updated for active campaigns')
      }
    }

    const newName = props.name ?? this._name
    const newBudget = props.dailyBudget ?? this._dailyBudget
    const newStartDate = props.startDate ?? this._startDate
    const newEndDate = props.endDate === null ? undefined : (props.endDate ?? this._endDate)
    const newTargetAudience =
      props.targetAudience === null ? undefined : (props.targetAudience ?? this._targetAudience)

    // Validate if values changed
    if (props.name !== undefined) {
      Campaign.validateName(newName)
    }
    if (props.dailyBudget !== undefined) {
      Campaign.validateBudget(newBudget)
    }
    if (props.startDate !== undefined || props.endDate !== undefined) {
      // Skip past date validation for updates (campaign may already be started)
      if (newEndDate && newEndDate < newStartDate) {
        throw InvalidCampaignError.invalidDateRange()
      }
    }

    return new Campaign(
      this._id,
      this._userId,
      newName,
      this._objective,
      this._status,
      newBudget,
      newStartDate,
      newEndDate,
      newTargetAudience,
      this._metaCampaignId,
      this._createdAt,
      new Date(),
      this._buyingType,
      this._advantageConfig,
    )
  }

  setMetaCampaignId(metaCampaignId: string): Campaign {
    if (this._metaCampaignId) {
      throw new Error('Meta campaign ID is already set')
    }

    return new Campaign(
      this._id,
      this._userId,
      this._name,
      this._objective,
      this._status,
      this._dailyBudget,
      this._startDate,
      this._endDate,
      this._targetAudience,
      metaCampaignId,
      this._createdAt,
      new Date(),
      this._buyingType,
      this._advantageConfig,
    )
  }

  calculateTotalBudget(): Money {
    if (!this._endDate) {
      return this._dailyBudget
    }

    const days = Math.ceil(
      (this._endDate.getTime() - this._startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    return this._dailyBudget.multiply(days)
  }

  toJSON(): CampaignProps {
    return {
      id: this._id,
      userId: this._userId,
      name: this._name,
      objective: this._objective,
      status: this._status,
      dailyBudget: this._dailyBudget,
      startDate: this._startDate,
      endDate: this._endDate,
      targetAudience: this._targetAudience,
      metaCampaignId: this._metaCampaignId,
      buyingType: this._buyingType,
      advantageConfig: this._advantageConfig,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
