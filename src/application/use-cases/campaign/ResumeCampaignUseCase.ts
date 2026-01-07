import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { CampaignDTO, toCampaignDTO } from '@application/dto/campaign/CampaignDTO'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignNotFoundError, UnauthorizedCampaignAccessError } from './UpdateCampaignUseCase'

export interface ResumeCampaignDTO {
  campaignId: string
  userId: string
  syncToMeta?: boolean
  accessToken?: string
}

export class ResumeCampaignError extends Error {
  constructor(campaignId: string, currentStatus: CampaignStatus) {
    super(`Cannot resume campaign "${campaignId}" with status "${currentStatus}". Only PAUSED or ACTIVE campaigns can be resumed.`)
    this.name = 'ResumeCampaignError'
  }
}

export class ResumeCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService
  ) {}

  async execute(dto: ResumeCampaignDTO): Promise<CampaignDTO> {
    // Find the campaign
    const campaign = await this.campaignRepository.findById(dto.campaignId)
    if (!campaign) {
      throw new CampaignNotFoundError(dto.campaignId)
    }

    // Check authorization
    if (campaign.userId !== dto.userId) {
      throw new UnauthorizedCampaignAccessError(dto.campaignId, dto.userId)
    }

    // If already active, just return
    if (campaign.status === CampaignStatus.ACTIVE) {
      return toCampaignDTO(campaign)
    }

    // Only PAUSED campaigns can be resumed
    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new ResumeCampaignError(dto.campaignId, campaign.status)
    }

    // Change status to ACTIVE
    const activeCampaign = campaign.changeStatus(CampaignStatus.ACTIVE)

    // Sync to Meta Ads if requested and has metaCampaignId
    if (dto.syncToMeta && dto.accessToken && campaign.metaCampaignId) {
      await this.metaAdsService.updateCampaignStatus(
        dto.accessToken,
        campaign.metaCampaignId,
        'ACTIVE'
      )
    }

    // Save to repository
    const savedCampaign = await this.campaignRepository.update(activeCampaign)

    return toCampaignDTO(savedCampaign)
  }
}
