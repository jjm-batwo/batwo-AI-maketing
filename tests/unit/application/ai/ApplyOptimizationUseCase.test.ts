import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { ApplyOptimizationUseCase } from '@/application/use-cases/ai/ApplyOptimizationUseCase'
import { IPendingActionRepository } from '@/domain/repositories/IPendingActionRepository'
import { ICampaignRepository } from '@/domain/repositories/ICampaignRepository'
import { IConversationRepository } from '@/domain/repositories/IConversationRepository'
import { Campaign } from '@/domain/entities/Campaign'
import { Money } from '@/domain/value-objects/Money'
import { ApplyAction } from '@/domain/value-objects/ApplyAction'

describe('ApplyOptimizationUseCase', () => {
  let useCase: ApplyOptimizationUseCase
  let pendingActionRepo: Mock & IPendingActionRepository
  let campaignRepo: Mock & ICampaignRepository
  let conversationRepo: Mock & IConversationRepository

  beforeEach(() => {
    pendingActionRepo = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn(),
      findByConversationId: vi.fn(),
      delete: vi.fn(),
      findExpiredActions: vi.fn(),
    } as unknown as Mock & IPendingActionRepository

    campaignRepo = {
      findById: vi.fn().mockResolvedValue(
        Campaign.create({
          userId: 'user-123',
          adAccountId: 'act_123',
          name: 'Test Campaign',
          objective: 'OUTCOME_TRAFFIC',
          dailyBudget: Money.create(50000, 'KRW'),
          platformCampaignId: '12345',
        })
      ),
      findByUserId: vi.fn(),
      findByAdAccountId: vi.fn(),
      save: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    } as unknown as Mock & ICampaignRepository

    conversationRepo = {} as unknown as Mock & IConversationRepository

    useCase = new ApplyOptimizationUseCase(pendingActionRepo, campaignRepo, conversationRepo)
  })

  it('should create PendingAction and return confirmation data', async () => {
    const action: ApplyAction = {
      type: 'budget_change',
      campaignId: 'camp-1',
      description: '일일 예산 50,000원 → 60,000원',
      currentValue: 50000,
      suggestedValue: 60000,
      expectedImpact: 'ROAS +12% 예상',
      confidence: 0.8,
    }

    const result = await useCase.execute({
      userId: 'user-123',
      action,
    })

    expect(result.pendingActionId).toBeDefined()
    expect(result.requiresConfirmation).toBe(true)
    expect(result.details).toContainEqual(
      expect.objectContaining({ label: '일일 예산', value: '50000 → 60000', changed: true })
    )
    expect(pendingActionRepo.save).toHaveBeenCalled()
  })

  it('should add warnings when budget increase is over 50%', async () => {
    const action: ApplyAction = {
      type: 'budget_change',
      campaignId: 'camp-1',
      description: '일일 예산 50,000원 → 100,000원',
      currentValue: 50000,
      suggestedValue: 100000,
      expectedImpact: 'ROAS +12% 예상',
      confidence: 0.8,
    }

    const result = await useCase.execute({
      userId: 'user-123',
      action,
    })

    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0]).toContain('50% 이상')
  })

  it('should throw Error if campaign ownership mismatch', async () => {
    const action: ApplyAction = {
      type: 'budget_change',
      campaignId: 'camp-1',
      description: '일일 예산 변경',
      currentValue: 50000,
      suggestedValue: 60000,
      expectedImpact: 'ROAS +12% 예상',
      confidence: 0.8,
    }

    await expect(useCase.execute({
      userId: 'wrong-user',
      action,
    })).rejects.toThrow('캠페인을 찾을 수 없습니다')
  })
})
