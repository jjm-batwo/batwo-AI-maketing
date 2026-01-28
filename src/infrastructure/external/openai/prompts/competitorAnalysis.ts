/**
 * 경쟁사 광고 분석 AI 프롬프트
 */

import type { CompetitorAd } from '@application/services/CompetitorAnalysisService'
import type { AIConfig } from '@application/ports/IAIService'

export const COMPETITOR_ANALYSIS_SYSTEM_PROMPT = `당신은 한국 커머스 시장 전문 광고 애널리스트입니다.

**역할**:
- 경쟁사 Meta 광고 데이터를 분석하여 트렌드와 패턴을 파악
- 크리에이티브 전략, 메시징, 후크 기법 분석
- 실행 가능한 경쟁 전략 제안

**분석 기준**:
1. **후크 분석**: 광고 첫 문장/첫 3초에서 사용하는 후크 기법
2. **오퍼 분석**: 할인, 무료 배송, 사은품 등 제공 혜택
3. **메시징 전략**: 감성적/이성적, 긴급성, 사회적 증거
4. **타겟팅 추정**: 언어, 톤, 메시지로부터 타겟 오디언스 추정
5. **포맷 분석**: 싱글 이미지/캐러셀/비디오 등 크리에이티브 포맷

**한국 시장 컨텍스트**:
- 이모지, 강조 기호(!, ?, •••) 사용 빈도
- 존댓말/반말 사용 패턴
- 트렌디한 표현, 밈, 신조어 활용
- 리뷰/후기 강조 전략
- 가격 앵커링 기법

**출력 형식**: JSON
**언어**: 한국어`

export const COMPETITOR_TRENDS_AI_CONFIG: AIConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 2000,
}

export function buildCompetitorTrendsPrompt(input: {
  ads: CompetitorAd[]
  industry?: string
}): string {
  const adSamples = input.ads.slice(0, 30).map((ad, index) => ({
    index: index + 1,
    page: ad.pageName,
    body: ad.adCreativeBody.substring(0, 300), // 첫 300자만
    title: ad.adCreativeLinkTitle,
    lifespan: calculateAdLifespan(ad),
  }))

  return `
# 경쟁사 광고 트렌드 분석

## 업종
${input.industry || '일반'}

## 광고 샘플 (총 ${input.ads.length}개 중 30개)
${JSON.stringify(adSamples, null, 2)}

## 분석 요청
위 광고들을 분석하여 다음을 도출하세요:

1. **인기 후크 기법 Top 5** (popularHooks)
   - 가장 자주 사용되는 첫 문장/후크 패턴
   - 예시: "무료 배송", "오늘만 50%", "후기 4.9점", "신상 출시" 등

2. **공통 오퍼 전략** (commonOffers)
   - 할인율, 사은품, 무료 배송, 환불 보장 등
   - 구체적인 혜택 내용

3. **포맷 분포** (formatDistribution)
   - 각 광고의 포맷 추정 (short_copy/medium_copy/long_copy/carousel/video)
   - 포맷별 비율 (%)

출력 예시:
\`\`\`json
{
  "popularHooks": [
    "할인 프로모션 (예: 50% 할인, 오늘만)",
    "무료 혜택 (예: 무료 배송, 사은품 증정)",
    "사회적 증거 (예: 리뷰 4.9점, 만족도 99%)",
    "희소성 강조 (예: 한정 수량, 품절 임박)",
    "신제품 출시 (예: 신상 런칭, NEW 입고)"
  ],
  "commonOffers": [
    "30~50% 할인",
    "무료 배송 (3만원 이상)",
    "첫 구매 추가 할인",
    "리뷰 작성 시 사은품",
    "30일 환불 보장"
  ],
  "formatDistribution": [
    { "format": "short_copy", "percentage": 45 },
    { "format": "medium_copy", "percentage": 30 },
    { "format": "long_copy", "percentage": 15 },
    { "format": "carousel", "percentage": 10 }
  ]
}
\`\`\`
`
}

export const COMPETITOR_INSIGHTS_AI_CONFIG: AIConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.5,
  maxTokens: 1500,
}

export function buildCompetitorInsightsPrompt(input: {
  competitors: Array<{
    pageName: string
    adCount: number
    dominantFormats: string[]
    commonHooks: string[]
    averageAdLifespan: number
  }>
  trends: {
    popularHooks: string[]
    commonOffers: string[]
    formatDistribution: { format: string; percentage: number }[]
  }
  industry?: string
}): string {
  return `
# 경쟁사 인사이트 및 추천 전략

## 업종
${input.industry || '일반'}

## 경쟁사 요약
${JSON.stringify(input.competitors, null, 2)}

## 시장 트렌드
${JSON.stringify(input.trends, null, 2)}

## 요청
위 경쟁사 데이터와 시장 트렌드를 바탕으로 **실행 가능한 추천 전략 5개**를 제시하세요.

**추천 전략 기준**:
1. 경쟁사가 사용하는 효과적인 패턴을 학습하여 적용
2. 경쟁사가 하지 않는 차별화 포인트 발굴
3. 한국 시장 특성에 맞는 구체적 액션 아이템
4. 즉시 실행 가능한 크리에이티브/메시징 개선안

출력 형식: 문자열 배열 (JSON)

예시:
\`\`\`json
[
  "경쟁사 상위 후크 '할인 프로모션'을 활용하되, '첫 구매 고객 50% + 무료 배송' 같은 번들 오퍼로 차별화",
  "리뷰/평점 강조가 트렌드이므로, 광고 문구에 '만족도 4.9점', '재구매율 95%' 등 구체적 수치 포함",
  "경쟁사 평균 광고 수명 ${input.competitors[0]?.averageAdLifespan || 30}일 → 우리는 A/B 테스트를 통해 14일마다 크리에이티브 교체로 광고 피로도 방지",
  "경쟁사 대부분 short_copy 사용 → 우리는 스토리텔링 기반 medium_copy로 차별화 (고객 후기, 제품 개발 스토리)",
  "경쟁사가 사용하지 않는 '환불 보장', '무료 체험' 같은 리스크 제거 오퍼 추가로 전환율 개선"
]
\`\`\`
`
}

// ============ Helpers ============

function calculateAdLifespan(ad: CompetitorAd): number {
  const startDate = new Date(ad.startDate)
  const endDate = ad.endDate ? new Date(ad.endDate) : new Date()
  const days = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  return days
}
