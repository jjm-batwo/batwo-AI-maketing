/**
 * AnomalyRootCauseService - 이상 징후 원인 분석 서비스
 *
 * 이상 징후가 감지되었을 때 가능한 원인을 분석하고
 * 확률 기반으로 원인을 제시하며, 권장 조치를 제안합니다.
 *
 * 원인 분류:
 * - external: 외부 요인 (경쟁사, 시장 변화, 계절성)
 * - internal: 내부 요인 (캠페인 설정, 예산, 타겟팅)
 * - technical: 기술적 요인 (픽셀, 추적, API)
 * - market: 시장 요인 (트렌드, 경기, 이벤트)
 */

import type { MetricName, EnhancedAnomaly, AnomalySeverity } from './AnomalyDetectionService'
import { KoreanMarketCalendar } from '@domain/value-objects/KoreanMarketCalendar'

// ============================================================================
// Types
// ============================================================================

export type CauseCategory = 'external' | 'internal' | 'technical' | 'market'

export interface PossibleCause {
  id: string
  category: CauseCategory
  name: string
  description: string
  probability: number // 0-1
  confidence: 'high' | 'medium' | 'low'
  evidence: string[]
  actions: RecommendedAction[]
}

export interface RecommendedAction {
  id: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  action: string
  description: string
  estimatedImpact: string
  timeframe: string
}

export interface RootCauseAnalysis {
  anomalyId: string
  metric: MetricName
  analyzedAt: Date
  topCauses: PossibleCause[]
  allCauses: PossibleCause[]
  summary: string
  urgencyLevel: 'critical' | 'high' | 'medium' | 'low'
  nextSteps: string[]
}

export interface AnalysisContext {
  currentDate: Date
  industry?: string
  historicalPattern?: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  recentChanges?: CampaignChange[]
  competitorActivity?: boolean
  technicalIssues?: boolean
}

export interface CampaignChange {
  type: 'budget' | 'targeting' | 'creative' | 'bid' | 'schedule'
  changedAt: Date
  description: string
}

// ============================================================================
// Root Cause Database
// ============================================================================

/**
 * 지표별 가능한 원인 데이터베이스
 */
