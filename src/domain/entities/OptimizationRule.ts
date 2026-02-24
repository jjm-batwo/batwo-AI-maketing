/**
 * OptimizationRule 도메인 엔티티
 *
 * 캠페인 자동 최적화 규칙. KPI 조건을 평가하고 액션을 실행할 시점을 결정.
 * 불변성 보장 (Object.freeze), 메서드는 새 인스턴스 반환.
 */
import { KPI } from './KPI'
import { RuleCondition } from '../value-objects/RuleCondition'
import { RuleAction } from '../value-objects/RuleAction'

export type RuleType = 'CPA_THRESHOLD' | 'ROAS_FLOOR' | 'BUDGET_PACE' | 'CREATIVE_FATIGUE'

export interface OptimizationRuleProps {
  id?: string
  campaignId: string
  userId: string
  name: string
  ruleType: RuleType
  conditions: RuleCondition[]
  actions: RuleAction[]
  isEnabled: boolean
  lastTriggeredAt?: Date | null
  triggerCount?: number
  cooldownMinutes?: number
  createdAt?: Date
  updatedAt?: Date
}

interface RequiredOptimizationRuleProps {
  id: string
  campaignId: string
  userId: string
  name: string
  ruleType: RuleType
  conditions: RuleCondition[]
  actions: RuleAction[]
  isEnabled: boolean
  lastTriggeredAt: Date | null
  triggerCount: number
  cooldownMinutes: number
  createdAt: Date
  updatedAt: Date
}

export class OptimizationRule {
  readonly id: string
  readonly campaignId: string
  readonly userId: string
  readonly name: string
  readonly ruleType: RuleType
  readonly conditions: RuleCondition[]
  readonly actions: RuleAction[]
  readonly isEnabled: boolean
  readonly lastTriggeredAt: Date | null
  readonly triggerCount: number
  readonly cooldownMinutes: number
  readonly createdAt: Date
  readonly updatedAt: Date

  private constructor(props: RequiredOptimizationRuleProps) {
    this.id = props.id
    this.campaignId = props.campaignId
    this.userId = props.userId
    this.name = props.name
    this.ruleType = props.ruleType
    this.conditions = props.conditions
    this.actions = props.actions
    this.isEnabled = props.isEnabled
    this.lastTriggeredAt = props.lastTriggeredAt
    this.triggerCount = props.triggerCount
    this.cooldownMinutes = props.cooldownMinutes
    this.createdAt = props.createdAt
    this.updatedAt = props.updatedAt

    Object.freeze(this)
  }

  /** 새 OptimizationRule 인스턴스 생성 */
  static create(props: OptimizationRuleProps): OptimizationRule {
    const now = new Date()
    return new OptimizationRule({
      id: props.id ?? crypto.randomUUID(),
      campaignId: props.campaignId,
      userId: props.userId,
      name: props.name,
      ruleType: props.ruleType,
      conditions: props.conditions,
      actions: props.actions,
      isEnabled: props.isEnabled,
      lastTriggeredAt: props.lastTriggeredAt ?? null,
      triggerCount: props.triggerCount ?? 0,
      cooldownMinutes: props.cooldownMinutes ?? 60,
      createdAt: props.createdAt ?? now,
      updatedAt: props.updatedAt ?? now,
    })
  }

  /** DB에서 복원 (검증 스킵) */
  static restore(props: RequiredOptimizationRuleProps): OptimizationRule {
    return new OptimizationRule(props)
  }

