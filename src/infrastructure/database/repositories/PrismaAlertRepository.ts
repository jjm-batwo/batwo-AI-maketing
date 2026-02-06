import type { PrismaClient } from '@/generated/prisma'
import { Prisma } from '@/generated/prisma'
import type { IAlertRepository } from '@domain/repositories/IAlertRepository'
import { Alert } from '@domain/entities/Alert'
import type { AlertSeverity, AlertStatus, AlertType } from '@domain/entities/Alert'

export class PrismaAlertRepository implements IAlertRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(alert: Alert): Promise<Alert> {
    const saved = await this.prisma.alert.create({
      data: {
        userId: alert.userId,
        type: alert.type,
        severity: alert.severity,
        status: alert.status,
        title: alert.title,
        message: alert.message,
        data: (alert.data ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        campaignId: alert.campaignId,
        pushedToChat: alert.pushedToChat,
        expiresAt: alert.expiresAt,
      },
    })

    return this.toDomain(saved)
  }

  async findById(id: string): Promise<Alert | null> {
    const record = await this.prisma.alert.findUnique({ where: { id } })
    if (!record) return null
    return this.toDomain(record)
  }

  async findByUserId(
    userId: string,
    options?: { status?: AlertStatus; severity?: AlertSeverity; limit?: number }
  ): Promise<Alert[]> {
    const records = await this.prisma.alert.findMany({
      where: {
        userId,
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.severity ? { severity: options.severity } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 20,
    })

    return records.map((r) => this.toDomain(r))
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.alert.count({
      where: { userId, status: 'UNREAD' },
    })
  }

  async update(alert: Alert): Promise<Alert> {
    const saved = await this.prisma.alert.update({
      where: { id: alert.id },
      data: {
        status: alert.status,
        readAt: alert.readAt,
        pushedToChat: alert.pushedToChat,
      },
    })

    return this.toDomain(saved)
  }

  private toDomain(record: {
    id: string
    userId: string
    type: string
    severity: string
    status: string
    title: string
    message: string
    data: unknown
    campaignId: string | null
    pushedToChat: boolean
    createdAt: Date
    readAt: Date | null
    expiresAt: Date | null
  }): Alert {
    return Alert.fromPersistence({
      id: record.id,
      userId: record.userId,
      type: record.type as AlertType,
      severity: record.severity as AlertSeverity,
      status: record.status as AlertStatus,
      title: record.title,
      message: record.message,
      data: record.data as Record<string, unknown> | null,
      campaignId: record.campaignId,
      pushedToChat: record.pushedToChat,
      createdAt: record.createdAt,
      readAt: record.readAt,
      expiresAt: record.expiresAt,
    })
  }
}
