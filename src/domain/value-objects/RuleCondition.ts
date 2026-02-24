/**
 * RuleCondition 값 객체
 *
 * 자동 최적화 규칙의 조건을 정의. KPI 메트릭과 비교 연산자, 임계값으로 구성.
 * 순수 함수, 외부 의존성 없음, 불변성 보장.
 */
import { KPI } from '../entities/KPI'

export type ConditionMetric = 'cpa' | 'roas' | 'ctr' | 'cpc' | 'spend_pace' | 'cvr'
export type ConditionOperator = 'gt' | 'lt' | 'gte' | 'lte'

export class RuleCondition {
  private constructor(
    private readonly _metric: ConditionMetric,
    private readonly _operator: ConditionOperator,
    private readonly _value: number
  ) {}

  static create(
    metric: ConditionMetric,
    operator: ConditionOperator,
    value: number
  ): RuleCondition {
    return new RuleCondition(metric, operator, value)
  }

  get metric(): ConditionMetric {
    return this._metric
  }

  get operator(): ConditionOperator {
    return this._operator
  }

  get value(): number {
    return this._value
  }

  /**
   * KPI에 대해 조건을 평가
   * spend_pace 메트릭은 dailyBudget 파라미터가 필요
   */
  evaluate(kpi: KPI, dailyBudget?: number): boolean {
    const actual = this._extractMetricValue(kpi, dailyBudget)
    return this._compare(actual, this._operator, this._value)
  }

  private _extractMetricValue(kpi: KPI, dailyBudget?: number): number {
    switch (this._metric) {
      case 'cpa':
        return kpi.calculateCPA().amount
      case 'roas':
        return kpi.calculateROAS()
      case 'ctr':
        return kpi.calculateCTR().value
      case 'cpc':
        return kpi.calculateCPC().amount
      case 'cvr':
        return kpi.calculateCVR().value
      case 'spend_pace': {
        if (!dailyBudget || dailyBudget === 0) return 0
        return (kpi.spend.amount / dailyBudget) * 100
      }
    }
  }

  private _compare(actual: number, operator: ConditionOperator, threshold: number): boolean {
    switch (operator) {
      case 'gt':
        return actual > threshold
      case 'lt':
        return actual < threshold
      case 'gte':
        return actual >= threshold
      case 'lte':
        return actual <= threshold
    }
  }

  toJSON(): { metric: ConditionMetric; operator: ConditionOperator; value: number } {
    return {
      metric: this._metric,
      operator: this._operator,
      value: this._value,
    }
  }
}