const CAUSE_DATABASE: Record<MetricName, CauseTemplate[]> = {
  spend: [
    {
      id: 'spend_budget_cap',
      category: 'internal',
      name: '예산 한도 도달',
      description: '일일 또는 기간 예산 한도에 도달하여 지출이 중단되었습니다.',
      baseConfidence: 'high',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['예산 소진율 확인', '캠페인 상태 확인'],
      actions: [
        { id: 'increase_budget', priority: 'high', action: '예산 증액', description: '일일 예산을 증액하여 노출 기회를 확보하세요.', estimatedImpact: '노출량 증가', timeframe: '즉시' },
        { id: 'optimize_spend', priority: 'medium', action: '지출 최적화', description: '비효율 광고세트의 예산을 효율적인 곳으로 재배분하세요.', estimatedImpact: 'ROAS 개선', timeframe: '1-2일' }
      ]
    },
    {
      id: 'spend_auction_competition',
      category: 'external',
      name: '경매 경쟁 심화',
      description: '경쟁사의 광고 지출 증가로 경매 경쟁이 심화되었습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'increase', severity: ['warning', 'critical'] },
      evidence: ['CPM 상승 확인', '동종 업계 광고량 증가'],
      actions: [
        { id: 'adjust_bidding', priority: 'high', action: '입찰 전략 조정', description: '입찰 전략을 "최저 비용"에서 "비용 상한"으로 변경하세요.', estimatedImpact: '비용 안정화', timeframe: '1-3일' },
        { id: 'expand_audience', priority: 'medium', action: '타겟 확장', description: '경쟁이 덜한 오디언스로 타겟을 확장하세요.', estimatedImpact: 'CPM 절감', timeframe: '3-7일' }
      ]
    },
    {
      id: 'spend_seasonal_surge',
      category: 'market',
      name: '시즌 수요 증가',
      description: '계절적 수요 증가로 광고 지출이 증가했습니다.',
      baseConfidence: 'high',
      triggers: { direction: 'increase', severity: ['info', 'warning', 'critical'] },
      evidence: ['시즌 이벤트 기간 확인', '전년도 동기 데이터 비교'],
      actions: [
        { id: 'ride_wave', priority: 'medium', action: '트렌드 활용', description: '시즌 수요를 최대한 활용하여 매출을 극대화하세요.', estimatedImpact: '매출 증가', timeframe: '시즌 기간' },
        { id: 'prepare_creative', priority: 'high', action: '시즌 크리에이티브', description: '시즌에 맞는 광고 소재를 준비하세요.', estimatedImpact: 'CTR 개선', timeframe: '즉시' }
      ]
    }
  ],
  impressions: [
    {
      id: 'imp_audience_saturation',
      category: 'internal',
      name: '오디언스 포화',
      description: '타겟 오디언스 내에서 대부분의 사용자에게 이미 노출되었습니다.',
      baseConfidence: 'high',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['빈도수 증가', '도달 수 정체'],
      actions: [
        { id: 'expand_targeting', priority: 'high', action: '타겟 확장', description: '유사 오디언스를 추가하거나 관심사를 확장하세요.', estimatedImpact: '노출량 회복', timeframe: '3-5일' },
        { id: 'refresh_creative', priority: 'medium', action: '크리에이티브 갱신', description: '광고 피로도를 줄이기 위해 새로운 소재를 추가하세요.', estimatedImpact: 'CTR 유지', timeframe: '1-2일' }
      ]
    },
    {
      id: 'imp_algorithm_learning',
      category: 'technical',
      name: '알고리즘 학습 단계',
      description: 'Meta 알고리즘이 최적화를 위한 학습 단계에 있습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'decrease', severity: ['info', 'warning'] },
      evidence: ['캠페인 시작 7일 이내', '광고세트 상태: 학습 중'],
      actions: [
        { id: 'wait_learning', priority: 'low', action: '학습 완료 대기', description: '알고리즘 학습이 완료될 때까지 설정 변경을 자제하세요.', estimatedImpact: '최적화 완료', timeframe: '3-7일' },
        { id: 'check_conversions', priority: 'medium', action: '전환 데이터 확인', description: '충분한 전환 데이터가 수집되고 있는지 확인하세요.', estimatedImpact: '학습 가속화', timeframe: '즉시' }
      ]
    },
    {
      id: 'imp_policy_violation',
      category: 'technical',
      name: '정책 위반 가능성',
      description: '광고 정책 위반으로 노출이 제한되었을 수 있습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['광고 거부 알림', '계정 경고 확인'],
      actions: [
        { id: 'check_policy', priority: 'critical', action: '정책 검토', description: 'Meta 광고 관리자에서 정책 위반 알림을 확인하세요.', estimatedImpact: '노출 복구', timeframe: '즉시' },
        { id: 'appeal_review', priority: 'high', action: '재검토 요청', description: '정당한 경우 재검토를 요청하세요.', estimatedImpact: '광고 승인', timeframe: '1-3일' }
      ]
    }
  ],
  clicks: [
    {
      id: 'click_creative_fatigue',
      category: 'internal',
      name: '크리에이티브 피로',
      description: '동일한 광고 소재에 대한 사용자 반응이 감소했습니다.',
      baseConfidence: 'high',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['빈도수 3 이상', 'CTR 지속 하락'],
      actions: [
        { id: 'new_creative', priority: 'high', action: '신규 소재 추가', description: '새로운 이미지, 영상, 카피를 추가하세요.', estimatedImpact: 'CTR 회복', timeframe: '즉시' },
        { id: 'ab_test', priority: 'medium', action: 'A/B 테스트', description: '여러 버전의 소재를 테스트하여 최적의 조합을 찾으세요.', estimatedImpact: '성과 개선', timeframe: '7일' }
      ]
    },
    {
      id: 'click_targeting_mismatch',
      category: 'internal',
      name: '타겟팅 불일치',
      description: '광고가 관심 없는 오디언스에게 노출되고 있습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['넓은 타겟 범위', '인구통계 불일치'],
      actions: [
        { id: 'narrow_targeting', priority: 'high', action: '타겟 세분화', description: '더 구체적인 관심사와 행동 데이터를 활용하세요.', estimatedImpact: 'CTR 개선', timeframe: '3-5일' },
        { id: 'review_audience', priority: 'medium', action: '오디언스 인사이트', description: '광고에 반응한 사용자의 특성을 분석하세요.', estimatedImpact: '타겟 최적화', timeframe: '즉시' }
      ]
    }
  ],
  conversions: [
    {
      id: 'conv_pixel_issue',
      category: 'technical',
      name: '픽셀 추적 문제',
      description: 'Meta 픽셀이 전환을 제대로 추적하지 못하고 있습니다.',
      baseConfidence: 'high',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['픽셀 이벤트 감소', '웹사이트 변경 이력'],
      actions: [
        { id: 'verify_pixel', priority: 'critical', action: '픽셀 검증', description: 'Meta 픽셀 헬퍼로 픽셀 작동을 확인하세요.', estimatedImpact: '추적 복구', timeframe: '즉시' },
        { id: 'check_events', priority: 'high', action: '이벤트 확인', description: '이벤트 관리자에서 이벤트 수신 상태를 확인하세요.', estimatedImpact: '데이터 정확성', timeframe: '즉시' }
      ]
    },
    {
      id: 'conv_landing_issue',
      category: 'internal',
      name: '랜딩 페이지 문제',
      description: '랜딩 페이지의 로딩 속도나 사용성에 문제가 있습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['높은 이탈률', '낮은 페이지 체류 시간'],
      actions: [
        { id: 'speed_test', priority: 'high', action: '속도 테스트', description: 'PageSpeed Insights로 페이지 속도를 확인하세요.', estimatedImpact: '전환율 개선', timeframe: '즉시' },
        { id: 'mobile_test', priority: 'medium', action: '모바일 최적화', description: '모바일에서 랜딩 페이지가 제대로 표시되는지 확인하세요.', estimatedImpact: '모바일 전환 개선', timeframe: '1-3일' }
      ]
    },
    {
      id: 'conv_checkout_friction',
      category: 'internal',
      name: '결제 프로세스 문제',
      description: '결제 과정에서 이탈이 발생하고 있습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['장바구니 추가 대비 구매 비율 감소', '결제 단계 이탈'],
      actions: [
        { id: 'simplify_checkout', priority: 'high', action: '결제 간소화', description: '결제 단계를 줄이고 게스트 결제를 허용하세요.', estimatedImpact: '전환율 10-20% 개선', timeframe: '1주' },
        { id: 'payment_options', priority: 'medium', action: '결제 옵션 추가', description: '다양한 결제 수단을 제공하세요.', estimatedImpact: '결제 완료율 개선', timeframe: '1-2주' }
      ]
    },
    {
      id: 'conv_market_downturn',
      category: 'market',
      name: '시장 수요 감소',
      description: '전반적인 시장 수요가 감소했습니다.',
      baseConfidence: 'low',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['업계 전반 트렌드 확인', '검색량 감소'],
      actions: [
        { id: 'diversify', priority: 'medium', action: '제품 다각화', description: '수요가 있는 다른 제품군으로 확장을 고려하세요.', estimatedImpact: '매출 안정화', timeframe: '중장기' },
        { id: 'retention_focus', priority: 'high', action: '기존 고객 집중', description: '신규 고객 획득보다 기존 고객 유지에 집중하세요.', estimatedImpact: 'LTV 개선', timeframe: '즉시' }
      ]
    }
  ],
  ctr: [
    {
      id: 'ctr_creative_relevance',
      category: 'internal',
      name: '광고 관련성 저하',
      description: '광고 소재가 타겟 오디언스의 관심사와 맞지 않습니다.',
      baseConfidence: 'high',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['관련성 점수 하락', '품질 순위 감소'],
      actions: [
        { id: 'improve_copy', priority: 'high', action: '카피 개선', description: '타겟 오디언스의 문제점과 니즈를 직접 언급하세요.', estimatedImpact: 'CTR 20-50% 개선', timeframe: '즉시' },
        { id: 'visual_refresh', priority: 'medium', action: '비주얼 개선', description: '눈에 띄는 이미지와 영상을 사용하세요.', estimatedImpact: 'CTR 개선', timeframe: '즉시' }
      ]
    },
    {
      id: 'ctr_placement_issue',
      category: 'internal',
      name: '게재 위치 문제',
      description: '성과가 낮은 게재 위치에 노출이 집중되고 있습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'decrease', severity: ['info', 'warning'] },
      evidence: ['게재 위치별 성과 분석', '자동 게재 위치 사용 중'],
      actions: [
        { id: 'placement_analysis', priority: 'medium', action: '게재 위치 분석', description: '게재 위치별 성과를 분석하고 저성과 위치를 제외하세요.', estimatedImpact: 'CTR 개선', timeframe: '3-5일' },
        { id: 'manual_placement', priority: 'low', action: '수동 게재 위치', description: '성과가 좋은 게재 위치만 선택하세요.', estimatedImpact: 'CTR 집중 개선', timeframe: '즉시' }
      ]
    }
  ],
  cpa: [
    {
      id: 'cpa_competition_increase',
      category: 'external',
      name: '경쟁 심화',
      description: '같은 오디언스를 타겟하는 광고주가 증가했습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'increase', severity: ['warning', 'critical'] },
      evidence: ['CPM 상승', '업계 광고량 증가'],
      actions: [
        { id: 'unique_value', priority: 'high', action: '차별화 강화', description: '경쟁사와 차별화된 가치 제안을 강조하세요.', estimatedImpact: '전환율 개선', timeframe: '1-2주' },
        { id: 'niche_targeting', priority: 'medium', action: '틈새 타겟팅', description: '경쟁이 덜한 세분화된 오디언스를 찾으세요.', estimatedImpact: 'CPA 절감', timeframe: '1-2주' }
      ]
    },
    {
      id: 'cpa_funnel_leak',
      category: 'internal',
      name: '전환 퍼널 누수',
      description: '전환 과정 중 특정 단계에서 이탈이 발생하고 있습니다.',
      baseConfidence: 'high',
      triggers: { direction: 'increase', severity: ['warning', 'critical'] },
      evidence: ['단계별 전환율 분석', '이탈 지점 확인'],
      actions: [
        { id: 'funnel_analysis', priority: 'high', action: '퍼널 분석', description: '각 전환 단계의 이탈률을 분석하세요.', estimatedImpact: '문제 지점 파악', timeframe: '즉시' },
        { id: 'fix_friction', priority: 'critical', action: '마찰 요소 제거', description: '이탈이 많은 단계의 UX를 개선하세요.', estimatedImpact: 'CPA 20-40% 절감', timeframe: '1-2주' }
      ]
    }
  ],
  roas: [
    {
      id: 'roas_attribution_delay',
      category: 'technical',
      name: '기여 지연',
      description: '전환이 광고에 기여되기까지 시간이 걸립니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'decrease', severity: ['info', 'warning'] },
      evidence: ['최근 캠페인 변경', '7일 기여 윈도우 확인'],
      actions: [
        { id: 'wait_attribution', priority: 'low', action: '기여 대기', description: '전환 데이터가 완전히 집계될 때까지 기다리세요.', estimatedImpact: 'ROAS 정상화', timeframe: '3-7일' },
        { id: 'check_window', priority: 'medium', action: '기여 윈도우 확인', description: '기여 윈도우 설정을 검토하세요.', estimatedImpact: '데이터 정확성', timeframe: '즉시' }
      ]
    },
    {
      id: 'roas_price_change',
      category: 'internal',
      name: '가격/상품 변경',
      description: '판매 가격이나 상품 구성이 변경되었습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['평균 주문 금액 변화', '상품 구성 변경 이력'],
      actions: [
        { id: 'aov_analysis', priority: 'medium', action: 'AOV 분석', description: '평균 주문 금액의 변화를 분석하세요.', estimatedImpact: '원인 파악', timeframe: '즉시' },
        { id: 'bundle_offer', priority: 'medium', action: '번들 제안', description: '상품 번들이나 업셀을 통해 AOV를 높이세요.', estimatedImpact: 'ROAS 개선', timeframe: '1-2주' }
      ]
    }
  ],
  cpc: [
    {
      id: 'cpc_bid_competition',
      category: 'external',
      name: '입찰 경쟁',
      description: '같은 키워드/오디언스에 대한 입찰 경쟁이 심화되었습니다.',
      baseConfidence: 'high',
      triggers: { direction: 'increase', severity: ['warning', 'critical'] },
      evidence: ['CPM 동반 상승', '입찰 추천 금액 상승'],
      actions: [
        { id: 'bid_strategy', priority: 'high', action: '입찰 전략 변경', description: '수동 입찰에서 자동 입찰로 변경하거나 그 반대로 시도하세요.', estimatedImpact: 'CPC 최적화', timeframe: '3-5일' },
        { id: 'quality_focus', priority: 'medium', action: '품질 개선', description: '광고 품질을 높여 경매에서 유리한 위치를 점하세요.', estimatedImpact: 'CPC 절감', timeframe: '1-2주' }
      ]
    }
  ],
  cvr: [
    {
      id: 'cvr_user_experience',
      category: 'internal',
      name: '사용자 경험 문제',
      description: '웹사이트 사용성에 문제가 있습니다.',
      baseConfidence: 'high',
      triggers: { direction: 'decrease', severity: ['warning', 'critical'] },
      evidence: ['세션 시간 감소', '이탈률 증가'],
      actions: [
        { id: 'ux_audit', priority: 'high', action: 'UX 감사', description: '주요 전환 경로의 사용성을 점검하세요.', estimatedImpact: '전환율 개선', timeframe: '1-2주' },
        { id: 'speed_optimization', priority: 'critical', action: '속도 최적화', description: '페이지 로딩 속도를 3초 이내로 줄이세요.', estimatedImpact: 'CVR 7% 개선/초', timeframe: '1주' }
      ]
    },
    {
      id: 'cvr_offer_mismatch',
      category: 'internal',
      name: '오퍼 불일치',
      description: '광고와 랜딩 페이지의 메시지가 일치하지 않습니다.',
      baseConfidence: 'medium',
      triggers: { direction: 'decrease', severity: ['info', 'warning', 'critical'] },
      evidence: ['높은 이탈률', '낮은 참여도'],
      actions: [
        { id: 'message_match', priority: 'high', action: '메시지 일치', description: '광고 카피와 랜딩 페이지의 메시지를 일치시키세요.', estimatedImpact: 'CVR 개선', timeframe: '즉시' },
        { id: 'dedicated_landing', priority: 'medium', action: '전용 랜딩', description: '각 캠페인에 맞는 전용 랜딩 페이지를 만드세요.', estimatedImpact: 'CVR 20-50% 개선', timeframe: '1-2주' }
      ]
    }
  ]
}

