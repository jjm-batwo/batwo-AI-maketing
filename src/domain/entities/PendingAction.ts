export type PendingActionStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'EXECUTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'EXPIRED'

export interface ActionDetail {
  label: string
  value: string
  changed?: boolean
}

export interface PendingActionProps {
  id: string
  conversationId: string
  messageId: string | null
  toolName: string
  toolArgs: Record<string, unknown>
  displaySummary: string
  details: ActionDetail[]
  warnings: string[]
  status: PendingActionStatus
  result: Record<string, unknown> | null
  errorMessage: string | null
  expiresAt: Date
  confirmedAt: Date | null
  executedAt: Date | null
  createdAt: Date
}

export class PendingAction {
  private static readonly DEFAULT_TTL_MS = 30 * 60 * 1000

  private constructor(private readonly props: PendingActionProps) {}

  static create(params: {
    conversationId: string
    messageId?: string
    toolName: string
    toolArgs: Record<string, unknown>
    displaySummary: string
    details: ActionDetail[]
    warnings?: string[]
  }): PendingAction {
    return new PendingAction({
      id: '',
      conversationId: params.conversationId,
      messageId: params.messageId ?? null,
      toolName: params.toolName,
      toolArgs: params.toolArgs,
      displaySummary: params.displaySummary,
      details: params.details,
      warnings: params.warnings ?? [],
      status: 'PENDING',
      result: null,
      errorMessage: null,
      expiresAt: new Date(Date.now() + PendingAction.DEFAULT_TTL_MS),
      confirmedAt: null,
      executedAt: null,
      createdAt: new Date(),
    })
  }

  static fromPersistence(props: PendingActionProps): PendingAction {
    return new PendingAction(props)
  }

  get id(): string {
    return this.props.id
  }
  get conversationId(): string {
    return this.props.conversationId
  }
  get messageId(): string | null {
    return this.props.messageId
  }
  get toolName(): string {
    return this.props.toolName
  }
  get toolArgs(): Record<string, unknown> {
    return this.props.toolArgs
  }
  get displaySummary(): string {
    return this.props.displaySummary
  }
  get details(): ActionDetail[] {
    return this.props.details
  }
  get warnings(): string[] {
    return this.props.warnings
  }
  get status(): PendingActionStatus {
    return this.props.status
  }
  get result(): Record<string, unknown> | null {
    return this.props.result
  }
  get errorMessage(): string | null {
    return this.props.errorMessage
  }
  get expiresAt(): Date {
    return this.props.expiresAt
  }
  get confirmedAt(): Date | null {
    return this.props.confirmedAt
  }
  get executedAt(): Date | null {
    return this.props.executedAt
  }
  get createdAt(): Date {
    return this.props.createdAt
  }
  get isExpired(): boolean {
    return new Date() > this.props.expiresAt
  }

  confirm(): PendingAction {
    if (this.props.status !== 'PENDING') throw new Error('Action is not pending')
    if (this.isExpired) throw new Error('Action has expired')
    return new PendingAction({ ...this.props, status: 'CONFIRMED', confirmedAt: new Date() })
  }

  startExecution(): PendingAction {
    if (this.props.status !== 'CONFIRMED') throw new Error('Action is not confirmed')
    return new PendingAction({ ...this.props, status: 'EXECUTING' })
  }

  complete(result: Record<string, unknown>): PendingAction {
    return new PendingAction({
      ...this.props,
      status: 'COMPLETED',
      result,
      executedAt: new Date(),
    })
  }

  fail(errorMessage: string): PendingAction {
    return new PendingAction({
      ...this.props,
      status: 'FAILED',
      errorMessage,
      executedAt: new Date(),
    })
  }

  cancel(): PendingAction {
    if (this.props.status !== 'PENDING') throw new Error('Can only cancel pending actions')
    return new PendingAction({ ...this.props, status: 'CANCELLED' })
  }

  modifyArgs(newArgs: Record<string, unknown>): PendingAction {
    if (this.props.status !== 'PENDING') throw new Error('Can only modify pending actions')
    return new PendingAction({ ...this.props, toolArgs: newArgs })
  }

  toJSON(): PendingActionProps {
    return { ...this.props }
  }
}
