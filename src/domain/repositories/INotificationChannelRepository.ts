import type { NotificationChannel, NotificationChannelType } from '../entities/NotificationChannel'

export interface INotificationChannelRepository {
  save(channel: NotificationChannel): Promise<NotificationChannel>
  findById(id: string): Promise<NotificationChannel | null>
  findByUserId(userId: string): Promise<NotificationChannel[]>
  findByUserAndType(userId: string, type: NotificationChannelType): Promise<NotificationChannel | null>
  update(channel: NotificationChannel): Promise<NotificationChannel>
  delete(id: string): Promise<void>
}
