import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BulkUpdateCampaignsUseCase } from '@/application/use-cases/campaign/BulkUpdateCampaignsUseCase';
import { CampaignStatus } from '@/domain/value-objects/CampaignStatus';
import { Money } from '@/domain/value-objects/Money';
import { Campaign } from '@/domain/entities/Campaign';
import { CampaignObjective } from '@/domain/value-objects/CampaignObjective';

describe('BulkUpdateCampaignsUseCase', () => {
  let useCase: BulkUpdateCampaignsUseCase;
  let campaignRepository: any;
  let metaAdsService: any;
  let mockCampaigns: Map<string, Campaign>;

  beforeEach(() => {
    mockCampaigns = new Map();
    
    campaignRepository = {
      findById: vi.fn(async (id: string) => mockCampaigns.get(id) || null),
      update: vi.fn(async (campaign: Campaign) => { mockCampaigns.set(campaign.id, campaign); return campaign; }),
      delete: vi.fn(async (id: string) => { mockCampaigns.delete(id); }),
    };

    metaAdsService = {};

    useCase = new BulkUpdateCampaignsUseCase(campaignRepository, metaAdsService);
  });

  const createMockCampaign = (id: string, userId: string, status: CampaignStatus, amount: number = 10000) => {
    // We can use restore for mock setup
    const now = new Date();
    const campaign = Campaign.restore({
      id,
      userId,
      name: `Test ${id}`,
      objective: 'OUTCOME_SALES' as CampaignObjective,
      status,
      dailyBudget: Money.create(amount, 'KRW'),
      startDate: now,
      createdAt: now,
      updatedAt: now,
    });
    mockCampaigns.set(id, campaign);
    return campaign;
  };

  it('should pause multiple campaigns', async () => {
    createMockCampaign('c1', 'user-123', CampaignStatus.ACTIVE);
    createMockCampaign('c2', 'user-123', CampaignStatus.ACTIVE);

    const result = await useCase.execute({
      userId: 'user-123',
      campaignIds: ['c1', 'c2'],
      action: { type: 'status_change', status: CampaignStatus.PAUSED },
    });

    expect(result.successCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(mockCampaigns.get('c1')?.status).toBe(CampaignStatus.PAUSED);
    expect(mockCampaigns.get('c2')?.status).toBe(CampaignStatus.PAUSED);
  });

  it('should handle partial failures gracefully', async () => {
    createMockCampaign('c1', 'user-123', CampaignStatus.ACTIVE);
    createMockCampaign('c2', 'user-other', CampaignStatus.ACTIVE); // Different user

    const result = await useCase.execute({
      userId: 'user-123',
      campaignIds: ['c1', 'c2'],
      action: { type: 'status_change', status: CampaignStatus.PAUSED },
    });

    expect(result.successCount).toBe(1);
    expect(result.failedCount).toBe(1);
    expect(result.failures[0].campaignId).toBe('c2');
  });

  it('should reject more than 50 campaigns', async () => {
    const ids = Array.from({ length: 51 }, (_, i) => `c${i}`);
    await expect(useCase.execute({
      userId: 'user-123',
      campaignIds: ids,
      action: { type: 'status_change', status: CampaignStatus.PAUSED },
    })).rejects.toThrow('최대 50개');
  });

  it('should change budget by percentage', async () => {
    createMockCampaign('c1', 'user-123', CampaignStatus.ACTIVE, 100000);

    const result = await useCase.execute({
      userId: 'user-123',
      campaignIds: ['c1'],
      action: { type: 'budget_change', mode: 'percentage', value: 20 }, // +20%
    });

    expect(result.successCount).toBe(1);
    expect(mockCampaigns.get('c1')?.dailyBudget.amount).toBe(120000);
  });
});
