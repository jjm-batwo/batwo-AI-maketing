import type { GenerateAdCopyInput, AIConfig } from '@application/ports/IAIService'
import { KoreanMarketCalendar } from '@domain/value-objects/KoreanMarketCalendar'

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

/**
 * 업종별 성공 카피 예시 데이터베이스
 */
export const INDUSTRY_COPY_EXAMPLES: Record<
  Industry,
  Array<{
    hook: CopyHookType
    headline: string
    primaryText: string
    description: string
    cta: string
    performance: { ctr: number; cvr: number }
  }>
> = {
  ecommerce: [
    {
      hook: 'urgency',
      headline: '오늘 자정까지 50% 특가',
      primaryText:
        '연중 최저가! 지금 놓치면 1년 기다려야 해요. 이미 2,847명이 구매했어요.',
      description: '무료배송 + 추가 10% 쿠폰',
      cta: '지금 구매하기',
      performance: { ctr: 2.1, cvr: 4.2 },
    },
    {
      hook: 'benefit',
      headline: '첫 구매 30% + 무료배송',
      primaryText:
        '신규 고객님을 위한 특별 혜택! 가입만 해도 5천원 쿠폰이 즉시 지급됩니다.',
      description: '오늘 가입 시 추가 혜택',
      cta: '혜택 받기',
      performance: { ctr: 1.8, cvr: 3.5 },
    },
    {
      hook: 'fear_of_missing',
      headline: '품절임박 🔥 마지막 50개',
      primaryText:
        '재입고 미정! 올해 가장 많이 팔린 인기템. 지금 아니면 구하기 어려워요.',
      description: '리뷰 4.9점 베스트셀러',
      cta: '바로 구매',
      performance: { ctr: 2.3, cvr: 3.8 },
    },
  ],
  food_beverage: [
    {
      hook: 'curiosity',
      headline: '줄서서 먹는 그 맛집, 집에서',
      primaryText:
        '웨이팅 2시간 맛집 셰프가 직접 만든 밀키트. 15분이면 레스토랑 그 맛 그대로!',
      description: '첫 주문 40% 할인',
      cta: '맛보기',
      performance: { ctr: 2.4, cvr: 4.1 },
    },
    {
      hook: 'social_proof',
      headline: '10만 명이 선택한 맛',
      primaryText:
        '리뷰 평점 4.9점! "이 가격에 이 맛?" 재구매율 78%의 비결을 직접 확인하세요.',
      description: '무료 배송 + 사은품',
      cta: '주문하기',
      performance: { ctr: 2.0, cvr: 3.6 },
    },
  ],
  beauty: [
    {
      hook: 'authority',
      headline: '피부과 전문의가 만든 세럼',
      primaryText:
        '임상 테스트 완료! 2주 만에 피부 톤 개선 93%. 민감성 피부도 안심하세요.',
      description: '지금 구매 시 미니어처 증정',
      cta: '자세히 보기',
      performance: { ctr: 1.9, cvr: 3.2 },
    },
    {
      hook: 'social_proof',
      headline: '인플루언서들의 픽 🏆',
      primaryText:
        '뷰티 유튜버 100명 중 87명이 추천! "이건 진짜 효과 있어요" 직접 써보세요.',
      description: '7일 무료 체험',
      cta: '체험하기',
      performance: { ctr: 2.2, cvr: 2.8 },
    },
  ],
  fashion: [
    {
      hook: 'fear_of_missing',
      headline: '한정 수량 100개 오픈',
      primaryText:
        '인스타 핫템! 예약 오픈 10분 만에 품절됐던 그 아이템이 드디어 재입고.',
      description: '무료 반품 보장',
      cta: '지금 구매',
      performance: { ctr: 2.1, cvr: 2.9 },
    },
    {
      hook: 'curiosity',
      headline: '연예인 공항패션의 비밀',
      primaryText:
        '스타일리스트가 공개하는 세련된 코디 비법. 이 한 벌로 5가지 룩 완성!',
      description: '신규 가입 20% 할인',
      cta: '스타일 보기',
      performance: { ctr: 1.7, cvr: 2.4 },
    },
  ],
  education: [
    {
      hook: 'authority',
      headline: '합격률 94% 강의 공개',
      primaryText:
        '전 수강생 15,000명 중 14,100명 합격! 검증된 커리큘럼으로 단기 합격하세요.',
      description: '7일 무료 수강 + 교재 증정',
      cta: '무료 체험',
      performance: { ctr: 1.4, cvr: 2.8 },
    },
    {
      hook: 'fear_of_missing',
      headline: '조기마감 예상 📢',
      primaryText:
        '지난 기수 3일 만에 마감! 합격자 배출 1위 강사의 직강. 지금 신청해야 다음 달 시작.',
      description: '얼리버드 30% 할인',
      cta: '신청하기',
      performance: { ctr: 1.2, cvr: 2.5 },
    },
  ],
  service: [
    {
      hook: 'benefit',
      headline: '무료 방문 견적 + 10% 할인',
      primaryText:
        '전문가가 직접 방문해 정확한 견적을 드려요. 타사 대비 평균 15% 저렴합니다.',
      description: '24시간 예약 가능',
      cta: '견적 요청',
      performance: { ctr: 1.3, cvr: 3.1 },
    },
    {
      hook: 'authority',
      headline: '20년 경력 전문가 상담',
      primaryText:
        '누적 시공 10,000건! 업계 1위 업체가 A/S까지 책임집니다. 무료 상담 먼저 받아보세요.',
      description: '1년 무상 A/S 보장',
      cta: '상담 신청',
      performance: { ctr: 1.1, cvr: 2.7 },
    },
  ],
  saas: [
    {
      hook: 'benefit',
      headline: '업무 시간 50% 단축',
      primaryText:
        '반복 작업은 AI에게 맡기세요. 도입 기업 평균 월 120시간 절약. 지금 무료로 시작하세요.',
      description: '14일 무료 체험',
      cta: '무료 시작',
      performance: { ctr: 1.0, cvr: 2.2 },
    },
    {
      hook: 'social_proof',
      headline: '스타트업 500개사가 선택',
      primaryText:
        '"도입 후 매출 30% 증가" - OO기업 대표. 왜 모두가 이 솔루션을 선택하는지 확인하세요.',
      description: '데모 요청 시 컨설팅 무료',
      cta: '데모 신청',
      performance: { ctr: 0.9, cvr: 1.8 },
    },
  ],
  health: [
    {
      hook: 'authority',
      headline: '의사가 추천하는 영양제',
      primaryText:
        '식약처 인증 완료! 흡수율 3배 높은 특허 성분. 3개월 꾸준히 드시면 변화가 느껴집니다.',
      description: '첫 구매 40% 할인',
      cta: '자세히 보기',
      performance: { ctr: 1.5, cvr: 3.0 },
    },
    {
      hook: 'emotional',
      headline: '가족 건강, 미리 챙기세요',
      primaryText:
        '부모님께 드리기 좋은 건강 선물. 국내산 원료만 사용해 안심하고 드실 수 있어요.',
      description: '선물 포장 무료',
      cta: '선물하기',
      performance: { ctr: 1.3, cvr: 2.6 },
    },
  ],
}

