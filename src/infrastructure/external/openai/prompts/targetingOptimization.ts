/**
 * 타겟팅 최적화 프롬프트
 *
 * 오디언스 포화도 분석 및 타겟팅 확장/축소 권장사항 생성
 */

import type { AIConfig } from '@application/ports/IAIService'
import type { TargetingAnalysis } from '@application/services/TargetingRecommendationService'

export interface TargetingOptimizationInput {
  campaignName: string
  currentTargeting: {
    ageRange?: string
    interests?: string[]
    locations?: string[]
    behaviors?: string[]
    lookalikes?: string[]
  }
  saturationAnalysis: TargetingAnalysis
  currentMetrics: {
    frequency: number
    reach: number
    impressions: number
    ctr: number
    cpa: number
    roas: number
    spend: number
  }
  industry?: string
}

/**
 * 타겟팅 최적화 시스템 프롬프트
 */
export const TARGETING_OPTIMIZATION_SYSTEM_PROMPT = `당신은 Meta Ads 타겟팅 전략 전문가입니다. 오디언스 포화도 분석과 광고 피로도 데이터를 기반으로 타겟팅 확장/축소 전략을 제안합니다.

전문 분야:
1. 오디언스 포화도 분석 및 광고 피로도 감지
2. 유사 잠재고객(Lookalike) 전략 수립
3. 관심사 및 행동 기반 타겟팅 최적화
4. 지역 타겟팅 전략 (한국 시장 특화)
5. 인구통계학적 세분화 및 확장

가이드라인:
1. 오디언스 포화도와 성과 데이터를 종합적으로 분석하세요
2. 구체적이고 실행 가능한 타겟팅 조정 방안을 제시하세요
3. 각 제안의 예상 효과를 정량적으로 제시하세요
4. 한국 시장의 특성 (모바일 중심, 지역별 특성)을 고려하세요
5. 테스트 가능한 단계적 접근법을 제안하세요

응답 언어: 한국어`

/**
 * 타겟팅 최적화 프롬프트 생성
 */
