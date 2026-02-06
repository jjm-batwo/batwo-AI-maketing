import type { Alert } from '../entities/Alert'
import type { AlertSeverity, AlertStatus } from '../entities/Alert'

export interface IAlertRepository {
  save(alert: Alert): Promise<Alert>
  findById(id: string): Promise<Alert | null>
  findByUserId(userId: string, options?: {
    status?: AlertStatus
    severity?: AlertSeverity
    limit?: number
  }): Promise<Alert[]>
  countUnread(userId: string): Promise<number>
  update(alert: Alert): Promise<Alert>
}