/**
 * 시즌/이벤트 컨텍스트 생성
 */
function getSeasonalContext(date: Date = new Date()): string {
  const calendar = new KoreanMarketCalendar()
  const dateInfo = calendar.getDateEventInfo(date)

  const contexts: string[] = []

  if (dateInfo.isSpecialDay) {
    const eventNames = dateInfo.events.map((e: { name: string }) => e.name).join(', ')
    contexts.push(`현재 시점: ${eventNames} 시즌`)

    const spendChange = dateInfo.combinedExpectedChange.spend
    if (spendChange.max > 30) {
      contexts.push('광고비 경쟁이 치열한 시기이므로 차별화된 카피가 중요합니다.')
    }
  }

  const month = date.getMonth() + 1
  const seasonContexts: Record<number, string> = {
    1: '새해/신년 시즌 - 새로운 시작, 다짐 관련 메시지 효과적',
    2: '설날 시즌 - 선물, 가족, 효도 테마 효과적',
    3: '봄 시즌 - 새학기, 이사, 새출발 테마 효과적',
    4: '봄 시즌 - 야외활동, 여행 테마 효과적',
    5: '가정의 달 - 어버이날, 어린이날 선물 테마 효과적',
    6: '여름 준비 시즌 - 다이어트, 피부관리 테마 효과적',
    7: '휴가 시즌 - 여행, 레저, 휴식 테마 효과적',
    8: '휴가/개학 시즌 - 여행 후반, 개학 준비 테마 효과적',
    9: '추석 시즌 - 선물, 가족, 명절 테마 효과적',
    10: '가을 시즌 - 단풍, 아웃도어, 환절기 테마 효과적',
    11: '쇼핑 시즌 - 빼빼로데이, 블랙프라이데이 할인 테마 효과적',
    12: '연말 시즌 - 크리스마스, 송년, 선물 테마 효과적',
  }

  if (seasonContexts[month]) {
    contexts.push(seasonContexts[month])
  }

  return contexts.length > 0 ? contexts.join('\n') : '일반 시즌'
}

