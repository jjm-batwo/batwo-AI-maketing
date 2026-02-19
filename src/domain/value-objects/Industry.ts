/**
 * 업종 타입 정의
 */
export type Industry =
  | 'ecommerce'
  | 'food_beverage'
  | 'beauty'
  | 'fashion'
  | 'education'
  | 'service'
  | 'saas'
  | 'health'

/**
 * 카피 훅 타입 - A/B 테스트를 위한 심리적 접근법
 */
export type CopyHookType =
  | 'benefit' // 혜택 강조
  | 'urgency' // 긴급성/희소성
  | 'social_proof' // 사회적 증거
  | 'curiosity' // 호기심 유발
  | 'fear_of_missing' // FOMO
  | 'authority' // 권위/전문성
  | 'emotional' // 감정적 연결

/**
 * 업종별 벤치마크 데이터
 */
export interface IndustryBenchmark {
  avgCTR: number
  avgCVR: number
  topKeywords: string[]
  peakHours: number[]
  bestPerformingHooks: CopyHookType[]
  characterTips: {
    headline: string
    primaryText: string
  }
}

/**
 * 업종별 벤치마크 데이터베이스
 */
export const INDUSTRY_BENCHMARKS: Record<Industry, IndustryBenchmark> = {
  ecommerce: {
    avgCTR: 1.2,
    avgCVR: 2.8,
    topKeywords: ['무료배송', '오늘만', '특가', '품절임박', '신상'],
    peakHours: [10, 12, 20, 21, 22],
    bestPerformingHooks: ['urgency', 'benefit', 'fear_of_missing'],
    characterTips: {
      headline: '숫자나 할인율을 포함하면 CTR 23% 상승',
      primaryText: '첫 문장에 핵심 혜택, 마지막에 긴급성 추가',
    },
  },
  food_beverage: {
    avgCTR: 1.8,
    avgCVR: 3.2,
    topKeywords: ['맛집', '신메뉴', '할인', '배달', '프로모션', '1+1'],
    peakHours: [11, 12, 17, 18, 19, 20],
    bestPerformingHooks: ['curiosity', 'social_proof', 'benefit'],
    characterTips: {
      headline: '맛을 연상시키는 감각적 단어 사용',
      primaryText: '음식 사진과 함께 식감/맛 묘사 효과적',
    },
  },
  beauty: {
    avgCTR: 1.5,
    avgCVR: 2.5,
    topKeywords: ['피부', '톤업', '수분', '안티에이징', '더마', '비건'],
    peakHours: [9, 10, 20, 21, 22, 23],
    bestPerformingHooks: ['social_proof', 'authority', 'benefit'],
    characterTips: {
      headline: '성분명이나 효과를 직접적으로 언급',
      primaryText: '전후 비교나 사용 후기 인용 효과적',
    },
  },
  fashion: {
    avgCTR: 1.3,
    avgCVR: 2.2,
    topKeywords: ['신상', '트렌드', '코디', '세일', '한정', 'SS/FW'],
    peakHours: [12, 13, 20, 21, 22],
    bestPerformingHooks: ['curiosity', 'fear_of_missing', 'social_proof'],
    characterTips: {
      headline: '시즌감이나 트렌드 키워드 포함',
      primaryText: '스타일링 팁이나 착용샷 언급 효과적',
    },
  },
  education: {
    avgCTR: 0.9,
    avgCVR: 1.8,
    topKeywords: ['합격', '취업', '자격증', '무료체험', '수강료', '할인'],
    peakHours: [8, 9, 19, 20, 21, 22],
    bestPerformingHooks: ['authority', 'social_proof', 'fear_of_missing'],
    characterTips: {
      headline: '구체적 성과나 합격률 수치 포함',
      primaryText: '수강생 후기나 강사 경력 언급 효과적',
    },
  },
  service: {
    avgCTR: 1.0,
    avgCVR: 2.0,
    topKeywords: ['무료상담', '견적', '방문', '24시간', '전문가', '보장'],
    peakHours: [9, 10, 11, 14, 15, 16],
    bestPerformingHooks: ['authority', 'benefit', 'social_proof'],
    characterTips: {
      headline: '문제 해결이나 편의성 강조',
      primaryText: '서비스 과정이나 보장 내용 설명',
    },
  },
  saas: {
    avgCTR: 0.8,
    avgCVR: 1.5,
    topKeywords: ['무료체험', '자동화', '효율', '생산성', '협업', 'AI'],
    peakHours: [9, 10, 11, 14, 15, 16],
    bestPerformingHooks: ['benefit', 'authority', 'curiosity'],
    characterTips: {
      headline: '시간/비용 절감 수치 포함',
      primaryText: '도입 사례나 ROI 언급 효과적',
    },
  },
  health: {
    avgCTR: 1.1,
    avgCVR: 2.3,
    topKeywords: ['건강', '다이어트', '면역', '자연', '유기농', '프로바이오틱스'],
    peakHours: [7, 8, 9, 20, 21, 22],
    bestPerformingHooks: ['authority', 'social_proof', 'emotional'],
    characterTips: {
      headline: '건강 효과나 성분 장점 직접 언급',
      primaryText: '전문가 추천이나 인증 마크 언급 효과적',
    },
  },
}
