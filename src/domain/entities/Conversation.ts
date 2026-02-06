export interface ConversationProps {
  id: string
  userId: string
  title: string | null
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
}

export class Conversation {
  private constructor(private readonly props: ConversationProps) {}

  static create(userId: string): Conversation {
    return new Conversation({
      id: '',
      userId,
      title: null,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  static fromPersistence(props: ConversationProps): Conversation {
    return new Conversation(props)
  }

  get id(): string {
    return this.props.id
  }
  get userId(): string {
    return this.props.userId
  }
  get title(): string | null {
    return this.props.title
  }
  get isArchived(): boolean {
    return this.props.isArchived
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get updatedAt(): Date {
    return this.props.updatedAt
  }

  setTitle(title: string): Conversation {
    return new Conversation({ ...this.props, title, updatedAt: new Date() })
  }

  archive(): Conversation {
    return new Conversation({ ...this.props, isArchived: true, updatedAt: new Date() })
  }

  toJSON(): ConversationProps {
    return { ...this.props }
  }
}