/**
 * 업종별 컨텍스트 생성
 */
function getIndustryContext(industry?: Industry): string {
  if (!industry || !INDUSTRY_BENCHMARKS[industry]) {
    return '업종이 지정되지 않았습니다. 일반적인 마케팅 원칙을 적용합니다.'
  }

  const benchmark = INDUSTRY_BENCHMARKS[industry]
  const examples = INDUSTRY_COPY_EXAMPLES[industry]

  const topPerformingExample = examples.reduce((best, current) =>
    current.performance.ctr > best.performance.ctr ? current : best
  )

  return `
## 업종 분석: ${industry.toUpperCase()}

### 벤치마크
- 평균 CTR: ${benchmark.avgCTR}%
- 평균 CVR: ${benchmark.avgCVR}%
- 효과적인 키워드: ${benchmark.topKeywords.join(', ')}
- 최적 노출 시간대: ${benchmark.peakHours.map((h) => `${h}시`).join(', ')}
- 효과적인 훅 유형: ${benchmark.bestPerformingHooks.join(', ')}

### 카피 작성 팁
- 헤드라인: ${benchmark.characterTips.headline}
- 본문: ${benchmark.characterTips.primaryText}

### 성공 사례 (CTR ${topPerformingExample.performance.ctr}%)
- 훅: ${topPerformingExample.hook}
- 헤드라인: "${topPerformingExample.headline}"
- 본문: "${topPerformingExample.primaryText}"
- CTA: "${topPerformingExample.cta}"
`.trim()
}

/**
 * 훅 타입별 가이드라인
 */
const HOOK_GUIDELINES: Record<CopyHookType, string> = {
  benefit:
    '혜택/가치를 직접적으로 전달. 고객이 얻는 구체적 이점 명시. 숫자/비율 활용.',
  urgency:
    '긴급성/희소성 강조. 기한, 수량 제한 명시. "오늘만", "마감임박" 등 활용.',
  social_proof:
    '사회적 증거 활용. 구매자 수, 리뷰 점수, 추천인 언급. "~명이 선택" 패턴.',
  curiosity:
    '호기심 유발. 질문형, 비밀 공개, 반전 등 활용. 클릭 유도하는 미완결 문장.',
  fear_of_missing:
    'FOMO 자극. 놓치면 후회할 것 같은 느낌. "다시 안 옴", "품절임박" 등.',
  authority:
    '권위/전문성 강조. 전문가 추천, 인증, 수상 경력, 경력/실적 언급.',
  emotional:
    '감정적 연결. 공감, 스토리텔링, 가치관 호소. 브랜드 철학이나 의미 전달.',
}

/**
 * 확장된 카피 생성 입력 타입
 */
export interface EnhancedAdCopyInput extends GenerateAdCopyInput {
  industry?: Industry
  preferredHooks?: CopyHookType[]
  includeABVariants?: boolean
  competitorContext?: string
}

/**
 * A/B 테스트를 위한 변형 생성 지시
 */
function getABTestingInstructions(
  preferredHooks?: CopyHookType[],
  includeABVariants?: boolean
): string {
  if (!includeABVariants) {
    return ''
  }

  const hooks =
    preferredHooks && preferredHooks.length > 0
      ? preferredHooks
      : (['benefit', 'urgency', 'social_proof'] as CopyHookType[])

  const hookGuides = hooks
    .map((hook) => `- ${hook}: ${HOOK_GUIDELINES[hook]}`)
    .join('\n')

  return `
## A/B 테스트 변형 생성

각 변형은 서로 다른 심리적 훅(hook)을 사용해야 합니다:
${hookGuides}

각 변형에 대해 다음을 추가로 제공하세요:
- hookType: 사용된 훅 유형
- predictedCTR: 예상 CTR (업종 벤치마크 기준)
- rationale: 이 접근법을 선택한 이유 (1문장)
`.trim()
}

/**
 * 고도화된 광고 카피 프롬프트 빌더
 */
