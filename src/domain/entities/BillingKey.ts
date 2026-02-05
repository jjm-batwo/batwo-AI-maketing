export interface CreateBillingKeyProps {
  userId: string
  encryptedBillingKey: string
  cardCompany?: string
  cardNumber?: string // masked
  method?: string
  authenticatedAt: Date
}

export interface BillingKeyProps extends CreateBillingKeyProps {
  id: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class BillingKey {
  private constructor(
    private readonly _id: string,
    private readonly _userId: string,
    private readonly _encryptedBillingKey: string,
    private readonly _cardCompany: string | undefined,
    private readonly _cardNumber: string | undefined,
    private readonly _method: string,
    private readonly _isActive: boolean,
    private readonly _authenticatedAt: Date,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date
  ) {}

  static create(props: CreateBillingKeyProps): BillingKey {
    const now = new Date()
    return new BillingKey(
      crypto.randomUUID(),
      props.userId,
      props.encryptedBillingKey,
      props.cardCompany,
      props.cardNumber,
      props.method ?? 'CARD',
      true,
      props.authenticatedAt,
      now,
      now
    )
  }

  static restore(props: BillingKeyProps): BillingKey {
    return new BillingKey(
      props.id,
      props.userId,
      props.encryptedBillingKey,
      props.cardCompany,
      props.cardNumber,
      props.method ?? 'CARD',
      props.isActive,
      props.authenticatedAt,
      props.createdAt,
      props.updatedAt
    )
  }

  // Getters
  get id(): string {
    return this._id
  }

  get userId(): string {
    return this._userId
  }

  get encryptedBillingKey(): string {
    return this._encryptedBillingKey
  }

  get cardCompany(): string | undefined {
    return this._cardCompany
  }

  get cardNumber(): string | undefined {
    return this._cardNumber
  }

  get method(): string {
    return this._method
  }

  get isActive(): boolean {
    return this._isActive
  }

  get authenticatedAt(): Date {
    return new Date(this._authenticatedAt)
  }

  get createdAt(): Date {
    return new Date(this._createdAt)
  }

  get updatedAt(): Date {
    return new Date(this._updatedAt)
  }

  // Commands
  deactivate(): BillingKey {
    if (!this._isActive) {
      throw new Error('BillingKey is already deactivated')
    }
    return new BillingKey(
      this._id,
      this._userId,
      this._encryptedBillingKey,
      this._cardCompany,
      this._cardNumber,
      this._method,
      false,
      this._authenticatedAt,
      this._createdAt,
      new Date()
    )
  }

  toJSON(): BillingKeyProps {
    return {
      id: this._id,
      userId: this._userId,
      encryptedBillingKey: this._encryptedBillingKey,
      cardCompany: this._cardCompany,
      cardNumber: this._cardNumber,
      method: this._method,
      isActive: this._isActive,
      authenticatedAt: this._authenticatedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    }
  }
}
