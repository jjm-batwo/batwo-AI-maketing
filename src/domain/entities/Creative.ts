import { CreativeFormat } from '../value-objects/CreativeFormat'
import { CTAType } from '../value-objects/CTAType'
import { InvalidCreativeError } from '../errors/InvalidCreativeError'

export interface CreativeAssetData {
  id: string
  type: string
  fileName: string
  blobUrl: string
}

export interface CreateCreativeProps {
  userId: string
  name: string
  format: CreativeFormat
  primaryText?: string
  headline?: string
  description?: string
  callToAction?: CTAType
  linkUrl?: string
  assets?: CreativeAssetData[]
}

export interface CreativeProps extends CreateCreativeProps {
  id: string
  metaCreativeId?: string
  createdAt: Date
  updatedAt: Date
}

export class Creative {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _name: string,
    private readonly _format: CreativeFormat,
    private readonly _primaryText: string | undefined,
    private readonly _headline: string | undefined,
    private readonly _description: string | undefined,
    private readonly _callToAction: CTAType,
    private readonly _linkUrl: string | undefined,
    private readonly _assets: CreativeAssetData[],
    private readonly _metaCreativeId: string | undefined,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  static create(props: CreateCreativeProps): Creative {
    Creative.validateName(props.name)
    if (props.primaryText !== undefined) Creative.validatePrimaryText(props.primaryText)
    if (props.headline !== undefined) Creative.validateHeadline(props.headline)
    if (props.linkUrl !== undefined) Creative.validateLinkUrl(props.linkUrl)

    const now = new Date()

    return new Creative(
      crypto.randomUUID(),
      props.userId,
      props.name,
      props.format,
      props.primaryText,
      props.headline,
      props.description,
      props.callToAction ?? CTAType.LEARN_MORE,
      props.linkUrl,
      props.assets ?? [],
      undefined,
      now,
      now
    )
  }

  static restore(props: CreativeProps): Creative {
    return new Creative(
      props.id,
      props.userId,
      props.name,
      props.format,
      props.primaryText,
      props.headline,
      props.description,
      props.callToAction ?? CTAType.LEARN_MORE,
      props.linkUrl,
      props.assets ?? [],
      props.metaCreativeId,
      props.createdAt,
      props.updatedAt
    )
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw InvalidCreativeError.emptyName()
    }
    if (name.length > 255) {
      throw InvalidCreativeError.nameTooLong()
    }
  }

  private static validatePrimaryText(text: string): void {
    if (text.length > 500) {
      throw InvalidCreativeError.primaryTextTooLong()
    }
  }

  private static validateHeadline(headline: string): void {
    if (headline.length > 255) {
      throw InvalidCreativeError.headlineTooLong()
    }
  }

  private static validateLinkUrl(url: string): void {
    try {
      new URL(url)
    } catch {
      throw InvalidCreativeError.invalidLinkUrl()
    }
  }

  // Getters
  get id(): string { return this._id }
  get userId(): string { return this._userId }
  get name(): string { return this._name }
  get format(): CreativeFormat { return this._format }
  get primaryText(): string | undefined { return this._primaryText }
  get headline(): string | undefined { return this._headline }
  get description(): string | undefined { return this._description }
  get callToAction(): CTAType { return this._callToAction }
  get linkUrl(): string | undefined { return this._linkUrl }
  get assets(): CreativeAssetData[] { return [...this._assets] }
  get metaCreativeId(): string | undefined { return this._metaCreativeId }
  get createdAt(): Date { return new Date(this._createdAt) }
  get updatedAt(): Date { return new Date(this._updatedAt) }

  // 카피 업데이트 - 새 인스턴스 반환
  updateCopy(props: {
    primaryText?: string
    headline?: string
    description?: string
  }): Creative {
    const newPrimaryText = props.primaryText ?? this._primaryText
    const newHeadline = props.headline ?? this._headline
    const newDescription = props.description ?? this._description

    if (newPrimaryText !== undefined) Creative.validatePrimaryText(newPrimaryText)
    if (newHeadline !== undefined) Creative.validateHeadline(newHeadline)

    return new Creative(
      this._id,
      this._userId,
      this._name,
      this._format,
      newPrimaryText,
      newHeadline,
      newDescription,
      this._callToAction,
      this._linkUrl,
      this._assets,
      this._metaCreativeId,
      this._createdAt,
      new Date()
    )
  }

  // 에셋 업데이트 - 새 인스턴스 반환
  updateAssets(assets: CreativeAssetData[]): Creative {
    return new Creative(
      this._id,
      this._userId,
      this._name,
      this._format,
      this._primaryText,
      this._headline,
      this._description,
      this._callToAction,
      this._linkUrl,
      assets,
      this._metaCreativeId,
      this._createdAt,
      new Date()
    )
  }

  toJSON(): CreativeProps {
    return {
      id: this._id,
      userId: this._userId,
      name: this._name,
      format: this._format,
      primaryText: this._primaryText,
      headline: this._headline,
      description: this._description,
      callToAction: this._callToAction,
      linkUrl: this._linkUrl,
      assets: [...this._assets],
      metaCreativeId: this._metaCreativeId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