export function buildAdCopyPrompt(input: GenerateAdCopyInput): string {
  const enhancedInput = input as EnhancedAdCopyInput
  const {
    productName,
    productDescription,
    targetAudience,
    tone,
    objective,
    keywords,
    variantCount = 3,
    industry,
    preferredHooks,
    includeABVariants,
    competitorContext,
  } = enhancedInput

  const keywordsText = keywords?.length
    ? `포함할 키워드: ${keywords.join(', ')}`
    : ''

  const seasonalContext = getSeasonalContext()
  const industryContext = getIndustryContext(industry)
  const abTestingInstructions = getABTestingInstructions(
    preferredHooks,
    includeABVariants
  )

  const competitorSection = competitorContext
    ? `
## 경쟁사 컨텍스트
${competitorContext}
차별화된 메시지로 경쟁 우위를 확보하세요.
`
    : ''

  const baseOutputFormat = includeABVariants
    ? `{
    "headline": "헤드라인 (최대 40자, 한글 기준)",
    "primaryText": "본문 (최대 125자, 핵심 메시지)",
    "description": "설명 (최대 30자)",
    "callToAction": "CTA 버튼 텍스트",
    "targetAudience": "이 변형이 타겟하는 구체적 세그먼트",
    "hookType": "사용된 훅 유형 (benefit/urgency/social_proof/curiosity/fear_of_missing/authority/emotional)",
    "predictedCTR": 예상 CTR 수치 (예: 1.5),
    "rationale": "이 접근법을 선택한 이유"
  }`
    : `{
    "headline": "헤드라인 (최대 40자, 한글 기준)",
    "primaryText": "본문 (최대 125자, 핵심 메시지)",
    "description": "설명 (최대 30자)",
    "callToAction": "CTA 버튼 텍스트",
    "targetAudience": "이 변형이 타겟하는 구체적 세그먼트"
  }`

  return `다음 제품/서비스에 대한 ${variantCount}개의 광고 카피 변형을 생성해주세요.

## 제품 정보
- 제품명: ${productName}
- 설명: ${productDescription}
- 타겟 오디언스: ${targetAudience}
- 톤앤매너: ${tone}
- 캠페인 목표: ${objective}
${keywordsText}

## 한국 시장 컨텍스트
${seasonalContext}

${industryContext}

${competitorSection}

${abTestingInstructions}

## 출력 형식
정확히 ${variantCount}개의 변형을 JSON 배열로 반환하세요:
[
  ${baseOutputFormat}
]

## 작성 원칙
1. 각 변형은 서로 다른 접근법/각도를 사용하세요
2. 한국어 자연스러움을 우선시하세요 (직역체 금지)
3. 캠페인 목표(${objective})에 맞는 CTA를 선택하세요
4. 글자 수 제한을 반드시 준수하세요 (한글 기준)
5. 업종 특성과 시즌 트렌드를 반영하세요
6. 클릭을 유도하되, 과장/허위 표현은 피하세요`
}

/**
 * 고도화된 시스템 프롬프트
 */
export const AD_COPY_SYSTEM_PROMPT = `당신은 한국 디지털 광고 시장 전문 카피라이터입니다.
Meta Ads(Facebook/Instagram) 플랫폼에 최적화된 전환 중심 광고 카피를 작성합니다.

## 전문 역량
- 한국 소비자 심리와 구매 패턴에 대한 깊은 이해
- 업종별 성공 카피 패턴 및 벤치마크 숙지
- A/B 테스트 설계 및 훅(hook) 전략 전문가
- 계절성, 트렌드, 이벤트 시즌 마케팅 경험

## 작성 원칙
1. **한국어 자연스러움**: 번역투 금지, 네이티브 화자처럼 작성
2. **혜택 중심**: 기능보다 고객이 얻는 가치 강조
3. **감정적 트리거**: 적절한 심리적 훅 활용
4. **명확한 CTA**: 행동을 유도하는 구체적 동사 사용
5. **브랜드 톤**: 요청된 톤앤매너 철저히 준수

## Meta Ads 글자 제한 (한글 기준)
- 헤드라인: 40자 이내 (짧을수록 효과적)
- 본문(Primary Text): 125자 이내 (첫 줄이 가장 중요)
- 설명(Description): 30자 이내

## 금지 사항
- 과장/허위 표현 (최고, 유일, 100% 등 검증 불가 표현)
- 경쟁사 직접 비방
- 불쾌감을 주는 자극적 표현
- 저작권/상표권 침해 가능성 있는 표현

## 응답 형식
반드시 유효한 JSON 배열로만 응답하세요.
JSON 외 다른 텍스트나 설명을 포함하지 마세요.`

/**
 * 광고 카피 생성 AI 설정
 * - 높은 temperature: 창의적이고 다양한 카피 생성
 * - gpt-4o: 카피 품질을 위해 더 강력한 모델 사용
 */
export const AD_COPY_AI_CONFIG: AIConfig = {
  model: 'gpt-4o',
  temperature: 0.8,
  maxTokens: 2500,
  topP: 0.95,
}
