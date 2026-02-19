import { AdSet } from '@domain/entities/AdSet'
import { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import { CreateAdSetDTO } from '@application/dto/adset/CreateAdSetDTO'
import { AdSetDTO, toAdSetDTO } from '@application/dto/adset/AdSetDTO'
import { Money, Currency } from '@domain/value-objects/Money'
import { BillingEvent } from '@domain/value-objects/BillingEvent'
import { OptimizationGoal } from '@domain/value-objects/OptimizationGoal'
import { BidStrategy } from '@domain/value-objects/BidStrategy'

export class CampaignNotFoundError extends Error {
  constructor(campaignId: string) {
    super(`Campaign with id "${campaignId}" not found`)
    this.name = 'CampaignNotFoundError'
  }
}

export class CreateAdSetUseCase {
  constructor(
    private readonly campaignRepository: ICampaignRepository,
    private readonly adSetRepository: IAdSetRepository
  ) {}

  async execute(dto: CreateAdSetDTO): Promise<AdSetDTO> {
    // 캠페인 존재 확인
    const campaign = await this.campaignRepository.findById(dto.campaignId)
    if (!campaign) {
      throw new CampaignNotFoundError(dto.campaignId)
    }

    const currency = (dto.currency ?? 'KRW') as Currency

    // AdSet 엔티티 생성
    const adSet = AdSet.create({
      campaignId: dto.campaignId,
      name: dto.name,
      dailyBudget: dto.dailyBudget ? Money.create(dto.dailyBudget, currency) : undefined,
      lifetimeBudget: dto.lifetimeBudget ? Money.create(dto.lifetimeBudget, currency) : undefined,
      currency: dto.currency,
      billingEvent: dto.billingEvent as BillingEvent | undefined,
      optimizationGoal: dto.optimizationGoal as OptimizationGoal | undefined,
      bidStrategy: dto.bidStrategy as BidStrategy | undefined,
      targeting: dto.targeting,
      placements: dto.placements,
      schedule: dto.schedule,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    })

    // DB 저장
    const saved = await this.adSetRepository.save(adSet)

    return toAdSetDTO(saved)
  }
}
