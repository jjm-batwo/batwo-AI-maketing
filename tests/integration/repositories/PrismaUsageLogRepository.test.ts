import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaUsageLogRepository } from '@infrastructure/database/repositories/PrismaUsageLogRepository'

describe('PrismaUsageLogRepository', () => {
  setupIntegrationTest()

  let repository: PrismaUsageLogRepository
  let testUserId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    repository = new PrismaUsageLogRepository(prisma)

    const user = await createTestUser()
    testUserId = user.id
  })

  describe('log', () => {
    it('should log usage event', async () => {
      await repository.log(testUserId, 'CAMPAIGN_CREATE')

      const count = await repository.countByPeriod(testUserId, 'CAMPAIGN_CREATE', 'day')
      expect(count).toBe(1)
    })
  })

  describe('countByPeriod', () => {
    it('should count usage by type and day period', async () => {
      await repository.log(testUserId, 'AI_COPY_GEN')
      await repository.log(testUserId, 'AI_COPY_GEN')
      await repository.log(testUserId, 'AI_COPY_GEN')

      const count = await repository.countByPeriod(testUserId, 'AI_COPY_GEN', 'day')

      expect(count).toBe(3)
    })

    it('should count usage by type and week period', async () => {
      await repository.log(testUserId, 'CAMPAIGN_CREATE')
      await repository.log(testUserId, 'CAMPAIGN_CREATE')

      const count = await repository.countByPeriod(testUserId, 'CAMPAIGN_CREATE', 'week')

      expect(count).toBe(2)
    })

    it('should not count different usage types', async () => {
      await repository.log(testUserId, 'CAMPAIGN_CREATE')
      await repository.log(testUserId, 'AI_COPY_GEN')

      const campaignCount = await repository.countByPeriod(testUserId, 'CAMPAIGN_CREATE', 'day')
      const aiCount = await repository.countByPeriod(testUserId, 'AI_COPY_GEN', 'day')

      expect(campaignCount).toBe(1)
      expect(aiCount).toBe(1)
    })

    it('should return 0 for user with no logs', async () => {
      const count = await repository.countByPeriod('other-user-id', 'CAMPAIGN_CREATE', 'day')

      expect(count).toBe(0)
    })
  })

  describe('findByUserAndDateRange', () => {
    it('should find logs within date range', async () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      await repository.log(testUserId, 'CAMPAIGN_CREATE')
      await repository.log(testUserId, 'AI_ANALYSIS')

      // Capture 'now' after creating logs to ensure they're included in the range
      const now = new Date(Date.now() + 1000) // Add 1 second buffer

      const logs = await repository.findByUserAndDateRange(testUserId, weekAgo, now)

      expect(logs).toHaveLength(2)
      expect(logs.every(log => log.userId === testUserId)).toBe(true)
    })

    it('should return empty array for date range with no logs', async () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

      await repository.log(testUserId, 'CAMPAIGN_CREATE')

      const logs = await repository.findByUserAndDateRange(testUserId, twoDaysAgo, yesterday)

      expect(logs).toHaveLength(0)
    })
  })

  describe('deleteOlderThan', () => {
    it('should delete logs older than specified date', async () => {
      const prisma = getPrismaClient()

      // Insert a log with an old date directly
      const oldDate = new Date()
      oldDate.setDate(oldDate.getDate() - 30)

      await prisma.usageLog.create({
        data: {
          userId: testUserId,
          type: 'CAMPAIGN_CREATE',
          createdAt: oldDate,
        },
      })

      // Insert a recent log
      await repository.log(testUserId, 'CAMPAIGN_CREATE')

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - 7)

      const deletedCount = await repository.deleteOlderThan(cutoffDate)

      expect(deletedCount).toBe(1)

      // Verify only recent log remains
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const logs = await repository.findByUserAndDateRange(testUserId, weekAgo, now)
      expect(logs).toHaveLength(1)
    })
  })
})
