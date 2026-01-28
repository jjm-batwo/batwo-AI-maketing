/**
 * 한국 마케팅 캘린더 데이터
 *
 * 주요 마케팅 시즌, 이벤트 날짜, 업종별 연관성 포함
 */

export interface MarketingEvent {
  id: string
  name: string
  date: Date
  impact: string
  relevantIndustries: string[]
  preparationChecklist: string[]
  budgetRecommendation: string
  optimalPrepDays: number // 준비 권장 일수
}

/**
 * 2025-2026 한국 마케팅 이벤트 캘린더
 */
export const KOREAN_MARKETING_EVENTS: MarketingEvent[] = [
  // 1월
  {
    id: 'new-year-sale',
    name: '신년 세일',
    date: new Date('2025-01-02'),
    impact: '소비 심리 회복, 신년 결심 관련 구매 증가',
    relevantIndustries: ['ecommerce', 'fashion', 'beauty', 'health', 'education'],
    preparationChecklist: [
      '신년 프로모션 기획 (할인율 15-30%)',
      '신년 결심 관련 카피 준비 ("새로운 시작", "변화")',
      '1월 한정 번들 상품 구성',
      '경쟁사 신년 세일 모니터링',
    ],
    budgetRecommendation: '월 예산의 20-25% 집중 투입',
    optimalPrepDays: 14,
  },
  {
    id: 'seollal-gift',
    name: '설 선물 시즌',
    date: new Date('2025-01-29'), // 2025년 설날
    impact: '선물셋트, 건강식품 수요 급증 (연중 2대 성수기)',
    relevantIndustries: ['food_beverage', 'health', 'ecommerce'],
    preparationChecklist: [
      '설 선물셋트 구성 및 패키징',
      '선물 추천 광고 소재 제작',
      '"명절 선물", "귀향 선물" 키워드 타겟팅',
      '배송 일정 안내 (설 연휴 전 배송 마감)',
    ],
    budgetRecommendation: '월 예산의 30-40% 집중 투입 (최대 성수기)',
    optimalPrepDays: 21,
  },

  // 2월
  {
    id: 'valentines-day',
    name: '밸런타인데이',
    date: new Date('2025-02-14'),
    impact: '초콜릿, 패션, 뷰티 수요 증가',
    relevantIndustries: ['food_beverage', 'fashion', 'beauty', 'ecommerce'],
    preparationChecklist: [
      '밸런타인 한정 상품 기획',
      '"선물", "커플", "로맨틱" 키워드 광고',
      '선물 포장 서비스 준비',
      '남성 타겟 리타겟팅 캠페인',
    ],
    budgetRecommendation: '월 예산의 25-30% (2월 1-13일 집중)',
    optimalPrepDays: 14,
  },

  // 3월
  {
    id: 'white-day',
    name: '화이트데이',
    date: new Date('2025-03-14'),
    impact: '남성의 답례 선물 구매 증가',
    relevantIndustries: ['beauty', 'fashion', 'food_beverage', 'ecommerce'],
    preparationChecklist: [
      '화이트데이 답례 선물 큐레이션',
      '여성 타겟 위시리스트 광고',
      '"화답", "답례" 카피 활용',
      '밸런타인 구매자 리타겟팅',
    ],
    budgetRecommendation: '월 예산의 20% (3월 1-13일)',
    optimalPrepDays: 10,
  },
  {
    id: 'spring-new-season',
    name: '봄 신상 시즌',
    date: new Date('2025-03-01'),
    impact: '패션, 뷰티 신상품 관심 증가',
    relevantIndustries: ['fashion', 'beauty', 'ecommerce'],
    preparationChecklist: [
      '봄 컬렉션 런칭',
      '"NEW", "신상", "봄 트렌드" 강조',
      '시즌 룩북 제작',
      '인플루언서 협업 콘텐츠',
    ],
    budgetRecommendation: '월 예산의 25-30%',
    optimalPrepDays: 21,
  },
  {
    id: 'back-to-school',
    name: '입학/개강 시즌',
    date: new Date('2025-03-03'),
    impact: '교육, 전자기기, 문구 수요 증가',
    relevantIndustries: ['education', 'ecommerce'],
    preparationChecklist: [
      '학생 할인 프로모션',
      '입학 준비물 패키지',
      '"개강", "새학기" 키워드 타겟팅',
      '학부모 타겟 광고',
    ],
    budgetRecommendation: '월 예산의 20%',
    optimalPrepDays: 14,
  },

  // 4월
  {
    id: 'cherry-blossom',
    name: '벚꽃 시즌',
    date: new Date('2025-04-05'),
    impact: '아웃도어, 여행, 뷰티 관심 증가',
    relevantIndustries: ['beauty', 'fashion', 'ecommerce'],
    preparationChecklist: [
      '봄나들이 상품 기획',
      '야외 활동 관련 광고 소재',
      '"벚꽃", "나들이", "피크닉" 키워드',
      '제주/전주 등 명소 지역 타겟팅',
    ],
    budgetRecommendation: '월 예산의 15-20%',
    optimalPrepDays: 10,
  },

  // 5월
  {
    id: 'family-month',
    name: '가정의 달',
    date: new Date('2025-05-01'),
    impact: '어린이날(5/5), 어버이날(5/8), 스승의날(5/15) 선물 구매',
    relevantIndustries: ['ecommerce', 'food_beverage', 'health', 'fashion'],
    preparationChecklist: [
      '5월 통합 선물 기획 (3세대 모두)',
      '어버이날 효도 선물 특집',
      '어린이날 완구/의류 프로모션',
      '"감사", "사랑", "효도" 감성 카피',
    ],
    budgetRecommendation: '월 예산의 30-35% (5월 전체 성수기)',
    optimalPrepDays: 21,
  },

  // 6월
  {
    id: 'summer-preseason',
    name: '여름 프리시즌',
    date: new Date('2025-06-01'),
    impact: '휴가 준비, 여름 패션 수요',
    relevantIndustries: ['fashion', 'beauty', 'ecommerce'],
    preparationChecklist: [
      '여름 신상 런칭',
      '휴가룩 큐레이션',
      '"휴가", "여행", "여름" 키워드',
      '수영복, 선크림 등 여름 필수템 광고',
    ],
    budgetRecommendation: '월 예산의 25%',
    optimalPrepDays: 14,
  },
  {
    id: 'bonus-season',
    name: '보너스 시즌',
    date: new Date('2025-06-15'),
    impact: '고가 구매, 자기 보상 소비',
    relevantIndustries: ['ecommerce', 'fashion', 'saas'],
    preparationChecklist: [
      '프리미엄 상품 기획',
      '분할 결제 프로모션',
      '"보너스", "자기 보상" 카피',
      '고가 상품 타겟팅 강화',
    ],
    budgetRecommendation: '월 예산의 20%',
    optimalPrepDays: 10,
  },

  // 7월
  {
    id: 'summer-vacation',
    name: '여름 휴가 시즌',
    date: new Date('2025-07-15'),
    impact: '여행, 레저, 의류 수요 피크',
    relevantIndustries: ['fashion', 'beauty', 'ecommerce'],
    preparationChecklist: [
      '휴가 필수템 패키지',
      '빠른 배송 서비스 강조',
      '"휴가", "바캉스" 키워드 최대 입찰',
      '해외여행 준비물 광고',
    ],
    budgetRecommendation: '월 예산의 30%',
    optimalPrepDays: 14,
  },
  {
    id: 'summer-sale',
    name: '썸머 세일',
    date: new Date('2025-07-20'),
    impact: '전 카테고리 프로모션 경쟁',
    relevantIndustries: ['ecommerce', 'fashion', 'beauty', 'food_beverage'],
    preparationChecklist: [
      '대규모 할인 이벤트 (20-50%)',
      '재고 정리 전략',
      '"세일", "특가" 키워드 광고',
      '쿠폰/적립금 프로모션',
    ],
    budgetRecommendation: '월 예산의 35-40% (최대 성수기)',
    optimalPrepDays: 21,
  },

  // 8월
  {
    id: 'fall-preseason',
    name: '가을 프리시즌',
    date: new Date('2025-08-20'),
    impact: '가을 신상 관심, 백투스쿨',
    relevantIndustries: ['fashion', 'education', 'ecommerce'],
    preparationChecklist: [
      '가을 신상 선공개',
      '백투스쿨 프로모션',
      '"신학기", "가을 준비" 키워드',
      '얼리버드 할인 이벤트',
    ],
    budgetRecommendation: '월 예산의 20%',
    optimalPrepDays: 14,
  },

  // 9월
  {
    id: 'chuseok-gift',
    name: '추석 선물 시즌',
    date: new Date('2025-10-06'), // 2025년 추석
    impact: '설 다음으로 큰 선물 시즌 (연중 2대 성수기)',
    relevantIndustries: ['food_beverage', 'health', 'ecommerce'],
    preparationChecklist: [
      '추석 선물셋트 기획',
      '조기배송 서비스 안내',
      '"명절 선물", "추석" 키워드 최대 입찰',
      '배송 마감일 카운트다운 광고',
    ],
    budgetRecommendation: '월 예산의 35-40% (9월 전체 최대 성수기)',
    optimalPrepDays: 21,
  },
  {
    id: 'fall-collection',
    name: '가을 신상',
    date: new Date('2025-09-01'),
    impact: '패션, 뷰티 가을 컬렉션',
    relevantIndustries: ['fashion', 'beauty', 'ecommerce'],
    preparationChecklist: [
      '가을 컬렉션 런칭',
      '가을 트렌드 룩북',
      '"신상", "F/W" 키워드',
      '환절기 스킨케어 광고',
    ],
    budgetRecommendation: '월 예산의 25%',
    optimalPrepDays: 14,
  },

  // 10월
  {
    id: 'fall-outdoor',
    name: '가을 아웃도어',
    date: new Date('2025-10-10'),
    impact: '단풍, 캠핑 관련 수요',
    relevantIndustries: ['ecommerce', 'fashion'],
    preparationChecklist: [
      '아웃도어/캠핑 용품 기획',
      '"단풍", "가을여행" 키워드',
      '여행지 지역 타겟팅',
      '가을 액티비티 광고 소재',
    ],
    budgetRecommendation: '월 예산의 15%',
    optimalPrepDays: 10,
  },
  {
    id: 'halloween',
    name: '핼러윈',
    date: new Date('2025-10-31'),
    impact: '파티용품, 코스튬, 뷰티 수요',
    relevantIndustries: ['ecommerce', 'beauty', 'food_beverage'],
    preparationChecklist: [
      '핼러윈 한정 상품 기획',
      '코스튬/메이크업 콘텐츠',
      '"핼러윈", "파티" 키워드',
      '20-30대 타겟 SNS 광고',
    ],
    budgetRecommendation: '월 예산의 10-15%',
    optimalPrepDays: 14,
  },

  // 11월
  {
    id: 'pepero-day',
    name: '빼빼로데이',
    date: new Date('2025-11-11'),
    impact: '간식, 선물 수요',
    relevantIndustries: ['food_beverage', 'ecommerce'],
    preparationChecklist: [
      '빼빼로 대체 선물 기획',
      '학생/직장인 타겟 광고',
      '"빼빼로데이", "11.11" 키워드',
      '빠른 배송 강조 (당일 배송)',
    ],
    budgetRecommendation: '월 예산의 10%',
    optimalPrepDays: 7,
  },
  {
    id: 'black-friday',
    name: '블랙프라이데이',
    date: new Date('2025-11-28'),
    impact: '최대 세일 시즌, 전 카테고리 (연중 최대 성수기)',
    relevantIndustries: ['ecommerce', 'fashion', 'beauty', 'saas', 'food_beverage', 'health'],
    preparationChecklist: [
      '연중 최대 할인 기획 (30-70%)',
      '선착순/한정수량 마케팅',
      '블프 전용 랜딩페이지 제작',
      '사이버먼데이 연계 전략',
      '재고 확보 및 배송 대응',
    ],
    budgetRecommendation: '월 예산의 40-50% (연중 최대 투자)',
    optimalPrepDays: 30,
  },
  {
    id: 'post-suneung',
    name: '수능 후 시즌',
    date: new Date('2025-11-14'),
    impact: '전자기기, 여행, 자기계발 수요',
    relevantIndustries: ['ecommerce', 'education', 'service'],
    preparationChecklist: [
      '수험생 특별 할인',
      '노트북/태블릿 프로모션',
      '"수험생", "수능 끝" 키워드',
      '운전학원/어학 광고',
    ],
    budgetRecommendation: '월 예산의 15%',
    optimalPrepDays: 10,
  },

  // 12월
  {
    id: 'christmas',
    name: '크리스마스',
    date: new Date('2025-12-25'),
    impact: '연말 선물, 파티, 데이트 수요',
    relevantIndustries: ['ecommerce', 'fashion', 'beauty', 'food_beverage'],
    preparationChecklist: [
      '크리스마스 선물 가이드',
      '커플/가족 타겟 광고',
      '"선물", "크리스마스" 키워드 최대 입찰',
      '12/23 이전 배송 마감 안내',
    ],
    budgetRecommendation: '월 예산의 30-35%',
    optimalPrepDays: 21,
  },
  {
    id: 'year-end-sale',
    name: '연말 세일',
    date: new Date('2025-12-26'),
    impact: '재고 정리, 대폭 할인',
    relevantIndustries: ['ecommerce', 'fashion', 'beauty'],
    preparationChecklist: [
      '재고 정리 대폭 할인 (40-70%)',
      '"연말정산", "세일" 키워드',
      '쿠폰 대량 발급',
      '다음 해 신상 예고',
    ],
    budgetRecommendation: '월 예산의 25-30%',
    optimalPrepDays: 14,
  },
]

