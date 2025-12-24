import {
  IUsageLogRepository,
  UsageType,
  UsageLog,
} from '@domain/repositories/IUsageLogRepository'

export class MockUsageLogRepository implements IUsageLogRepository {
  private logs: UsageLog[] = []
  private idCounter = 1

  async log(userId: string, type: UsageType): Promise<void> {
    this.logs.push({
      id: this.idCounter++,
      userId,
      type,
      createdAt: new Date(),
    })
  }

  async countByPeriod(
    userId: string,
    type: UsageType,
    period: 'day' | 'week'
  ): Promise<number> {
    const now = new Date()
    const periodStart = new Date()

    if (period === 'day') {
      periodStart.setHours(0, 0, 0, 0)
    } else {
      periodStart.setDate(now.getDate() - 7)
      periodStart.setHours(0, 0, 0, 0)
    }

    return this.logs.filter(
      (log) =>
        log.userId === userId &&
        log.type === type &&
        log.createdAt >= periodStart
    ).length
  }

  async findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageLog[]> {
    return this.logs.filter(
      (log) =>
        log.userId === userId &&
        log.createdAt >= startDate &&
        log.createdAt <= endDate
    )
  }

  async deleteOlderThan(date: Date): Promise<number> {
    const before = this.logs.length
    this.logs = this.logs.filter((log) => log.createdAt >= date)
    return before - this.logs.length
  }

  // Test helpers
  clear(): void {
    this.logs = []
    this.idCounter = 1
  }

  addLogs(logs: Omit<UsageLog, 'id'>[]): void {
    for (const log of logs) {
      this.logs.push({ ...log, id: this.idCounter++ })
    }
  }

  getAll(): UsageLog[] {
    return [...this.logs]
  }
}
