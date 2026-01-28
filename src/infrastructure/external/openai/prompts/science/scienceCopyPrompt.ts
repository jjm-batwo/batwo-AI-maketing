import type { CompositeScore } from '@domain/value-objects/MarketingScience'

/**
 * Build a prompt for science-backed ad copy generation
 * Enhances the standard ad copy prompt with science analysis results
 */
export function buildScienceAdCopyPrompt(input: {
  productName: string
  productDescription: string
  targetAudience: string
  tone: 'professional' | 'casual' | 'playful' | 'urgent'
  objective: 'awareness' | 'consideration' | 'conversion'
  scienceScore: CompositeScore
  knowledgeContext: string
}): string {
  const weakDomains = input.scienceScore.domainScores
    .filter(ds => ds.score < 60)
    .map(ds => `- ${ds.domain}: ${ds.score}점 (${ds.grade})`)

  const topRecs = input.scienceScore.topRecommendations
    .slice(0, 3)
    .map(r => `- [${r.priority}] ${r.recommendation} (근거: ${r.scientificBasis})`)

  return `## 과학 기반 광고 카피 생성

### 제품 정보
- 제품명: ${input.productName}
- 설명: ${input.productDescription}
- 타겟: ${input.targetAudience}
- 톤: ${input.tone}
- 목표: ${input.objective}

### 과학 분석 결과
- 종합 점수: ${input.scienceScore.overall}/100 (${input.scienceScore.grade})
- 분석 도메인: ${input.scienceScore.analyzedDomains.length}개

${weakDomains.length > 0 ? `### 개선 필요 영역\n${weakDomains.join('\n')}` : ''}

### 핵심 개선 제안
${topRecs.join('\n')}

### 마케팅 과학 컨텍스트
${input.knowledgeContext}

### 요청사항
위 과학 분석 결과를 반영하여 3개의 광고 카피 변형을 생성하세요.
각 변형은:
1. 약점 영역을 의식적으로 보완해야 합니다
2. 제안된 개선안을 최소 1개 이상 적용해야 합니다
3. 적용한 과학적 원칙을 rationale에 명시해야 합니다

JSON 배열로 응답:
[
  {
    "headline": "헤드라인",
    "primaryText": "본문",
    "description": "설명",
    "callToAction": "CTA",
    "targetAudience": "타겟 세그먼트",
    "appliedPrinciples": ["적용한 과학적 원칙"],
    "rationale": "이 카피가 과학적으로 효과적인 이유"
  }
]`
}

/**
 * System prompt for science-backed copy generation
 */
export const SCIENCE_COPY_SYSTEM_PROMPT = `당신은 마케팅 과학(뇌과학, 행동경제학, 소비자 심리학)에 기반한 광고 카피 전문가입니다.

## 전문 역량
- Cialdini의 설득 7원칙을 실무에 적용
- Kahneman & Tversky의 인지 편향 이론 활용
- 뉴로마케팅 연구 기반 주의력/감정 최적화
- 한국 소비자 심리 및 문화적 맥락 이해
- SUCCESs 프레임워크 (Made to Stick) 적용

## 원칙
1. 모든 카피는 최소 2개 이상의 과학적 원칙에 기반
2. 한국어 자연스러움 유지 (번역투 금지)
3. 과학적 근거를 rationale에 명시
4. Meta Ads 글자 제한 준수 (headline ≤40자, primaryText ≤125자)
5. 유효한 JSON으로만 응답`