/**
 * 업종별 관련 이벤트 필터링
 */
export function getEventsByIndustry(industry: string): MarketingEvent[] {
  return KOREAN_MARKETING_EVENTS.filter((event) => event.relevantIndustries.includes(industry))
}

/**
 * 다가오는 이벤트 조회 (N일 내)
 */
export function getUpcomingEvents(lookaheadDays: number, industry?: string): MarketingEvent[] {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + lookaheadDays)

  let events = KOREAN_MARKETING_EVENTS.filter((event) => {
    const eventDate = new Date(event.date)
    return eventDate >= now && eventDate <= future
  })

  if (industry) {
    events = events.filter((event) => event.relevantIndustries.includes(industry))
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * 준비 기간이 필요한 이벤트 조회
 * (이벤트 날짜 - 준비 권장 일수) 이내
 */
export function getEventsNeedingPreparation(industry?: string): MarketingEvent[] {
  const now = new Date()

  let events = KOREAN_MARKETING_EVENTS.filter((event) => {
    const eventDate = new Date(event.date)
    const prepStartDate = new Date(eventDate)
    prepStartDate.setDate(prepStartDate.getDate() - event.optimalPrepDays)

    return now >= prepStartDate && now <= eventDate
  })

  if (industry) {
    events = events.filter((event) => event.relevantIndustries.includes(industry))
  }

  return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * 특정 날짜의 이벤트 조회
 */
export function getEventByDate(date: Date): MarketingEvent | undefined {
  return KOREAN_MARKETING_EVENTS.find((event) => {
    const eventDate = new Date(event.date)
    return (
      eventDate.getFullYear() === date.getFullYear() &&
      eventDate.getMonth() === date.getMonth() &&
      eventDate.getDate() === date.getDate()
    )
  })
}
