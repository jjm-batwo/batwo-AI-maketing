import { Campaign } from '@domain/entities/Campaign'
import {
  ICampaignRepository,
  CampaignFilters,
  PaginationOptions,
  PaginatedResult,
} from '@domain/repositories/ICampaignRepository'

export class MockCampaignRepository implements ICampaignRepository {
  private campaigns: Map<string, Campaign> = new Map()

  async save(campaign: Campaign): Promise<Campaign> {
    this.campaigns.set(campaign.id, campaign)
    return campaign
  }

  async findById(id: string): Promise<Campaign | null> {
    return this.campaigns.get(id) || null
  }

  async findByUserId(userId: string): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (c) => c.userId === userId
    )
  }

  async findByFilters(
    filters: CampaignFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Campaign>> {
    let results = Array.from(this.campaigns.values())

    if (filters.userId) {
      results = results.filter((c) => c.userId === filters.userId)
    }

    if (filters.status) {
      const statuses = Array.isArray(filters.status)
        ? filters.status
        : [filters.status]
      results = results.filter((c) => statuses.includes(c.status))
    }

    const page = pagination?.page || 1
    const limit = pagination?.limit || 10
    const total = results.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const data = results.slice(start, start + limit)

    return { data, total, page, limit, totalPages }
  }

  async update(campaign: Campaign): Promise<Campaign> {
    this.campaigns.set(campaign.id, campaign)
    return campaign
  }

  async delete(id: string): Promise<void> {
    this.campaigns.delete(id)
  }

  async existsByNameAndUserId(
    name: string,
    userId: string,
    excludeId?: string
  ): Promise<boolean> {
    return Array.from(this.campaigns.values()).some(
      (c) =>
        c.name === name && c.userId === userId && (!excludeId || c.id !== excludeId)
    )
  }

  // Test helpers
  clear(): void {
    this.campaigns.clear()
  }

  getAll(): Campaign[] {
    return Array.from(this.campaigns.values())
  }
}
