import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PrismaInsightHistoryRepository } from '@infrastructure/database/repositories/PrismaInsightHistoryRepository'
import type { SaveInsightHistoryDTO } from '@domain/repositories/IInsightHistoryRepository'

// Mock PrismaClient
function createMockPrisma() {
  return {
    insightHistory: {
      create: vi.fn().mockResolvedValue({ id: 'test-id' }),
      findMany: vi.fn().mockResolvedValue([]),
    },
  } as unknown as import('@/generated/prisma').PrismaClient
}

describe('PrismaInsightHistoryRepository', () => {
  let repo: PrismaInsightHistoryRepository
  let mockPrisma: ReturnType<typeof createMockPrisma>

  beforeEach(() => {
    mockPrisma = createMockPrisma()
    repo = new PrismaInsightHistoryRepository(mockPrisma)
  })

  describe('save', () => {
    it('should_save_insight_history_with_all_fields', async () => {
      const dto: SaveInsightHistoryDTO = {
        userId: 'user-1',
        campaignId: 'campaign-1',
        category: 'budget',
        priority: 'critical',
        title: '예산 소진 임박',
        description: 'Campaign A의 일일 예산 90% 소진',
        rootCause: '입찰가 상승으로 인한 비용 증가',
        metadata: {
          recommendations: ['예산 증액', '입찰가 조정'],
          forecast: { direction: 'declining', confidence: 80, reasoning: '추세 지속' },
        },
      }

      await repo.save(dto)

      expect(mockPrisma.insightHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          campaignId: 'campaign-1',
          category: 'budget',
          priority: 'critical',
          title: '예산 소진 임박',
          description: 'Campaign A의 일일 예산 90% 소진',
          rootCause: '입찰가 상승으로 인한 비용 증가',
          metadata: {
            recommendations: ['예산 증액', '입찰가 조정'],
            forecast: { direction: 'declining', confidence: 80, reasoning: '추세 지속' },
          },
        },
      })
    })

    it('should_save_insight_history_with_optional_fields_as_null', async () => {
      const dto: SaveInsightHistoryDTO = {
        userId: 'user-1',
        category: 'performance',
        priority: 'medium',
        title: '지출 증가',
        description: '오늘 지출이 어제 대비 30% 증가',
      }

      await repo.save(dto)

      expect(mockPrisma.insightHistory.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          campaignId: null,
          category: 'performance',
          priority: 'medium',
          title: '지출 증가',
          description: '오늘 지출이 어제 대비 30% 증가',
          rootCause: null,
          metadata: undefined,
        },
      })
    })

    it('should_propagate_prisma_error_on_save_failure', async () => {
      ;(mockPrisma.insightHistory.create as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('DB connection failed')
      )

      const dto: SaveInsightHistoryDTO = {
        userId: 'user-1',
        category: 'warning',
        priority: 'high',
        title: 'Test',
        description: 'Test description',
      }

      await expect(repo.save(dto)).rejects.toThrow('DB connection failed')
    })
  })

  describe('findByUserId', () => {
    it('should_return_records_for_given_user', async () => {
      const mockRecords = [
        {
          id: 'ih-1',
          userId: 'user-1',
          campaignId: 'campaign-1',
          category: 'budget',
          priority: 'critical',
          title: '예산 소진',
          description: '테스트',
          rootCause: '원인',
          metadata: { recommendations: ['액션1'] },
          createdAt: new Date('2026-01-01'),
        },
        {
          id: 'ih-2',
          userId: 'user-1',
          campaignId: null,
          category: 'warning',
          priority: 'medium',
          title: '경고',
          description: '설명',
          rootCause: null,
          metadata: null,
          createdAt: new Date('2026-01-02'),
        },
      ]
      ;(mockPrisma.insightHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockRecords
      )

      const result = await repo.findByUserId('user-1')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        id: 'ih-1',
        userId: 'user-1',
        campaignId: 'campaign-1',
        category: 'budget',
        priority: 'critical',
        title: '예산 소진',
        description: '테스트',
        rootCause: '원인',
        metadata: { recommendations: ['액션1'] },
        createdAt: new Date('2026-01-01'),
      })
      // null → undefined mapping
      expect(result[1].campaignId).toBeUndefined()
      expect(result[1].rootCause).toBeUndefined()
      expect(result[1].metadata).toBeUndefined()
    })

    it('should_use_default_limit_of_50', async () => {
      await repo.findByUserId('user-1')

      expect(mockPrisma.insightHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 50,
      })
    })

    it('should_respect_custom_limit', async () => {
      await repo.findByUserId('user-1', 10)

      expect(mockPrisma.insightHistory.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      })
    })

    it('should_return_empty_array_when_no_records', async () => {
      ;(mockPrisma.insightHistory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])

      const result = await repo.findByUserId('user-no-data')

      expect(result).toEqual([])
    })
  })
})
