/**
 * 🔴 RED Phase: Quota API Integration Tests
 *
 * These tests verify that Quota API works correctly with QuotaService and database.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { setupIntegrationTest, getPrismaClient, createTestUser } from '../setup'
import { PrismaUsageLogRepository } from '@infrastructure/database/repositories/PrismaUsageLogRepository'
import { QuotaService } from '@application/services/QuotaService'
import type { UsageType } from '@domain/repositories/IUsageLogRepository'

describe('Quota API Integration', () => {
  setupIntegrationTest()

  let usageLogRepository: PrismaUsageLogRepository
  let quotaService: QuotaService
  let testUserId: string

  beforeEach(async () => {
    const prisma = getPrismaClient()
    usageLogRepository = new PrismaUsageLogRepository(prisma)
    quotaService = new QuotaService(usageLogRepository)

    const user = await createTestUser()
    testUserId = user.id
  })

  const logUsage = async (type: UsageType, count: number) => {
    for (let i = 0; i < count; i++) {
      await usageLogRepository.log(testUserId, type)
    }
  }

  describe('사용량 조회 (GET /api/quota)', () => {
    it('사용량 0인 상태에서 전체 쿼터를 반환해야 함', async () => {
      // Given: 사용량 없음

      // When: 쿼터 조회
      const quota = await quotaService.getRemainingQuota(testUserId)

      // Then: 모든 쿼터 타입에 대해 used=0, remaining=limit
      expect(quota.CAMPAIGN_CREATE.used).toBe(0)
      expect(quota.CAMPAIGN_CREATE.limit).toBe(5)
      expect(quota.CAMPAIGN_CREATE.remaining).toBe(5)
      expect(quota.CAMPAIGN_CREATE.period).toBe('week')

      expect(quota.AI_COPY_GEN.used).toBe(0)
      expect(quota.AI_COPY_GEN.limit).toBe(20)
      expect(quota.AI_COPY_GEN.remaining).toBe(20)
      expect(quota.AI_COPY_GEN.period).toBe('day')

      expect(quota.AI_ANALYSIS.used).toBe(0)
      expect(quota.AI_ANALYSIS.limit).toBe(5)
      expect(quota.AI_ANALYSIS.remaining).toBe(5)
      expect(quota.AI_ANALYSIS.period).toBe('week')
    })

    it('사용량이 있는 상태에서 정확한 remaining 값을 반환해야 함', async () => {
      // Given: 일부 사용량 존재
      await logUsage('CAMPAIGN_CREATE', 2)
      await logUsage('AI_COPY_GEN', 5)
      await logUsage('AI_ANALYSIS', 3)

      // When: 쿼터 조회
      const quota = await quotaService.getRemainingQuota(testUserId)

      // Then: used와 remaining이 정확함
      expect(quota.CAMPAIGN_CREATE.used).toBe(2)
      expect(quota.CAMPAIGN_CREATE.remaining).toBe(3)

      expect(quota.AI_COPY_GEN.used).toBe(5)
      expect(quota.AI_COPY_GEN.remaining).toBe(15)

      expect(quota.AI_ANALYSIS.used).toBe(3)
      expect(quota.AI_ANALYSIS.remaining).toBe(2)
    })

    it('쿼터 한도 초과 시 remaining이 0이어야 함', async () => {
      // Given: 한도 초과 사용량
      await logUsage('AI_ANALYSIS', 7) // limit is 5

      // When: 쿼터 조회
      const quota = await quotaService.getRemainingQuota(testUserId)

      // Then: remaining은 0 (음수 아님)
      expect(quota.AI_ANALYSIS.used).toBe(7)
      expect(quota.AI_ANALYSIS.remaining).toBe(0)
    })
  })

  describe('쿼터 검사 및 적용', () => {
    it('쿼터가 남아있으면 checkQuota가 true를 반환해야 함', async () => {
      // Given: 사용량 없음

      // When/Then: 쿼터 있음
      expect(await quotaService.checkQuota(testUserId, 'CAMPAIGN_CREATE')).toBe(true)
      expect(await quotaService.checkQuota(testUserId, 'AI_COPY_GEN')).toBe(true)
      expect(await quotaService.checkQuota(testUserId, 'AI_ANALYSIS')).toBe(true)
    })

    it('쿼터가 소진되면 checkQuota가 false를 반환해야 함', async () => {
      // Given: 쿼터 소진
      await logUsage('CAMPAIGN_CREATE', 5) // exactly at limit

      // When/Then: 쿼터 없음
      expect(await quotaService.checkQuota(testUserId, 'CAMPAIGN_CREATE')).toBe(false)
    })

    it('쿼터 초과 시 enforceQuota가 에러를 던져야 함', async () => {
      // Given: 쿼터 소진
      await logUsage('AI_ANALYSIS', 5)

      // When/Then: 에러 발생
      await expect(quotaService.enforceQuota(testUserId, 'AI_ANALYSIS'))
        .rejects.toThrow('Quota exceeded')
    })
  })

  describe('사용량 로깅', () => {
    it('사용량 로그가 정확하게 기록되어야 함', async () => {
      // Given: 초기 상태
      const before = await quotaService.getRemainingQuota(testUserId)
      expect(before.AI_COPY_GEN.used).toBe(0)

      // When: 사용량 로깅
      await quotaService.logUsage(testUserId, 'AI_COPY_GEN')
      await quotaService.logUsage(testUserId, 'AI_COPY_GEN')

      // Then: 사용량 증가
      const after = await quotaService.getRemainingQuota(testUserId)
      expect(after.AI_COPY_GEN.used).toBe(2)
      expect(after.AI_COPY_GEN.remaining).toBe(18)
    })
  })

  describe('다른 사용자와 격리', () => {
    it('다른 사용자의 사용량은 서로 영향을 주지 않아야 함', async () => {
      // Given: 두 명의 사용자
      const otherUser = await createTestUser({ email: 'other@example.com' })

      // 각 사용자가 다른 양의 사용량 기록
      await logUsage('CAMPAIGN_CREATE', 3) // testUserId
      for (let i = 0; i < 1; i++) {
        await usageLogRepository.log(otherUser.id, 'CAMPAIGN_CREATE')
      }

      // When: 각 사용자의 쿼터 조회
      const myQuota = await quotaService.getRemainingQuota(testUserId)
      const otherQuota = await quotaService.getRemainingQuota(otherUser.id)

      // Then: 각자의 사용량만 반영
      expect(myQuota.CAMPAIGN_CREATE.used).toBe(3)
      expect(myQuota.CAMPAIGN_CREATE.remaining).toBe(2)

      expect(otherQuota.CAMPAIGN_CREATE.used).toBe(1)
      expect(otherQuota.CAMPAIGN_CREATE.remaining).toBe(4)
    })
  })
})