interface CauseTemplate {
  id: string
  category: CauseCategory
  name: string
  description: string
  baseConfidence: 'high' | 'medium' | 'low'
  triggers: {
    direction?: 'increase' | 'decrease'
    severity?: AnomalySeverity[]
  }
  evidence: string[]
  actions: RecommendedAction[]
}

// Map AnomalySeverity to urgency level (reserved for future use)
// type SeverityToUrgency = {
//   critical: 'critical'
//   warning: 'high' | 'medium'
//   info: 'low'
// }

// ============================================================================
// Service Implementation
// ============================================================================

export class AnomalyRootCauseService {
  private calendar: KoreanMarketCalendar

  constructor() {
    this.calendar = new KoreanMarketCalendar()
  }

  /**
   * 이상 징후에 대한 원인 분석 수행
   */
  analyzeRootCause(
    anomaly: EnhancedAnomaly,
    context?: AnalysisContext
  ): RootCauseAnalysis {
    const causes = this.identifyPossibleCauses(anomaly, context)
    const rankedCauses = this.rankCauses(causes, anomaly, context)
    const topCauses = rankedCauses.slice(0, 3)

    return {
      anomalyId: `${anomaly.metric}_${new Date().getTime()}`,
      metric: anomaly.metric,
      analyzedAt: new Date(),
      topCauses,
      allCauses: rankedCauses,
      summary: this.generateSummary(anomaly, topCauses),
      urgencyLevel: this.determineUrgency(anomaly, topCauses),
      nextSteps: this.generateNextSteps(topCauses)
    }
  }

