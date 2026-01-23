import { describe, it, expect, beforeEach } from 'vitest'
import { QuotaService } from '@application/services/QuotaService'
import { MockUsageLogRepository } from '@tests/mocks/repositories/MockUsageLogRepository'

describe('QuotaService', () => {
  let quotaService: QuotaService
  let usageLogRepository: MockUsageLogRepository

  beforeEach(() => {
    usageLogRepository = new MockUsageLogRepository()
    quotaService = new QuotaService(usageLogRepository)
  })

  describe('checkQuota', () => {
    it('should return true when under quota limit', async () => {
      const result = await quotaService.checkQuota('user-123', 'CAMPAIGN_CREATE')

      expect(result).toBe(true)
    })

    it('should return false when quota exceeded for CAMPAIGN_CREATE (5/week)', async () => {
      // Log 5 campaign creations
      for (let i = 0; i < 5; i++) {
        await usageLogRepository.log('user-123', 'CAMPAIGN_CREATE')
      }

      const result = await quotaService.checkQuota('user-123', 'CAMPAIGN_CREATE')

      expect(result).toBe(false)
    })

    it('should return false when quota exceeded for AI_COPY_GEN (20/day)', async () => {
      // Log 20 AI copy generations
      for (let i = 0; i < 20; i++) {
        await usageLogRepository.log('user-123', 'AI_COPY_GEN')
      }

      const result = await quotaService.checkQuota('user-123', 'AI_COPY_GEN')

      expect(result).toBe(false)
    })

    it('should return false when quota exceeded for AI_ANALYSIS (5/week)', async () => {
      // Log 5 AI analyses
      for (let i = 0; i < 5; i++) {
        await usageLogRepository.log('user-123', 'AI_ANALYSIS')
      }

      const result = await quotaService.checkQuota('user-123', 'AI_ANALYSIS')

      expect(result).toBe(false)
    })

    it('should count quotas per user independently', async () => {
      // User 1 uses all quota
      for (let i = 0; i < 5; i++) {
        await usageLogRepository.log('user-1', 'CAMPAIGN_CREATE')
      }

      // User 2 should still have quota
      const result = await quotaService.checkQuota('user-2', 'CAMPAIGN_CREATE')

      expect(result).toBe(true)
    })

    it('should count quotas per type independently', async () => {
      // Use all CAMPAIGN_CREATE quota
      for (let i = 0; i < 5; i++) {
        await usageLogRepository.log('user-123', 'CAMPAIGN_CREATE')
      }

      // AI_COPY_GEN should still have quota
      const result = await quotaService.checkQuota('user-123', 'AI_COPY_GEN')

      expect(result).toBe(true)
    })
  })

  describe('logUsage', () => {
    it('should log usage after successful action', async () => {
      await quotaService.logUsage('user-123', 'CAMPAIGN_CREATE')

      const logs = usageLogRepository.getAll()
      expect(logs.length).toBe(1)
      expect(logs[0].userId).toBe('user-123')
      expect(logs[0].type).toBe('CAMPAIGN_CREATE')
    })
  })

  describe('getRemainingQuota', () => {
    it('should return remaining quota counts', async () => {
      await usageLogRepository.log('user-123', 'CAMPAIGN_CREATE')
      await usageLogRepository.log('user-123', 'CAMPAIGN_CREATE')
      await usageLogRepository.log('user-123', 'AI_COPY_GEN')

      const result = await quotaService.getRemainingQuota('user-123')

      expect(result.CAMPAIGN_CREATE.used).toBe(2)
      expect(result.CAMPAIGN_CREATE.limit).toBe(5)
      expect(result.CAMPAIGN_CREATE.remaining).toBe(3)

      expect(result.AI_COPY_GEN.used).toBe(1)
      expect(result.AI_COPY_GEN.limit).toBe(20)
      expect(result.AI_COPY_GEN.remaining).toBe(19)

      expect(result.AI_ANALYSIS.used).toBe(0)
      expect(result.AI_ANALYSIS.limit).toBe(5)
      expect(result.AI_ANALYSIS.remaining).toBe(5)
    })

    it('should not return negative remaining quota', async () => {
      // Somehow exceed quota (shouldn't happen in practice)
      for (let i = 0; i < 7; i++) {
        await usageLogRepository.log('user-123', 'CAMPAIGN_CREATE')
      }

      const result = await quotaService.getRemainingQuota('user-123')

      expect(result.CAMPAIGN_CREATE.remaining).toBe(0)
    })
  })

  describe('enforceQuota', () => {
    it('should throw QuotaExceededError when quota is exceeded', async () => {
      for (let i = 0; i < 5; i++) {
        await usageLogRepository.log('user-123', 'CAMPAIGN_CREATE')
      }

      await expect(
        quotaService.enforceQuota('user-123', 'CAMPAIGN_CREATE')
      ).rejects.toThrow(/quota.*exceeded/i)
    })

    it('should not throw when quota is available', async () => {
      await expect(
        quotaService.enforceQuota('user-123', 'CAMPAIGN_CREATE')
      ).resolves.not.toThrow()
    })
  })

  describe('getQuotaLimits', () => {
    it('should return correct quota limits', () => {
      const limits = quotaService.getQuotaLimits()

      expect(limits.CAMPAIGN_CREATE).toEqual({ count: 5, period: 'week' })
      expect(limits.AI_COPY_GEN).toEqual({ count: 20, period: 'day' })
      expect(limits.AI_ANALYSIS).toEqual({ count: 5, period: 'week' })
    })
  })
})
