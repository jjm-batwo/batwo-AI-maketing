import type { PrismaClient } from '@/generated/prisma'
import { Prisma } from '@/generated/prisma'
import type { IPendingActionRepository } from '@domain/repositories/IPendingActionRepository'
import { PendingAction } from '@domain/entities/PendingAction'
import type { ActionDetail, PendingActionStatus } from '@domain/entities/PendingAction'

export class PrismaPendingActionRepository implements IPendingActionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(action: PendingAction): Promise<PendingAction> {
    const saved = await this.prisma.pendingAction.create({
      data: {
        conversationId: action.conversationId,
        messageId: action.messageId,
        toolName: action.toolName,
        toolArgs: action.toolArgs as Prisma.InputJsonValue,
        displaySummary: action.displaySummary,
        details: action.details as unknown as Prisma.InputJsonValue,
        warnings: action.warnings,
        status: action.status,
        expiresAt: action.expiresAt,
      },
    })

    return this.toDomain(saved)
  }

  async findById(id: string): Promise<PendingAction | null> {
    const record = await this.prisma.pendingAction.findUnique({ where: { id } })
    if (!record) return null
    return this.toDomain(record)
  }

  async findByConversationId(conversationId: string, status?: string): Promise<PendingAction[]> {
    const records = await this.prisma.pendingAction.findMany({
      where: {
        conversationId,
        ...(status ? { status: status as PendingActionStatus } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    return records.map((r) => this.toDomain(r))
  }

  async update(action: PendingAction): Promise<PendingAction> {
    const saved = await this.prisma.pendingAction.update({
      where: { id: action.id },
      data: {
        status: action.status,
        toolArgs: action.toolArgs as Prisma.InputJsonValue,
        result: (action.result ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        errorMessage: action.errorMessage,
        confirmedAt: action.confirmedAt,
        executedAt: action.executedAt,
      },
    })

    return this.toDomain(saved)
  }

  async expirePendingActions(): Promise<number> {
    const result = await this.prisma.pendingAction.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    })

    return result.count
  }

  private toDomain(record: {
    id: string
    conversationId: string
    messageId: string | null
    toolName: string
    toolArgs: unknown
    displaySummary: string
    details: unknown
    warnings: unknown
    status: string
    result: unknown
    errorMessage: string | null
    expiresAt: Date
    confirmedAt: Date | null
    executedAt: Date | null
    createdAt: Date
  }): PendingAction {
    return PendingAction.fromPersistence({
      id: record.id,
      conversationId: record.conversationId,
      messageId: record.messageId,
      toolName: record.toolName,
      toolArgs: (record.toolArgs ?? {}) as Record<string, unknown>,
      displaySummary: record.displaySummary,
      details: (record.details ?? []) as ActionDetail[],
      warnings: (record.warnings ?? []) as string[],
      status: record.status as PendingActionStatus,
      result: record.result as Record<string, unknown> | null,
      errorMessage: record.errorMessage,
      expiresAt: record.expiresAt,
      confirmedAt: record.confirmedAt,
      executedAt: record.executedAt,
      createdAt: record.createdAt,
    })
  }
}
