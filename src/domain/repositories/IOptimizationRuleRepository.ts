/**
 * IOptimizationRuleRepository 포트 인터페이스
 *
 * 자동 최적화 규칙 영속성 추상화.
 * 구현체는 infrastructure 레이어에 위치.
 */
import { OptimizationRule } from '../entities/OptimizationRule'

export interface IOptimizationRuleRepository {
  save(rule: OptimizationRule): Promise<OptimizationRule>
  findById(id: string): Promise<OptimizationRule | null>
  findByCampaignId(campaignId: string): Promise<OptimizationRule[]>
  findByUserId(userId: string): Promise<OptimizationRule[]>
  findEnabledRules(): Promise<OptimizationRule[]>
  findEnabledByCampaignId(campaignId: string): Promise<OptimizationRule[]>
  delete(id: string): Promise<void>
  deleteByCampaignId(campaignId: string): Promise<void>
}
