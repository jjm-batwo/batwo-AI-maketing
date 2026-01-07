import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { CampaignDTO, toCampaignDTO } from '@application/dto/campaign/CampaignDTO'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignNotFoundError, UnauthorizedCampaignAccessError } from './UpdateCampaignUseCase'

export interface PauseCampaignDTO {
  campaignId: string
  userId: string
  syncToMeta?: boolean
  accessToken?: string
}

export class PauseCampaignError extends Error {
  constructor(campaignId: string, currentStatus: CampaignStatus) {
    super(`Cannot pause campaign "${campaignId}" with status "${currentStatus}". Only ACTIVE or PAUSED campaigns can be paused.`)
    this.name = 'PauseCampaignError'
  }
}

export class PauseCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService
  ) {}

  async execute(dto: PauseCampaignDTO): Promise<CampaignDTO> {
    // Find the campaign
    const campaign = await this.campaignRepository.findById(dto.campaignId)
    if (!campaign) {
      throw new CampaignNotFoundError(dto.campaignId)
    }

    // Check authorization
    if (campaign.userId !== dto.userId) {
      throw new UnauthorizedCampaignAccessError(dto.campaignId, dto.userId)
    }

    // If already paused, just return
    if (campaign.status === CampaignStatus.PAUSED) {
      return toCampaignDTO(campaign)
    }

    // Only ACTIVE campaigns can be paused
    if (campaign.status !== CampaignStatus.ACTIVE) {
      throw new PauseCampaignError(dto.campaignId, campaign.status)
    }

    // Change status to PAUSED
    const pausedCampaign = campaign.changeStatus(CampaignStatus.PAUSED)

    // Sync to Meta Ads if requested and has metaCampaignId
    if (dto.syncToMeta && dto.accessToken && campaign.metaCampaignId) {
      await this.metaAdsService.updateCampaignStatus(
        dto.accessToken,
        campaign.metaCampaignId,
        'PAUSED'
      )
    }

    // Save to repository
    const savedCampaign = await this.campaignRepository.update(pausedCampaign)

    return toCampaignDTO(savedCampaign)
  }
}