  /**
   * 이커머스 기본 최적화 규칙 3개 생성
   * 1. CPA 상한: CPA > 목표 CPA 150% → 캠페인 일시중지
   * 2. ROAS 하한: ROAS < 1.0 → 예산 30% 감소
   * 3. 예산 페이싱: 일 지출 > 일 예산 120% → 알림
   */
  static ecommercePresets(campaignId: string, userId: string): OptimizationRule[] {
    const now = new Date()

    const cpaRule = OptimizationRule.create({
      campaignId,
      userId,
      name: 'CPA 상한 초과 시 일시중지',
      ruleType: 'CPA_THRESHOLD',
      conditions: [RuleCondition.create('cpa', 'gt', 15000)],
      actions: [RuleAction.pauseCampaign()],
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    })

    const roasRule = OptimizationRule.create({
      campaignId,
      userId,
      name: 'ROAS 하한 미달 시 예산 감소',
      ruleType: 'ROAS_FLOOR',
      conditions: [RuleCondition.create('roas', 'lt', 1.0)],
      actions: [RuleAction.reduceBudget(30)],
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    })

    const paceRule = OptimizationRule.create({
      campaignId,
      userId,
      name: '예산 초과 소진 알림',
      ruleType: 'BUDGET_PACE',
      conditions: [RuleCondition.create('spend_pace', 'gt', 120)],
      actions: [RuleAction.alertOnly('in_app')],
      isEnabled: true,
      createdAt: now,
      updatedAt: now,
    })

    return [cpaRule, roasRule, paceRule]
  }

  /**
   * 모든 조건을 AND 논리로 평가
   * @param kpi 평가 대상 KPI
   * @param dailyBudget spend_pace 조건에 필요한 일 예산 (선택)
   */
  evaluate(kpi: KPI, dailyBudget?: number): boolean {
    return this.conditions.every(condition => condition.evaluate(kpi, dailyBudget))
  }

  /**
   * 쿨다운이 지났는지 확인 (트리거 가능 여부)
   * lastTriggeredAt + cooldownMinutes > now 이면 false (아직 쿨다운 중)
   */
  canTrigger(): boolean {
    if (!this.lastTriggeredAt) return true
    const cooldownMs = this.cooldownMinutes * 60 * 1000
    return Date.now() - this.lastTriggeredAt.getTime() >= cooldownMs
  }

  /** 트리거 발생 기록 (새 인스턴스 반환) */
  recordTrigger(): OptimizationRule {
    return new OptimizationRule({
      id: this.id,
      campaignId: this.campaignId,
      userId: this.userId,
      name: this.name,
      ruleType: this.ruleType,
      conditions: this.conditions,
      actions: this.actions,
      isEnabled: this.isEnabled,
      lastTriggeredAt: new Date(),
      triggerCount: this.triggerCount + 1,
      cooldownMinutes: this.cooldownMinutes,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  /** 규칙 활성화 (새 인스턴스 반환) */
  enable(): OptimizationRule {
    return new OptimizationRule({
      id: this.id,
      campaignId: this.campaignId,
      userId: this.userId,
      name: this.name,
      ruleType: this.ruleType,
      conditions: this.conditions,
      actions: this.actions,
      isEnabled: true,
      lastTriggeredAt: this.lastTriggeredAt,
      triggerCount: this.triggerCount,
      cooldownMinutes: this.cooldownMinutes,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  /** 규칙 비활성화 (새 인스턴스 반환) */
  disable(): OptimizationRule {
    return new OptimizationRule({
      id: this.id,
      campaignId: this.campaignId,
      userId: this.userId,
      name: this.name,
      ruleType: this.ruleType,
      conditions: this.conditions,
      actions: this.actions,
      isEnabled: false,
      lastTriggeredAt: this.lastTriggeredAt,
      triggerCount: this.triggerCount,
      cooldownMinutes: this.cooldownMinutes,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  /** 조건 업데이트 (새 인스턴스 반환) */
  updateConditions(conditions: RuleCondition[]): OptimizationRule {
    return new OptimizationRule({
      id: this.id,
      campaignId: this.campaignId,
      userId: this.userId,
      name: this.name,
      ruleType: this.ruleType,
      conditions,
      actions: this.actions,
      isEnabled: this.isEnabled,
      lastTriggeredAt: this.lastTriggeredAt,
      triggerCount: this.triggerCount,
      cooldownMinutes: this.cooldownMinutes,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }

  /** 액션 업데이트 (새 인스턴스 반환) */
  updateActions(actions: RuleAction[]): OptimizationRule {
    return new OptimizationRule({
      id: this.id,
      campaignId: this.campaignId,
      userId: this.userId,
      name: this.name,
      ruleType: this.ruleType,
      conditions: this.conditions,
      actions,
      isEnabled: this.isEnabled,
      lastTriggeredAt: this.lastTriggeredAt,
      triggerCount: this.triggerCount,
      cooldownMinutes: this.cooldownMinutes,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    })
  }
}
