import type { PrismaClient } from '@/generated/prisma'
import type { INotificationChannelRepository } from '@domain/repositories/INotificationChannelRepository'
import {
  NotificationChannel,
  type NotificationChannelType,
  type ChannelConfig,
} from '@domain/entities/NotificationChannel'

export class PrismaNotificationChannelRepository implements INotificationChannelRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(channel: NotificationChannel): Promise<NotificationChannel> {
    const data = channel.toJSON()
    const created = await this.prisma.notificationChannel.create({
      data: {
        userId: data.userId,
        type: data.type,
        config: JSON.parse(JSON.stringify(data.config)),
        isActive: data.isActive,
      },
    })
    return this.toDomain(created)
  }

  async findById(id: string): Promise<NotificationChannel | null> {
    const record = await this.prisma.notificationChannel.findUnique({ where: { id } })
    return record ? this.toDomain(record) : null
  }

  async findByUserId(userId: string): Promise<NotificationChannel[]> {
    const records = await this.prisma.notificationChannel.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map((r) => this.toDomain(r))
  }

  async findByUserAndType(
    userId: string,
    type: NotificationChannelType
  ): Promise<NotificationChannel | null> {
    const record = await this.prisma.notificationChannel.findUnique({
      where: { userId_type: { userId, type } },
    })
    return record ? this.toDomain(record) : null
  }

  async update(channel: NotificationChannel): Promise<NotificationChannel> {
    const data = channel.toJSON()
    const updated = await this.prisma.notificationChannel.update({
      where: { id: data.id },
      data: {
        config: JSON.parse(JSON.stringify(data.config)),
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    })
    return this.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificationChannel.delete({ where: { id } })
  }

  private toDomain(record: {
    id: string
    userId: string
    type: string
    config: unknown
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }): NotificationChannel {
    return NotificationChannel.restore({
      id: record.id,
      userId: record.userId,
      type: record.type as NotificationChannelType,
      config: record.config as ChannelConfig,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
