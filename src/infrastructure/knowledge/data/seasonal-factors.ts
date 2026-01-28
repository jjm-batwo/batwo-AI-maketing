/**
 * Korean market seasonal calendar with psychological implications.
 * Used for timing-based recommendations in marketing analysis.
 */

export interface SeasonalEvent {
  name: string
  month: number
  dayRange?: [number, number]
  psychologicalDrivers: string[]
  topIndustries: string[]
  recommendedApproach: string
  urgencyLevel: 'high' | 'medium' | 'low'
}

export const KOREAN_SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    name: '신년 세일',
    month: 1,
    dayRange: [1, 15],
    psychologicalDrivers: ['새로운 시작', '자기 투자', '결심'],
    topIndustries: ['education', 'health', 'saas'],
    recommendedApproach: '새해 다짐과 연결된 자기 발전 메시지',
    urgencyLevel: 'high',
  },
  {
    name: '설날',
    month: 1,
    dayRange: [20, 31],
    psychologicalDrivers: ['가족', '선물', '전통', '효도'],
    topIndustries: ['food_beverage', 'fashion', 'ecommerce'],
    recommendedApproach: '가족 중심 감성, 선물 패키지 강조',
    urgencyLevel: 'high',
  },
  {
    name: '발렌타인데이',
    month: 2,
    dayRange: [7, 14],
    psychologicalDrivers: ['로맨스', '감사', '특별함'],
    topIndustries: ['food_beverage', 'beauty', 'fashion'],
    recommendedApproach: '한정판, 특별 에디션, 감성 소구',
    urgencyLevel: 'medium',
  },
  {
    name: '화이트데이',
    month: 3,
    dayRange: [7, 14],
    psychologicalDrivers: ['상호성', '보답', '감사'],
    topIndustries: ['food_beverage', 'beauty', 'fashion'],
    recommendedApproach: '상호성 원칙 활용, 보답 선물 프레이밍',
    urgencyLevel: 'medium',
  },
  {
    name: '봄 시즌',
    month: 3,
    dayRange: [15, 31],
    psychologicalDrivers: ['새로움', '변화', '리뉴얼'],
    topIndustries: ['fashion', 'beauty', 'health'],
    recommendedApproach: '새 시즌 변화, 리프레시 메시지',
    urgencyLevel: 'low',
  },
  {
    name: '어버이날/어린이날',
    month: 5,
    dayRange: [1, 8],
    psychologicalDrivers: ['감사', '사랑', '가족', '효도'],
    topIndustries: ['ecommerce', 'food_beverage', 'health'],
    recommendedApproach: '효도/감사 감성, 실용적 선물 강조',
    urgencyLevel: 'high',
  },
  {
    name: '여름 시즌',
    month: 7,
    dayRange: [1, 31],
    psychologicalDrivers: ['휴가', '건강', '바캉스', '리프레시'],
    topIndustries: ['beauty', 'health', 'fashion'],
    recommendedApproach: '여름 한정, 시원한 비주얼, 바캉스 연계',
    urgencyLevel: 'medium',
  },
  {
    name: '추석',
    month: 9,
    dayRange: [10, 25],
    psychologicalDrivers: ['가족', '선물', '전통', '감사'],
    topIndustries: ['food_beverage', 'ecommerce', 'fashion'],
    recommendedApproach: '명절 선물세트, 가족 감성, 전통 활용',
    urgencyLevel: 'high',
  },
  {
    name: '할로윈',
    month: 10,
    dayRange: [24, 31],
    psychologicalDrivers: ['재미', '파티', 'MZ세대', '트렌드'],
    topIndustries: ['food_beverage', 'beauty', 'fashion'],
    recommendedApproach: '한정판, 재미/유니크 컨셉, SNS 공유',
    urgencyLevel: 'low',
  },
  {
    name: '빼빼로데이',
    month: 11,
    dayRange: [7, 11],
    psychologicalDrivers: ['친밀감', '우정', '가벼운 선물'],
    topIndustries: ['food_beverage', 'ecommerce'],
    recommendedApproach: '소소한 행복, 나눔 메시지, 소형 선물',
    urgencyLevel: 'medium',
  },
  {
    name: '블랙프라이데이/사이버먼데이',
    month: 11,
    dayRange: [20, 30],
    psychologicalDrivers: ['희소성', '손실 회피', 'FOMO', '가격 앵커링'],
    topIndustries: ['ecommerce', 'fashion', 'beauty', 'saas'],
    recommendedApproach: '강한 할인 앵커링, 카운트다운, 수량 제한',
    urgencyLevel: 'high',
  },
  {
    name: '크리스마스/연말',
    month: 12,
    dayRange: [15, 31],
    psychologicalDrivers: ['선물', '감사', '연말 결산', '자기보상'],
    topIndustries: ['ecommerce', 'fashion', 'beauty', 'food_beverage'],
    recommendedApproach: '선물 가이드, 연말 자기보상, 한 해 마무리 감성',
    urgencyLevel: 'high',
  },
]

// Get current or upcoming seasonal events
export function getCurrentSeasonalEvents(month: number, day: number): SeasonalEvent[] {
  return KOREAN_SEASONAL_EVENTS.filter(event => {
    if (event.month !== month) return false
    if (!event.dayRange) return true
    return day >= event.dayRange[0] && day <= event.dayRange[1]
  })
}

// Get seasonal events relevant to an industry
export function getIndustrySeasonalEvents(industry: string): SeasonalEvent[] {
  return KOREAN_SEASONAL_EVENTS.filter(event =>
    event.topIndustries.includes(industry)
  )
}
