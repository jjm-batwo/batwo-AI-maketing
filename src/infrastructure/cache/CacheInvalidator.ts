/**
 * Cache Invalidator
 *
 * Centralized cache invalidation logic for business events.
 * Ensures cache consistency across different user actions.
 */

import type { ICacheService } from '@/application/ports/ICacheService'
import { CacheKeys } from './CacheKeys'

export class CacheInvalidator {
  constructor(private cache: ICacheService) {}

  /**
   * Invalidate cache when campaign data changes
   * Clears campaign list and related KPI data
   */
  async onCampaignChange(userId: string): Promise<void> {
    await Promise.all([
      this.cache.delete(CacheKeys.campaignList(userId)),
      this.cache.deletePattern(`kpi:dashboard:${userId}:*`),
    ])
  }

  /**
   * Invalidate cache when quota status changes
   * Clears quota status for the user
   */
  async onQuotaChange(userId: string): Promise<void> {
    await this.cache.delete(CacheKeys.quotaStatus(userId))
  }

  /**
   * Invalidate cache after data synchronization
   * Clears all KPI, campaign, and insights data for the user
   */
  async onSync(userId: string): Promise<void> {
    await Promise.all([
      this.cache.deletePattern(`kpi:*:${userId}:*`),
      this.cache.deletePattern(`campaigns:*:${userId}`),
      this.cache.deletePattern(`insights:${userId}`),
    ])
  }
}
