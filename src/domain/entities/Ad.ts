import { AdStatus, canAdTransition } from '../value-objects/AdStatus'
import { InvalidAdError } from '../errors/InvalidAdError'

export interface CreateAdProps {
  adSetId: string
  name: string
  creativeId: string
}

export interface AdProps extends CreateAdProps {
  id: string
  status: AdStatus
  metaAdId?: string
  createdAt: Date
  updatedAt: Date
}

export class Ad {
  private constructor(
    private readonly _id: string,
    private readonly _adSetId: string,
    private readonly _name: string,
    private readonly _status: AdStatus,
    private readonly _creativeId: string,
    private readonly _metaAdId: string | undefined,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  static create(props: CreateAdProps): Ad {
    Ad.validateName(props.name)
    Ad.validateCreativeId(props.creativeId)

    const now = new Date()

    return new Ad(
      crypto.randomUUID(),
      props.adSetId,
      props.name,
      AdStatus.DRAFT,
      props.creativeId,
      undefined,
      now,
      now
    )
  }

  static restore(props: AdProps): Ad {
    return new Ad(
      props.id,
      props.adSetId,
      props.name,
      props.status,
      props.creativeId,
      props.metaAdId,
      props.createdAt,
      props.updatedAt
    )
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw InvalidAdError.emptyName()
    }
    if (name.length > 255) {
      throw InvalidAdError.nameTooLong()
    }
  }

  private static validateCreativeId(creativeId: string): void {
    if (!creativeId || creativeId.trim().length === 0) {
      throw InvalidAdError.missingCreativeId()
    }
  }

  // Getters
  get id(): string { return this._id }
  get adSetId(): string { return this._adSetId }
  get name(): string { return this._name }
  get status(): AdStatus { return this._status }
  get creativeId(): string { return this._creativeId }
  get metaAdId(): string | undefined { return this._metaAdId }
  get createdAt(): Date { return new Date(this._createdAt) }
  get updatedAt(): Date { return new Date(this._updatedAt) }

  // 크리에이티브 변경 - 새 인스턴스 반환
  changeCreative(creativeId: string): Ad {
    Ad.validateCreativeId(creativeId)
    return new Ad(
      this._id,
      this._adSetId,
      this._name,
      this._status,
      creativeId,
      this._metaAdId,
      this._createdAt,
      new Date()
    )
  }

  // 상태 변경 - 상태 전이 검증 후 새 인스턴스 반환
  changeStatus(newStatus: AdStatus): Ad {
    if (!canAdTransition(this._status, newStatus)) {
      throw InvalidAdError.invalidStatusTransition(this._status, newStatus)
    }
    return new Ad(
      this._id,
      this._adSetId,
      this._name,
      newStatus,
      this._creativeId,
      this._metaAdId,
      this._createdAt,
      new Date()
    )
  }

  // Meta Ad ID 설정
  setMetaAdId(metaAdId: string): Ad {
    return new Ad(
      this._id,
      this._adSetId,
      this._name,
      this._status,
      this._creativeId,
      metaAdId,
      this._createdAt,
      new Date()
    )
  }

  toJSON(): AdProps {
    return {
      id: this._id,
      adSetId: this._adSetId,
      name: this._name,
      status: this._status,
      creativeId: this._creativeId,
      metaAdId: this._metaAdId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
