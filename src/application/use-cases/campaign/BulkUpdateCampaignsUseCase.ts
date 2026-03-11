import { Campaign } from '@/domain/entities/Campaign';
import { CampaignStatus } from '@/domain/value-objects/CampaignStatus';
import { Money } from '@/domain/value-objects/Money';
import { ICampaignRepository } from '@/domain/repositories/ICampaignRepository';
import { IMetaAdsService } from '@/application/ports/IMetaAdsService';

export type BulkAction =
  | { type: 'status_change'; status: CampaignStatus }
  | { type: 'budget_change'; mode: 'absolute' | 'percentage'; value: number }
  | { type: 'delete' };

export interface BulkUpdateDTO {
  userId: string;
  campaignIds: string[];
  action: BulkAction;
}

export interface BulkUpdateResult {
  successCount: number;
  failedCount: number;
  failures: { campaignId: string; reason: string }[];
}

export class BulkUpdateCampaignsUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService,
  ) {}

  async execute(dto: BulkUpdateDTO): Promise<BulkUpdateResult> {
    if (dto.campaignIds.length > 50) {
      throw new Error('최대 50개의 캠페인만 동시 수정 가능합니다');
    }

    const results: BulkUpdateResult = { successCount: 0, failedCount: 0, failures: [] };

    for (const campaignId of dto.campaignIds) {
      try {
        const campaign = await this.campaignRepository.findById(campaignId);
        if (!campaign || campaign.userId !== dto.userId) {
          throw new Error('캠페인을 찾을 수 없습니다');
        }

        let updated: Campaign;
        switch (dto.action.type) {
          case 'status_change':
            updated = campaign.changeStatus(dto.action.status);
            break;
          case 'budget_change':
            const currentAmount = campaign.dailyBudget.amount;
            const newAmount = dto.action.mode === 'percentage'
              ? Math.round(currentAmount * (1 + dto.action.value / 100))
              : dto.action.value;
            updated = campaign.updateBudget(Money.create(newAmount, campaign.dailyBudget.currency));
            break;
          case 'delete':
            await this.campaignRepository.delete(campaignId);
            results.successCount++;
            continue;
        }

        await this.campaignRepository.update(updated);
        results.successCount++;
      } catch (error) {
        results.failedCount++;
        results.failures.push({
          campaignId,
          reason: error instanceof Error ? error.message : '알 수 없는 오류',
        });
      }
    }

    return results;
  }
}
