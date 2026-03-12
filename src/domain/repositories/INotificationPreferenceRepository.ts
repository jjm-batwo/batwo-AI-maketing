import type { NotificationPreference } from '../value-objects/NotificationPreference'

export interface INotificationPreferenceRepository {
  save(preference: NotificationPreference): Promise<NotificationPreference>
  findById(id: string): Promise<NotificationPreference | null>
  findByUserId(userId: string): Promise<NotificationPreference[]>
  findByUserAndType(userId: string, alertType: string): Promise<NotificationPreference | null>
  update(preference: NotificationPreference): Promise<NotificationPreference>
  delete(id: string): Promise<void>
}
