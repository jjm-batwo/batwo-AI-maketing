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

    creative_diversity: `크리에이티브 다양성 관점에서 (Meta Andromeda/Lattice 관점) 분석하세요:
- Entity ID 중복 최소화 여부
- 시각적 이질성 (텍스트나 배치 변경이 아닌 본질적 시각적 차이)
- 피로도 가중 가능성`,

    campaign_structure: `캠페인 파편화 관점에서 (Advantage+ 기준) 분석하세요:
- 캠페인/광고세트의 적절한 통합 여부
- 예산이 충분한 데이터를 수집할 만큼 집중되어 있는지
- 계정 내 옥션 자기잠식(Cannibalization) 위험도`,

    tracking_health: `트래킹 건전성 관점에서 분석하세요:
- EMQ(Event Match Quality) 점수 향상 가능성
- CAPI(Conversions API) 및 사용자 파라미터 수집 여부
- 쿠키리스 시대 대비 상태`,
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