  /**
   * 가능한 원인 식별
   */
  private identifyPossibleCauses(
    anomaly: EnhancedAnomaly,
    context?: AnalysisContext
  ): PossibleCause[] {
    const templates = CAUSE_DATABASE[anomaly.metric] || []
    const causes: PossibleCause[] = []

    for (const template of templates) {
      // 방향 필터링
      if (template.triggers.direction) {
        const direction = anomaly.changePercent >= 0 ? 'increase' : 'decrease'
        if (template.triggers.direction !== direction) continue
      }

      // 심각도 필터링
      if (template.triggers.severity && !template.triggers.severity.includes(anomaly.severity)) {
        continue
      }

      // 확률 계산
      const probability = this.calculateProbability(template, anomaly, context)
      if (probability < 0.1) continue

      causes.push({
        id: template.id,
        category: template.category,
        name: template.name,
        description: template.description,
        probability,
        confidence: this.adjustConfidence(template.baseConfidence, anomaly, context),
        evidence: template.evidence,
        actions: template.actions.map((a, i) => ({
          ...a,
          id: `${template.id}_action_${i}`
        }))
      })
    }

    // 시장 컨텍스트 기반 원인 추가
    if (context?.currentDate) {
      const marketCause = this.checkMarketContext(anomaly, context)
      if (marketCause) causes.push(marketCause)
    }

    // 최근 변경사항 기반 원인 추가
    if (context?.recentChanges && context.recentChanges.length > 0) {
      const changeCause = this.checkRecentChanges(anomaly, context.recentChanges)
      if (changeCause) causes.push(changeCause)
    }

    return causes
  }

