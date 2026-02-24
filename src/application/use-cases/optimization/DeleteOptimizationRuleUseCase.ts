/**
 * DeleteOptimizationRuleUseCase
 *
 * 자동 최적화 규칙을 삭제하는 유스케이스.
 */
import { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'
import {
  OptimizationRuleNotFoundError,
  UnauthorizedOptimizationRuleError,
} from './UpdateOptimizationRuleUseCase'

export interface DeleteOptimizationRuleDTO {
  ruleId: string
  userId: string
}

export class DeleteOptimizationRuleUseCase {
  constructor(
    private readonly ruleRepository: IOptimizationRuleRepository
  ) {}

  async execute(dto: DeleteOptimizationRuleDTO): Promise<void> {
    const rule = await this.ruleRepository.findById(dto.ruleId)
    if (!rule) throw new OptimizationRuleNotFoundError(dto.ruleId)
    if (rule.userId !== dto.userId) throw new UnauthorizedOptimizationRuleError(dto.ruleId, dto.userId)

    await this.ruleRepository.delete(dto.ruleId)
  }
}
