import { Campaign } from '@domain/entities/Campaign'
import { AdSet } from '@domain/entities/AdSet'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import { IUsageLogRepository } from '@domain/repositories/IUsageLogRepository'
import { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { CreateCampaignDTO } from '@application/dto/campaign/CreateCampaignDTO'
import { CampaignDTO, toCampaignDTO } from '@application/dto/campaign/CampaignDTO'
import { Money } from '@domain/value-objects/Money'
import { AdvantageConfig } from '@domain/value-objects/AdvantageConfig'
import { DuplicateCampaignNameError } from './CreateCampaignUseCase'

// Advantage+ 캠페인은 3개 레버가 모두 활성화되어야 함
export class InvalidAdvantageConfigError extends Error {
  constructor() {
    super('Advantage+ campaign requires all three levers to be enabled: advantageBudget, advantageAudience, advantagePlacement')
    this.name = 'InvalidAdvantageConfigError'
  }
}

export interface AdvantageCampaignResult {
  campaign: CampaignDTO
  adSetId: string
}

export class CreateAdvantageCampaignUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly adSetRepository: IAdSetRepository,
    private readonly metaAdsService: IMetaAdsService,
    private readonly usageLogRepository: IUsageLogRepository
  ) {}

  async execute(dto: CreateCampaignDTO): Promise<AdvantageCampaignResult> {
    // Advantage+ 설정 검증: 3개 레버 모두 활성화 필수
    if (!dto.advantageConfig) {
      throw new InvalidAdvantageConfigError()
    }

    const advantageConfig = AdvantageConfig.create(dto.advantageConfig)
    if (!advantageConfig.isAdvantagePlus()) {
      throw new InvalidAdvantageConfigError()
    }

    // 중복 이름 체크
    const exists = await this.campaignRepository.existsByNameAndUserId(
      dto.name,
      dto.userId
    )
    if (exists) {
      throw new DuplicateCampaignNameError(dto.name)
    }

    // Advantage+ 캠페인 엔티티 생성
    const campaign = Campaign.create({
      userId: dto.userId,
      name: dto.name,
      objective: dto.objective,
      dailyBudget: Money.create(dto.dailyBudget, dto.currency),
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      targetAudience: dto.targetAudience,
      buyingType: 'AUCTION',
      advantageConfig,
    })

    let finalCampaign = campaign

    // Meta API 동기화
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
          }
        )
        finalCampaign = campaign.setMetaCampaignId(metaCampaign.id)
      } catch (error) {
        console.warn('[CreateAdvantageCampaign] Meta API sync failed:', error instanceof Error ? error.message : error)
      }
    }

    // 캠페인 저장
    const savedCampaign = await this.campaignRepository.save(finalCampaign)

    // Advantage+ 모드: 단일 AdSet 자동 생성
    const adSet = AdSet.create({
      campaignId: savedCampaign.id,
      name: `${dto.name} - Advantage+ AdSet`,
      dailyBudget: Money.create(dto.dailyBudget, dto.currency),
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    })
    const savedAdSet = await this.adSetRepository.save(adSet)

    // 사용량 기록
    await this.usageLogRepository.log(dto.userId, 'CAMPAIGN_CREATE')

    return {
      campaign: toCampaignDTO(savedCampaign),
      adSetId: savedAdSet.id,
    }
  }
}