  /**
   * 확률 계산
   */
  private calculateProbability(
    template: CauseTemplate,
    anomaly: EnhancedAnomaly,
    context?: AnalysisContext
  ): number {
    let baseProbability = 0.5

    // 기본 신뢰도에 따른 기본 확률
    if (template.baseConfidence === 'high') baseProbability = 0.7
    else if (template.baseConfidence === 'medium') baseProbability = 0.5
    else baseProbability = 0.3

    // 심각도에 따른 조정
    if (anomaly.severity === 'critical') baseProbability *= 1.2
    else if (anomaly.severity === 'warning') baseProbability *= 1.1
    else if (anomaly.severity === 'info') baseProbability *= 0.9

    // 변화 크기에 따른 조정
    const absChange = Math.abs(anomaly.changePercent)
    if (absChange > 50) baseProbability *= 1.15
    else if (absChange > 30) baseProbability *= 1.1
    else if (absChange < 10) baseProbability *= 0.85

    // 컨텍스트 기반 조정
    if (context) {
      // 기술적 문제가 확인된 경우
      if (context.technicalIssues && template.category === 'technical') {
        baseProbability *= 1.3
      }
      // 경쟁사 활동이 감지된 경우
      if (context.competitorActivity && template.category === 'external') {
        baseProbability *= 1.2
      }
      // 최근 변경사항이 있고 내부 원인인 경우
      if (context.recentChanges && context.recentChanges.length > 0 && template.category === 'internal') {
        baseProbability *= 1.15
      }
    }

    return Math.min(baseProbability, 0.95)
  }