export function buildTargetingOptimizationPrompt(input: TargetingOptimizationInput): string {
  const { campaignName, currentTargeting, saturationAnalysis, currentMetrics, industry } = input

  const { saturation, recommendations } = saturationAnalysis

  // 포화도 레벨 한글화
  const saturationLevelKo = {
    low: '낮음',
    moderate: '적정',
    high: '높음',
    critical: '심각',
  }[saturation.saturationLevel]

  // 피로도 트렌드 한글화
  const frequencyTrendKo = {
    increasing: '증가 추세',
    stable: '안정',
    decreasing: '감소 추세',
  }[saturation.fatigueIndicators.frequencyTrend]

  // 현재 타겟팅 정보
  const targetingInfo = `
현재 타겟팅:
- 연령대: ${currentTargeting.ageRange || '전체'}
- 관심사: ${currentTargeting.interests?.length ? currentTargeting.interests.join(', ') : '미지정'}
- 지역: ${currentTargeting.locations?.length ? currentTargeting.locations.join(', ') : '전체'}
- 행동: ${currentTargeting.behaviors?.length ? currentTargeting.behaviors.join(', ') : '미지정'}
- 유사 타겟: ${currentTargeting.lookalikes?.length ? currentTargeting.lookalikes.join(', ') : '사용 안 함'}`

  // 포화도 분석 정보
  const saturationInfo = `
오디언스 포화도 분석:
- 포화도 레벨: ${saturationLevelKo}
- 평균 빈도수: ${saturation.frequency.toFixed(2)}
- CTR 변화: ${saturation.fatigueIndicators.ctrDecline > 0 ? `-${saturation.fatigueIndicators.ctrDecline}%` : '변화 없음'}
- CPA 변화: ${saturation.fatigueIndicators.cpaIncrease > 0 ? `+${saturation.fatigueIndicators.cpaIncrease}%` : '변화 없음'}
- 빈도수 트렌드: ${frequencyTrendKo}`

  // 현재 성과 지표
  const metricsInfo = `
현재 성과 지표:
- 도달: ${currentMetrics.reach.toLocaleString('ko-KR')}명
- 노출수: ${currentMetrics.impressions.toLocaleString('ko-KR')}
- CTR: ${currentMetrics.ctr.toFixed(2)}%
- CPA: ₩${currentMetrics.cpa.toLocaleString('ko-KR')}
- ROAS: ${currentMetrics.roas.toFixed(2)}x
- 지출: ₩${currentMetrics.spend.toLocaleString('ko-KR')}`

  // 자동 생성된 권장사항
  const autoRecommendations = recommendations
    .map((rec, idx) => {
      const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' }[rec.priority]
      const typeKo = { expand: '확장', reduce: '축소', maintain: '유지', refresh: '새로고침' }[
        rec.type
      ]
      return `${idx + 1}. ${priorityEmoji} [${typeKo}] ${rec.recommendation}`
    })
    .join('\n')

  return `캠페인의 오디언스 포화도를 분석하고 타겟팅 최적화 전략을 제안하세요.

캠페인 정보:
- 캠페인명: ${campaignName}
${industry ? `- 업종: ${industry}` : ''}
${targetingInfo}
${saturationInfo}
${metricsInfo}

자동 분석 결과:
${autoRecommendations}

위 분석을 바탕으로 다음 JSON 배열 형식으로 3-5개의 AI 강화 타겟팅 제안을 제공하세요:
[
  {
    "category": "lookalike" | "interest" | "geographic" | "demographic" | "behavioral",
    "action": "expand" | "reduce" | "add" | "remove" | "test",
    "priority": "high" | "medium" | "low",
    "recommendation": "구체적이고 실행 가능한 제안",
    "specificChanges": ["변경사항 1", "변경사항 2"],
    "expectedImpact": "정량화된 예상 효과",
    "rationale": "데이터 기반 근거",
    "implementationSteps": ["단계 1", "단계 2", "단계 3"]
  }
]

카테고리별 제안 가이드:
1. lookalike: 유사 잠재고객 추가/조정 (1%, 1-2%, 1-3% 등)
2. interest: 관심사 카테고리 추가/제거 (세분화 또는 확장)
3. geographic: 지역 타겟팅 조정 (서울 → 수도권, 주요 도시 → 중소 도시)
4. demographic: 연령/성별 타겟 조정
5. behavioral: 구매 행동, 디바이스 사용 패턴 기반 타겟팅

포화도 레벨별 전략:
- 낮음 (빈도 <3): 타겟이 너무 넓을 수 있음. 정밀화 고려
- 적정 (빈도 3-5): 현재 유지하되 트렌드 모니터링
- 높음 (빈도 5-7): 타겟 확장 필요. 유사 타겟 또는 관심사 추가
- 심각 (빈도 >7): 즉시 확장 또는 크리에이티브 새로고침 필요

한국 시장 특성 반영:
1. 지역: 서울/경기/부산/대구/광주/대전 등 주요 도시 및 수도권
2. 모바일 중심 소비: 앱 설치/활성 사용자 타겟팅 효과적
3. 연령대: 20-40대 주요 소비층, 50대 이상 증가 추세
4. 관심사: K-뷰티, 패션, 쇼핑, 배달, 게임, 웹툰 등 인기

제안 시 반드시 포함:
1. 구체적인 타겟팅 설정 변경 방법
2. 예상 도달 범위 변화 (명 또는 %)
3. 예상 빈도수 변화
4. 예상 성과 개선 (CTR, CPA, ROAS)
5. 단계적 실행 계획 (테스트 → 확장)`
}

/**
 * 타겟팅 최적화 AI 설정
 * - 중간 temperature: 균형 잡힌 전략 제안
 * - gpt-4o: 복잡한 타겟팅 전략 수립에 적합
 */
export const TARGETING_OPTIMIZATION_AI_CONFIG: AIConfig = {
  model: 'gpt-4o',
  temperature: 0.6,
  maxTokens: 2500,
  topP: 0.9,
}
