import type { PrismaClient } from '@/generated/prisma'
import type { INotificationPreferenceRepository } from '@domain/repositories/INotificationPreferenceRepository'
import {
  NotificationPreference,
  type AlertType,
  type MinSeverity,
} from '@domain/value-objects/NotificationPreference'
import type { NotificationChannelType } from '@domain/entities/NotificationChannel'

export class PrismaNotificationPreferenceRepository implements INotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(preference: NotificationPreference): Promise<NotificationPreference> {
    const data = preference.toJSON()
    const created = await this.prisma.notificationPreference.create({
      data: {
        userId: data.userId,
        alertType: data.alertType,
        channels: data.channels,
        minSeverity: data.minSeverity,
        isActive: data.isActive,
      },
    })
    return this.toDomain(created)
  }

  async findById(id: string): Promise<NotificationPreference | null> {
    const record = await this.prisma.notificationPreference.findUnique({ where: { id } })
    return record ? this.toDomain(record) : null
  }

  async findByUserId(userId: string): Promise<NotificationPreference[]> {
    const records = await this.prisma.notificationPreference.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
    return records.map((r) => this.toDomain(r))
  }

  async findByUserAndType(
    userId: string,
    alertType: string,
  ): Promise<NotificationPreference | null> {
    const record = await this.prisma.notificationPreference.findUnique({
      where: { userId_alertType: { userId, alertType } },
    })
    return record ? this.toDomain(record) : null
  }

  async update(preference: NotificationPreference): Promise<NotificationPreference> {
    const data = preference.toJSON()
    const updated = await this.prisma.notificationPreference.update({
      where: { id: data.id },
      data: {
        channels: data.channels,
        minSeverity: data.minSeverity,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    })
    return this.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notificationPreference.delete({ where: { id } })
  }

  private toDomain(record: {
    id: string
    userId: string
    alertType: string
    channels: string[]
    minSeverity: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
  }): NotificationPreference {
    return NotificationPreference.restore({
      id: record.id,
      userId: record.userId,
      alertType: record.alertType as AlertType,
      channels: record.channels as NotificationChannelType[],
      minSeverity: record.minSeverity as MinSeverity,
      isActive: record.isActive,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    })
  }
}
