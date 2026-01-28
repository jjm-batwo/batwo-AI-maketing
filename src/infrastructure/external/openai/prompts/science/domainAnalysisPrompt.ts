import type { KnowledgeDomain } from '@domain/value-objects/MarketingScience'

/**
 * Build a prompt for AI-assisted domain-specific analysis
 * Used when we need AI to provide deeper analysis beyond rule-based scoring
 */
export function buildDomainAnalysisPrompt(input: {
  domain: KnowledgeDomain
  headline?: string
  primaryText?: string
  industry?: string
  objective?: string
}): string {
  const domainPrompts: Record<KnowledgeDomain, string> = {
    neuromarketing: `뇌과학 관점에서 이 광고 콘텐츠를 분석하세요:
- 인지 부하 수준 (Miller의 7±2 법칙 기준)
- 감정적 처리 최적화 (Damasio의 소마틱 마커 이론)
- 주의력 확보 전략 (3초 법칙)
- 도파민 반응 유도 요소`,

    marketing_psychology: `마케팅 심리학 관점에서 분석하세요:
- 적용된 설득 원칙 (Cialdini 7원칙 중)
- 인지 편향 활용 (손실 회피, 앵커링, 프레이밍 등)
- 개선 가능한 심리적 트리거`,

    crowd_psychology: `군중 심리학 관점에서 분석하세요:
- 사회적 증거의 효과성
- FOMO/밴드왜건 효과 활용도
- 정보 캐스케이드 유도 가능성`,

    meta_best_practices: `Meta 광고 모범사례 기준으로 분석하세요:
- 광고 형식 최적화 (video > carousel > image)
- 텍스트 길이 최적화 (headline ≤27자, primaryText ≤125자)
- 모바일 피트니스
- CTA 효과성`,

    color_psychology: `색채 심리학 관점에서 분석하세요:
- 업종별 적합성
- 한국 문화적 맥락
- 색상 대비 및 가독성
- 감정적 연상`,

    copywriting_psychology: `카피라이팅 심리학 관점에서 분석하세요:
- 파워워드 활용도
- 헤드라인 품질 (길이, 훅)
- SUCCESs 프레임워크 적용
- CTA 심리적 효과`,
  }

  const contextParts: string[] = []
  if (input.headline) contextParts.push(`헤드라인: "${input.headline}"`)
  if (input.primaryText) contextParts.push(`본문: "${input.primaryText}"`)
  if (input.industry) contextParts.push(`업종: ${input.industry}`)
  if (input.objective) contextParts.push(`목표: ${input.objective}`)

  return `${domainPrompts[input.domain]}

### 분석 대상
${contextParts.join('\n')}

JSON 형식으로 응답하세요:
{
  "score": 0-100 사이의 점수,
  "strengths": ["강점 1", "강점 2"],
  "weaknesses": ["약점 1", "약점 2"],
  "recommendations": ["개선안 1", "개선안 2"]
}`
}
