import { Campaign } from '@domain/entities/Campaign'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { CreateCampaignDTO } from '@application/dto/campaign/CreateCampaignDTO'
import { CampaignDTO, toCampaignDTO } from '@application/dto/campaign/CampaignDTO'
import { Money } from '@domain/value-objects/Money'

export class DuplicateCampaignNameError extends Error {
  constructor(name: string) {
    super(`Campaign with name "${name}" already exists`)
    this.name = 'DuplicateCampaignNameError'
  }
}

export class CreateCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly metaAdsService: IMetaAdsService,
    private readonly usageLogRepository: IUsageLogRepository
  ) {}

  async execute(dto: CreateCampaignDTO): Promise<CampaignDTO> {
    // Check for duplicate name
    const exists = await this.campaignRepository.existsByNameAndUserId(
      dto.name,
      dto.userId
    )
    if (exists) {
      throw new DuplicateCampaignNameError(dto.name)
    }

    // Create campaign entity
    const campaign = Campaign.create({
      userId: dto.userId,
      name: dto.name,
      objective: dto.objective,
      dailyBudget: Money.create(dto.dailyBudget, dto.currency),
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      targetAudience: dto.targetAudience,
    })

    let finalCampaign = campaign

    // Sync to Meta Ads if requested
    if (dto.syncToMeta && dto.accessToken && dto.adAccountId) {
      try {
        const metaCampaign = await this.metaAdsService.createCampaign(
          dto.accessToken,
          dto.adAccountId,
          {
            name: dto.name,
            objective: dto.objective,
            dailyBudget: dto.dailyBudget,
            currency: dto.currency,
            startTime: new Date(dto.startDate),
            endTime: dto.endDate ? new Date(dto.endDate) : undefined,
            targeting: dto.targetAudience
              ? {
                  ageMin: dto.targetAudience.ageMin,
                  ageMax: dto.targetAudience.ageMax,
                  genders: dto.targetAudience.genders?.map((g) =>
                    g === 'male' ? 1 : g === 'female' ? 2 : 0
                  ),
                  geoLocations: { cities: dto.targetAudience.locations },
                  interests: dto.targetAudience.interests,
                }
              : undefined,
          }
        )
        finalCampaign = campaign.setMetaCampaignId(metaCampaign.id)
      } catch (error) {
        // In mock mode or on Meta API failure, save campaign without Meta sync
        console.warn('[CreateCampaign] Meta API sync failed, saving campaign without metaCampaignId:', error instanceof Error ? error.message : error)
        // Continue - campaign will be saved to DB without metaCampaignId
      }
    }

    // Save to repository
    const savedCampaign = await this.campaignRepository.save(finalCampaign)

    // Log usage
    await this.usageLogRepository.log(dto.userId, 'CAMPAIGN_CREATE')

    return toCampaignDTO(savedCampaign)
  }
}