  /**
   * 신뢰도 조정
   */
  private adjustConfidence(
    baseConfidence: 'high' | 'medium' | 'low',
    anomaly: EnhancedAnomaly,
    context?: AnalysisContext
  ): 'high' | 'medium' | 'low' {
    // 통계적 상세 정보가 있으면 신뢰도 상승
    if (anomaly.detail?.zScore && Math.abs(anomaly.detail.zScore) > 3) {
      if (baseConfidence === 'medium') return 'high'
      if (baseConfidence === 'low') return 'medium'
    }

    // 컨텍스트가 없으면 신뢰도 하락
    if (!context) {
      if (baseConfidence === 'high') return 'medium'
      if (baseConfidence === 'medium') return 'low'
    }

    return baseConfidence
  }

  /**
   * 원인 순위 정렬
   */
  private rankCauses(
    causes: PossibleCause[],
    _anomaly: EnhancedAnomaly,
    _context?: AnalysisContext
  ): PossibleCause[] {
    return causes.sort((a, b) => {
      // 1차: 확률
      const probDiff = b.probability - a.probability
      if (Math.abs(probDiff) > 0.1) return probDiff

      // 2차: 신뢰도
      const confOrder = { high: 3, medium: 2, low: 1 }
      const confDiff = confOrder[b.confidence] - confOrder[a.confidence]
      if (confDiff !== 0) return confDiff

      // 3차: 액션의 긴급성
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      const aMaxUrgency = Math.max(...a.actions.map(act => urgencyOrder[act.priority]))
      const bMaxUrgency = Math.max(...b.actions.map(act => urgencyOrder[act.priority]))
      return bMaxUrgency - aMaxUrgency
    })
  }

