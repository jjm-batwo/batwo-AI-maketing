import { OptimizationRule } from '@domain/entities/OptimizationRule'
import { IOptimizationRuleRepository } from '@domain/repositories/IOptimizationRuleRepository'

/**
 * MockOptimizationRuleRepository
 *
 * 테스트용 인메모리 Map 기반 OptimizationRule 리포지토리 구현체.
 */
export class MockOptimizationRuleRepository implements IOptimizationRuleRepository {
  private rules: Map<string, OptimizationRule> = new Map()

  async save(rule: OptimizationRule): Promise<OptimizationRule> {
    this.rules.set(rule.id, rule)
    return rule
  }

  async findById(id: string): Promise<OptimizationRule | null> {
    return this.rules.get(id) ?? null
  }

  async findByCampaignId(campaignId: string): Promise<OptimizationRule[]> {
    return Array.from(this.rules.values()).filter(r => r.campaignId === campaignId)
  }

  async findByUserId(userId: string): Promise<OptimizationRule[]> {
    return Array.from(this.rules.values()).filter(r => r.userId === userId)
  }

  async findEnabledRules(): Promise<OptimizationRule[]> {
    return Array.from(this.rules.values()).filter(r => r.isEnabled)
  }

  async findEnabledByCampaignId(campaignId: string): Promise<OptimizationRule[]> {
    return Array.from(this.rules.values()).filter(
      r => r.campaignId === campaignId && r.isEnabled
    )
  }

  async delete(id: string): Promise<void> {
    this.rules.delete(id)
  }

  async deleteByCampaignId(campaignId: string): Promise<void> {
    for (const [id, rule] of this.rules.entries()) {
      if (rule.campaignId === campaignId) {
        this.rules.delete(id)
      }
    }
  }

  // 테스트 헬퍼
  clear(): void {
    this.rules.clear()
  }

  getAll(): OptimizationRule[] {
    return Array.from(this.rules.values())
  }
}
