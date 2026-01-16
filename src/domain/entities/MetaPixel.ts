import { InvalidPixelError } from '../errors/InvalidPixelError'

export enum PixelSetupMethod {
  MANUAL = 'MANUAL',
  PLATFORM_API = 'PLATFORM_API',
}

export interface CreateMetaPixelProps {
  userId: string
  metaPixelId: string
  name: string
  setupMethod?: PixelSetupMethod
}

export interface MetaPixelProps extends Omit<CreateMetaPixelProps, 'setupMethod'> {
  id: string
  isActive: boolean
  setupMethod: PixelSetupMethod
  createdAt: Date
  updatedAt: Date
}

export class MetaPixel {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _metaPixelId: string,
    private readonly _name: string,
    private readonly _isActive: boolean,
    private readonly _setupMethod: PixelSetupMethod,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  static create(props: CreateMetaPixelProps): MetaPixel {
    MetaPixel.validateName(props.name)
    MetaPixel.validateMetaPixelId(props.metaPixelId)

    const now = new Date()

    return new MetaPixel(
      crypto.randomUUID(),
      props.userId,
      props.metaPixelId,
      props.name,
      true, // isActive by default
      props.setupMethod ?? PixelSetupMethod.MANUAL,
      now,
      now
    )
  }

  static restore(props: MetaPixelProps): MetaPixel {
    return new MetaPixel(
      props.id,
      props.userId,
      props.metaPixelId,
      props.name,
      props.isActive,
      props.setupMethod,
      props.createdAt,
      props.updatedAt
    )
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw InvalidPixelError.emptyName()
    }

    if (name.length > 255) {
      throw InvalidPixelError.nameTooLong()
    }
  }

  private static validateMetaPixelId(metaPixelId: string): void {
    if (!metaPixelId || metaPixelId.trim().length === 0) {
      throw InvalidPixelError.emptyMetaPixelId()
    }

    if (!MetaPixel.isValidMetaPixelId(metaPixelId)) {
      throw InvalidPixelError.invalidMetaPixelIdFormat()
    }
  }

  /**
   * Validates Meta Pixel ID format
   * Meta Pixel IDs are 15-16 digit numeric strings
   */
  static isValidMetaPixelId(metaPixelId: string): boolean {
    if (!metaPixelId) return false
    return /^\d{15,16}$/.test(metaPixelId)
  }

  // Getters
  get id(): string {
    return this._id
  }

  get userId(): string {
    return this._userId
  }

  get metaPixelId(): string {
    return this._metaPixelId
  }

  get name(): string {
    return this._name
  }

  get isActive(): boolean {
    return this._isActive
  }

  get setupMethod(): PixelSetupMethod {
    return this._setupMethod
  }

  get createdAt(): Date {
    return new Date(this._createdAt)
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt)
  }

  // Commands (immutable - return new instances)
  activate(): MetaPixel {
    return new MetaPixel(
      this._id,
      this._userId,
      this._metaPixelId,
      this._name,
      true,
      this._setupMethod,
      this._createdAt,
      new Date()
    )
  }

  deactivate(): MetaPixel {
    return new MetaPixel(
      this._id,
      this._userId,
      this._metaPixelId,
      this._name,
      false,
      this._setupMethod,
      this._createdAt,
      new Date()
    )
  }

  updateSetupMethod(setupMethod: PixelSetupMethod): MetaPixel {
    return new MetaPixel(
      this._id,
      this._userId,
      this._metaPixelId,
      this._name,
      this._isActive,
      setupMethod,
      this._createdAt,
      new Date()
    )
  }

  updateName(name: string): MetaPixel {
    MetaPixel.validateName(name)

    return new MetaPixel(
      this._id,
      this._userId,
      this._metaPixelId,
      name,
      this._isActive,
      this._setupMethod,
      this._createdAt,
      new Date()
    )
  }

  toJSON(): MetaPixelProps {
    return {
      id: this._id,
      userId: this._userId,
      metaPixelId: this._metaPixelId,
      name: this._name,
      isActive: this._isActive,
      setupMethod: this._setupMethod,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
