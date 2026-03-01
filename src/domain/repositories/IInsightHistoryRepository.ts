export interface SaveInsightHistoryDTO {
  userId: string
  campaignId?: string
  category: string
  priority: string
  title: string
  description: string
  rootCause?: string
  metadata?: Record<string, unknown>
}

export interface InsightHistoryRecord {
  id: string
  userId: string
  campaignId?: string
  category: string
  priority: string
  title: string
  description: string
  rootCause?: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export interface IInsightHistoryRepository {
  save(dto: SaveInsightHistoryDTO): Promise<void>
  findByUserId(userId: string, limit?: number): Promise<InsightHistoryRecord[]>
}
