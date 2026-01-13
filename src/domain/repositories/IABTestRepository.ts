import { ABTest, ABTestStatus } from '../entities/ABTest'

export interface ABTestFilters {
  campaignId?: string
  status?: ABTestStatus | ABTestStatus[]
  startDateFrom?: Date
  startDateTo?: Date
}

export interface IABTestRepository {
  save(abTest: ABTest): Promise<ABTest>
  findById(id: string): Promise<ABTest | null>
  findByCampaignId(campaignId: string): Promise<ABTest[]>
  findByFilters(filters: ABTestFilters): Promise<ABTest[]>
  update(abTest: ABTest): Promise<ABTest>
  delete(id: string): Promise<void>
  findRunningTests(): Promise<ABTest[]>
}