  /**
   * 시장 컨텍스트 확인
   */
  private checkMarketContext(
    anomaly: EnhancedAnomaly,
    context: AnalysisContext
  ): PossibleCause | null {
    const dateInfo = this.calendar.getDateEventInfo(context.currentDate, context.industry)

    if (!dateInfo.isSpecialDay) return null

    const events = dateInfo.events.map(e => e.name).join(', ')

    return {
      id: 'market_special_day',
      category: 'market',
      name: '특별일 영향',
      description: `현재 ${events} 기간으로 성과 변동이 예상됩니다.`,
      probability: 0.8,
      confidence: 'high',
      evidence: [
        `특별일: ${events}`,
        `예상 변동 범위: ${dateInfo.combinedExpectedChange?.spend?.min ?? -20}% ~ ${dateInfo.combinedExpectedChange?.spend?.max ?? 50}%`
      ],
      actions: [
        {
          id: 'monitor_trend',
          priority: 'low',
          action: '트렌드 모니터링',
          description: '특별일 기간 동안 지속적으로 성과를 모니터링하세요.',
          estimatedImpact: '정상 패턴 확인',
          timeframe: '특별일 종료까지'
        },
        {
          id: 'seasonal_strategy',
          priority: 'medium',
          action: '시즌 전략 적용',
          description: '시즌에 맞는 광고 전략을 적용하세요.',
          estimatedImpact: '시즌 매출 극대화',
          timeframe: '즉시'
        }
      ]
    }
  }

  /**
   * 최근 변경사항 확인
   */
  private checkRecentChanges(
    anomaly: EnhancedAnomaly,
    changes: CampaignChange[]
  ): PossibleCause | null {
    // 지난 3일 이내 변경사항만 고려
    const recentChanges = changes.filter(c => {
      const daysDiff = (new Date().getTime() - c.changedAt.getTime()) / (1000 * 60 * 60 * 24)
      return daysDiff <= 3
    })

    if (recentChanges.length === 0) return null

    const changeDescriptions = recentChanges.map(c => `${c.type}: ${c.description}`)

    return {
      id: 'recent_changes',
      category: 'internal',
      name: '최근 캠페인 변경',
      description: '최근 캠페인 설정 변경이 성과에 영향을 미쳤을 수 있습니다.',
      probability: 0.75,
      confidence: 'high',
      evidence: changeDescriptions,
      actions: [
        {
          id: 'review_changes',
          priority: 'high',
          action: '변경사항 검토',
          description: '최근 변경사항을 검토하고 필요시 롤백하세요.',
          estimatedImpact: '원인 파악',
          timeframe: '즉시'
        },
        {
          id: 'ab_test_changes',
          priority: 'medium',
          action: 'A/B 테스트',
          description: '변경 전후를 비교하는 A/B 테스트를 진행하세요.',
          estimatedImpact: '변경 효과 검증',
          timeframe: '7일'
        }
      ]
    }
  }

