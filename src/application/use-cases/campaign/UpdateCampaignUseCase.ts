import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { UpdateCampaignDTO } from '@application/dto/campaign/UpdateCampaignDTO'
import { CampaignDTO, toCampaignDTO } from '@application/dto/campaign/CampaignDTO'
import { Money } from '@domain/value-objects/Money'
import { DuplicateCampaignNameError } from './CreateCampaignUseCase'

export class CampaignNotFoundError extends Error {
  constructor(campaignId: string) {
    super(`Campaign with ID "${campaignId}" not found`)
    this.name = 'CampaignNotFoundError'
  }
}

export class UnauthorizedCampaignAccessError extends Error {
  constructor(campaignId: string, userId: string) {
    super(`User "${userId}" is not authorized to access campaign "${campaignId}"`)
    this.name = 'UnauthorizedCampaignAccessError'
  }
}

export class UpdateCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService
  ) {}

  async execute(dto: UpdateCampaignDTO): Promise<CampaignDTO> {
    // Find the campaign
    const campaign = await this.campaignRepository.findById(dto.campaignId)
    if (!campaign) {
      throw new CampaignNotFoundError(dto.campaignId)
    }

    // Check authorization
    if (campaign.userId !== dto.userId) {
      throw new UnauthorizedCampaignAccessError(dto.campaignId, dto.userId)
    }

    // Check for duplicate name if name is being changed
    if (dto.name !== undefined && dto.name !== campaign.name) {
      const exists = await this.campaignRepository.existsByNameAndUserId(
        dto.name,
        dto.userId,
        dto.campaignId
      )
      if (exists) {
        throw new DuplicateCampaignNameError(dto.name)
      }
    }

    // Status change (separate domain operation from field update)
    let campaignToUpdate = campaign
    if (dto.status !== undefined && dto.status !== campaign.status) {
      campaignToUpdate = campaign.changeStatus(dto.status)
    }

    // Prepare update props
    const updateProps: Parameters<typeof campaignToUpdate.update>[0] = {}

    if (dto.name !== undefined) {
      updateProps.name = dto.name
    }

    if (dto.dailyBudget !== undefined && dto.currency !== undefined) {
      updateProps.dailyBudget = Money.create(dto.dailyBudget, dto.currency)
    }

    if (dto.startDate !== undefined) {
      updateProps.startDate = new Date(dto.startDate)
    }

    if (dto.endDate !== undefined) {
      updateProps.endDate = dto.endDate === null ? null : new Date(dto.endDate)
    }

    if (dto.targetAudience !== undefined) {
      updateProps.targetAudience = dto.targetAudience
    }

    // Update the campaign entity (only if there are field updates)
    const hasFieldUpdates = Object.keys(updateProps).length > 0
    const updatedCampaign = hasFieldUpdates
      ? campaignToUpdate.update(updateProps)
      : campaignToUpdate

    // Sync to Meta Ads if requested and has metaCampaignId
    if (dto.syncToMeta && dto.accessToken && campaign.metaCampaignId) {
      await this.metaAdsService.updateCampaign(dto.accessToken, campaign.metaCampaignId, {
        name: dto.name,
        dailyBudget: dto.dailyBudget,
        status: dto.status === 'ACTIVE' || dto.status === 'PAUSED' ? dto.status : undefined,
        endTime: dto.endDate === null ? null : dto.endDate ? new Date(dto.endDate) : undefined,
      })
    }

    // Save to repository
    const savedCampaign = await this.campaignRepository.update(updatedCampaign)

    return toCampaignDTO(savedCampaign)
  }
}
