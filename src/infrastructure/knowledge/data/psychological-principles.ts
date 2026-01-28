/**
 * Codified psychological principles for marketing analysis.
 * Based on peer-reviewed research and established frameworks.
 */

// Cialdini's 7 Principles of Persuasion (2021 edition)
export const CIALDINI_PRINCIPLES = {
  reciprocity: {
    name: '상호성',
    description: '무언가를 받으면 되돌려주고 싶은 심리',
    source: 'Cialdini (2021)',
    year: 2021,
    koreanTriggers: ['무료', '증정', '선물', '사은품', '혜택', '보너스'],
    applicationGuideline: '무료 샘플, 가치 있는 콘텐츠 제공 후 구매 유도',
  },
  commitment: {
    name: '일관성',
    description: '이전 행동과 일관되게 행동하려는 경향',
    source: 'Cialdini (2021)',
    year: 2021,
    koreanTriggers: ['시작', '첫걸음', '도전', '참여', '가입'],
    applicationGuideline: '소규모 커밋먼트(뉴스레터 구독)로 시작하여 큰 전환으로 유도',
  },
  socialProof: {
    name: '사회적 증거',
    description: '다른 사람들의 행동을 따르는 심리',
    source: 'Cialdini (2021)',
    year: 2021,
    koreanTriggers: ['인기', '베스트', '추천', '리뷰', '후기', '만족', '선택', '1위'],
    applicationGuideline: '구매 수, 리뷰 수, 평점을 강조하여 신뢰 구축',
  },
  authority: {
    name: '권위',
    description: '전문가나 권위자의 의견을 따르는 경향',
    source: 'Cialdini (2021)',
    year: 2021,
    koreanTriggers: ['전문가', '박사', '인증', '특허', '수상', '공식', '검증'],
    applicationGuideline: '전문가 추천, 인증 마크, 수상 이력 활용',
  },
  liking: {
    name: '호감',
    description: '좋아하는 사람이나 브랜드의 요청에 응하는 심리',
    source: 'Cialdini (2021)',
    year: 2021,
    koreanTriggers: ['친근', '함께', '우리', '당신', '특별한'],
    applicationGuideline: '친근한 톤, 공감대 형성, 스토리텔링 활용',
  },
  scarcity: {
    name: '희소성',
    description: '제한된 것에 더 높은 가치를 느끼는 심리',
    source: 'Cialdini (2021)',
    year: 2021,
    koreanTriggers: ['한정', '마감', '품절임박', '오늘만', '단독', '선착순', '한정판'],
    applicationGuideline: '수량 제한, 시간 제한, 독점 오퍼 강조',
  },
  unity: {
    name: '일체감',
    description: '같은 그룹에 속한다는 느낌이 설득력을 높임',
    source: 'Cialdini (2021)',
    year: 2021,
    koreanTriggers: ['우리', '함께', '동료', '가족', '커뮤니티', '멤버'],
    applicationGuideline: '소속감, 공동체 의식, 브랜드 커뮤니티 활용',
  },
} as const

export type CialdiniPrinciple = keyof typeof CIALDINI_PRINCIPLES

// Cognitive Biases relevant to marketing
export const COGNITIVE_BIASES = {
  lossAversion: {
    name: '손실 회피',
    description: '이익보다 손실에 2.5배 더 민감하게 반응',
    source: 'Kahneman & Tversky (1979)',
    year: 1979,
    multiplier: 2.5,
    koreanTriggers: ['놓치지', '잃지', '후회', '마지막', '기회'],
    applicationGuideline: '"지금 안 사면 놓칩니다" 프레이밍이 "지금 사면 얻습니다"보다 효과적',
  },
  anchoringBias: {
    name: '앵커링 효과',
    description: '처음 접한 숫자가 이후 판단의 기준이 됨',
    source: 'Tversky & Kahneman (1974)',
    year: 1974,
    koreanTriggers: ['원래', '정가', '~에서', '할인', '대비'],
    applicationGuideline: '높은 정가를 먼저 보여준 후 할인가 제시',
  },
  framingEffect: {
    name: '프레이밍 효과',
    description: '같은 정보라도 제시 방식에 따라 다르게 인식',
    source: 'Tversky & Kahneman (1981)',
    year: 1981,
    koreanTriggers: [],
    applicationGuideline: '"95% 만족" > "5% 불만족", 긍정적 프레이밍 활용',
  },
  endowmentEffect: {
    name: '소유 효과',
    description: '소유한 것에 더 높은 가치를 부여',
    source: 'Thaler (1980)',
    year: 1980,
    koreanTriggers: ['내', '나의', '당신의', '소장'],
    applicationGuideline: '"내 쿠폰 받기" > "쿠폰 받기", 소유감 프레이밍',
  },
  decoyEffect: {
    name: '미끼 효과',
    description: '비대칭 옵션이 특정 선택지를 더 매력적으로 만듦',
    source: 'Huber, Payne & Puto (1982)',
    year: 1982,
    koreanTriggers: [],
    applicationGuideline: '3가지 가격 옵션 제시 시 중간 옵션 구매율 증가',
  },
} as const

export type CognitiveBias = keyof typeof COGNITIVE_BIASES

// Neuromarketing Constants
export const NEUROMARKETING_CONSTANTS = {
  cognitiveLoad: {
    maxFocalPoints: 5,
    optimalFocalPoints: 3,
    maxWordsStaticAd: 20,
    optimalWordsStaticAd: 12,
    maxCharactersHeadline: 40,
    optimalCharactersHeadline: 25,
    source: 'Miller (1956), Sweller (1988)',
  },
  attentionSpan: {
    criticalFirstSeconds: 3,
    averageAdViewSeconds: 1.7,
    mobileScrollSpeedMs: 300,
    source: 'Davenport & Beck (2001), Meta Internal Data (2024)',
  },
  emotionalProcessing: {
    subconsciousDecisionPercent: 95,
    emotionalVsRationalRatio: 0.8,
    source: 'Damasio (1994), LeDoux (1996)',
  },
  dopamineResponse: {
    anticipationMultiplier: 1.5,
    noveltyBoostPercent: 30,
    source: 'Schultz (1997), Berridge & Robinson (1998)',
  },
} as const

// SUCCESs Framework (Made to Stick)
export const SUCCESS_FRAMEWORK = {
  simple: {
    name: '단순성',
    description: '핵심 메시지를 간결하게',
    source: 'Heath & Heath (2007)',
    check: '주요 메시지가 한 문장으로 요약 가능한가?',
  },
  unexpected: {
    name: '의외성',
    description: '예상을 깨는 요소로 주의 환기',
    source: 'Heath & Heath (2007)',
    check: '예상치 못한 사실이나 통계가 있는가?',
  },
  concrete: {
    name: '구체성',
    description: '추상적이 아닌 구체적 표현',
    source: 'Heath & Heath (2007)',
    check: '숫자, 사례, 구체적 묘사가 있는가?',
  },
  credible: {
    name: '신뢰성',
    description: '증거와 권위로 뒷받침',
    source: 'Heath & Heath (2007)',
    check: '통계, 전문가 인용, 인증이 있는가?',
  },
  emotional: {
    name: '감성',
    description: '감정적 반응을 유발',
    source: 'Heath & Heath (2007)',
    check: '읽는 사람의 감정을 움직이는가?',
  },
  stories: {
    name: '스토리',
    description: '이야기 구조로 전달',
    source: 'Heath & Heath (2007)',
    check: '상황-전개-결과의 스토리가 있는가?',
  },
} as const
