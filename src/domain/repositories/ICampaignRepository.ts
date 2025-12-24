import { Campaign } from '../entities/Campaign'
import { CampaignStatus } from '../value-objects/CampaignStatus'

export interface CampaignFilters {
  userId?: string
  status?: CampaignStatus | CampaignStatus[]
  startDateFrom?: Date
  startDateTo?: Date
}

export interface PaginationOptions {
  page: number
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ICampaignRepository {
  save(campaign: Campaign): Promise<Campaign>
  findById(id: string): Promise<Campaign | null>
  findByUserId(userId: string): Promise<Campaign[]>
  findByFilters(
    filters: CampaignFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Campaign>>
  update(campaign: Campaign): Promise<Campaign>
  delete(id: string): Promise<void>
  existsByNameAndUserId(name: string, userId: string, excludeId?: string): Promise<boolean>
}
