export interface CompetitorTrackingProps {
  id: string
  userId: string
  pageId: string
  pageName: string
  industry: string | null
  createdAt: Date
  updatedAt: Date
}

export class CompetitorTracking {
  private constructor(private readonly props: CompetitorTrackingProps) {}

  static create(params: {
    userId: string
    pageId: string
    pageName: string
    industry?: string
  }): CompetitorTracking {
    const now = new Date()
    return new CompetitorTracking({
      id: '',
      userId: params.userId,
      pageId: params.pageId,
      pageName: params.pageName,
      industry: params.industry ?? null,
      createdAt: now,
      updatedAt: now,
    })
  }

  static fromPersistence(props: CompetitorTrackingProps): CompetitorTracking {
    return new CompetitorTracking(props)
  }

  get id(): string {
    return this.props.id
  }
  get userId(): string {
    return this.props.userId
  }
  get pageId(): string {
    return this.props.pageId
  }
  get pageName(): string {
    return this.props.pageName
  }
  get industry(): string | null {
    return this.props.industry
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  toJSON(): CompetitorTrackingProps {
    return { ...this.props }
  }
}
