/**
 * SavingsCalculator 값 객체
 *
 * 광고 최적화로 인한 절감액을 계산하는 순수 정적 메서드 모음.
 * 외부 의존성 없음, 사이드 이펙트 없음.
 */
import { KPI } from '../entities/KPI'
import { Money } from './Money'
import { RuleAction } from './RuleAction'

export class SavingsCalculator {
  private constructor() {}

  /**
   * ROAS 임계값 미만인 캠페인들의 총 낭비 지출 계산
   * @param kpis 평가할 KPI 배열
   * @param roasThreshold ROAS 기준값 (기본 1.0)
   */
  static calculateWastedSpend(kpis: KPI[], roasThreshold: number = 1.0): Money {
    if (kpis.length === 0) {
      return Money.create(0, 'KRW')
    }

    const currency = kpis[0].spend.currency
    let totalWasted = Money.create(0, currency)

    for (const kpi of kpis) {
      if (kpi.calculateROAS() < roasThreshold) {
        totalWasted = totalWasted.add(kpi.spend)
      }
    }

    return totalWasted
  }

  /**
   * 특정 액션 실행 시 예상 절감액 계산
   * @param kpi 대상 KPI
   * @param action 적용할 규칙 액션
   */
  static calculateProjectedSavings(kpi: KPI, action: RuleAction): Money {
    const zeroCurrency = kpi.spend.currency

    switch (action.type) {
      case 'PAUSE_CAMPAIGN':
        return kpi.spend

      case 'REDUCE_BUDGET': {
        const percentage = action.params.percentage
        if (!percentage) return Money.create(0, zeroCurrency)
        return kpi.spend.multiply(percentage / 100)
      }

      case 'ALERT_ONLY':
      case 'INCREASE_BUDGET':
        return Money.create(0, zeroCurrency)
    }
  }

  /**
   * 일일 절감액을 기반으로 월간 영향 계산 (30일 기준)
   * @param dailySavings 일일 절감액
   */
  static calculateMonthlyImpact(dailySavings: Money): Money {
    return dailySavings.multiply(30)
  }

  /**
   * 최적화 전후 지출 차이로 절감액 계산
   * afterKPI의 지출이 더 크거나 같으면 0 반환
   * @param beforeKPI 최적화 전 KPI
   * @param afterKPI 최적화 후 KPI
   */
  static calculateSavingsFromOptimization(beforeKPI: KPI, afterKPI: KPI): Money {
    const before = beforeKPI.spend.amount
    const after = afterKPI.spend.amount
    const currency = beforeKPI.spend.currency

    if (after >= before) {
      return Money.create(0, currency)
    }

    return Money.create(before - after, currency)
  }
}
