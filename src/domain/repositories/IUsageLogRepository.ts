export type UsageType = 'CAMPAIGN_CREATE' | 'AI_COPY_GEN' | 'AI_ANALYSIS' | 'AI_SCIENCE' | 'AI_KPI_INSIGHT'

export interface UsageLog {
  id: number
  userId: string
  type: UsageType
  createdAt: Date
}

export interface IUsageLogRepository {
  log(userId: string, type: UsageType): Promise<void>
  countByPeriod(
    userId: string,
    type: UsageType,
    period: 'day' | 'week'
  ): Promise<number>
  findByUserAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageLog[]>
  deleteOlderThan(date: Date): Promise<number>
}