  /**
   * 요약 생성
   */
  private generateSummary(anomaly: EnhancedAnomaly, topCauses: PossibleCause[]): string {
    const direction = anomaly.changePercent >= 0 ? '증가' : '감소'
    const metricName = this.getMetricKoreanName(anomaly.metric)
    const causeNames = topCauses.map(c => c.name).join(', ')

    return `${metricName}이(가) ${Math.abs(anomaly.changePercent).toFixed(1)}% ${direction}했습니다. ` +
      `주요 원인으로 ${causeNames}이(가) 의심됩니다. ` +
      `${topCauses[0]?.actions[0]?.action || '상세 분석'}을(를) 권장합니다.`
  }

  /**
   * 긴급도 결정
   */
  private determineUrgency(
    anomaly: EnhancedAnomaly,
    topCauses: PossibleCause[]
  ): 'critical' | 'high' | 'medium' | 'low' {
    // 이상 징후 심각도 기반
    if (anomaly.severity === 'critical') return 'critical'

    // 원인 중 critical 액션이 있는 경우
    const hasCriticalAction = topCauses.some(c =>
      c.actions.some(a => a.priority === 'critical')
    )
    if (hasCriticalAction) return 'critical'

    // 기술적 문제인 경우 높은 우선순위 (warning → high)
    const hasTechnicalCause = topCauses.some(c => c.category === 'technical')
    if (hasTechnicalCause && anomaly.severity === 'warning') return 'high'

    // 기본 매핑 (AnomalySeverity → Urgency)
    // critical → critical, warning → high/medium, info → low
    if (anomaly.severity === 'warning') return 'medium'
    return 'low'
  }

  /**
   * 다음 단계 생성
   */
  private generateNextSteps(topCauses: PossibleCause[]): string[] {
    const steps: string[] = []
    const seenActions = new Set<string>()

    for (const cause of topCauses) {
      for (const action of cause.actions) {
        if (seenActions.has(action.action)) continue
        seenActions.add(action.action)

        const priorityEmoji = {
          critical: '🚨',
          high: '⚠️',
          medium: '📋',
          low: '💡'
        }[action.priority]

        steps.push(`${priorityEmoji} ${action.action}: ${action.description} (${action.timeframe})`)

        if (steps.length >= 5) break
      }
      if (steps.length >= 5) break
    }

    return steps
  }

  /**
   * 지표 한글명 반환
   */
  private getMetricKoreanName(metric: MetricName): string {
    const names: Record<MetricName, string> = {
      spend: '광고비',
      impressions: '노출수',
      clicks: '클릭수',
      conversions: '전환수',
      ctr: 'CTR',
      cpa: 'CPA',
      roas: 'ROAS',
      cpc: 'CPC',
      cvr: 'CVR'
    }
    return names[metric] || metric
  }

  /**
   * 특정 카테고리의 원인만 필터링
   */
  filterCausesByCategory(
    analysis: RootCauseAnalysis,
    category: CauseCategory
  ): PossibleCause[] {
    return analysis.allCauses.filter(c => c.category === category)
  }

  /**
   * 특정 우선순위 이상의 액션만 필터링
   */
  getHighPriorityActions(
    analysis: RootCauseAnalysis,
    minPriority: 'critical' | 'high' | 'medium' | 'low' = 'high'
  ): RecommendedAction[] {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const minOrder = priorityOrder[minPriority]

    const actions: RecommendedAction[] = []
    const seenIds = new Set<string>()

    for (const cause of analysis.allCauses) {
      for (const action of cause.actions) {
        if (priorityOrder[action.priority] >= minOrder && !seenIds.has(action.id)) {
          actions.push(action)
          seenIds.add(action.id)
        }
      }
    }

    return actions.sort((a, b) =>
      priorityOrder[b.priority] - priorityOrder[a.priority]
    )
  }
}

// Export singleton instance
export const anomalyRootCauseService = new AnomalyRootCauseService()
