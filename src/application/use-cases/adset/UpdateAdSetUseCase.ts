import { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import { AdSetDTO, toAdSetDTO } from '@application/dto/adset/AdSetDTO'
import { Money, Currency } from '@domain/value-objects/Money'
import { AdSetStatus } from '@domain/value-objects/AdSetStatus'

export class AdSetNotFoundError extends Error {
  constructor(id: string) {
    super(`AdSet with id "${id}" not found`)
    this.name = 'AdSetNotFoundError'
  }
}

export interface UpdateAdSetDTO {
  id: string
  name?: string
  dailyBudget?: number
  lifetimeBudget?: number
  currency?: string
  status?: string
  targeting?: Record<string, unknown>
}

export class UpdateAdSetUseCase {
  constructor(
    private readonly adSetRepository: IAdSetRepository
  ) {}

  async execute(dto: UpdateAdSetDTO): Promise<AdSetDTO> {
    const adSet = await this.adSetRepository.findById(dto.id)
    if (!adSet) {
      throw new AdSetNotFoundError(dto.id)
    }

    let updated = adSet

    // 상태 변경
    if (dto.status) {
      updated = updated.changeStatus(dto.status as AdSetStatus)
    }

    // 예산 변경
    if (dto.dailyBudget !== undefined || dto.lifetimeBudget !== undefined) {
      const currency = (dto.currency ?? adSet.currency ?? 'KRW') as Currency
      const budgetUpdate: { dailyBudget?: Money; lifetimeBudget?: Money } = {}
      if (dto.dailyBudget !== undefined) {
        budgetUpdate.dailyBudget = Money.create(dto.dailyBudget, currency)
      }
      if (dto.lifetimeBudget !== undefined) {
        budgetUpdate.lifetimeBudget = Money.create(dto.lifetimeBudget, currency)
      }
      updated = updated.updateBudget(budgetUpdate)
    }

    // 타겟팅 변경
    if (dto.targeting) {
      updated = updated.updateTargeting(dto.targeting)
    }

    const saved = await this.adSetRepository.update(updated)

    return toAdSetDTO(saved)
  }
}
