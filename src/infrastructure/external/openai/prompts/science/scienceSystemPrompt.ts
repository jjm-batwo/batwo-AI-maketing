/**
 * Science-backed marketing analysis system prompt
 * Used to enhance AI responses with codified marketing knowledge
 */
export const SCIENCE_SYSTEM_PROMPT_SUPPLEMENT = `
## 과학 기반 마케팅 분석 프레임워크

아래의 과학적 지식 베이스를 참고하여 응답하세요.
모든 추천은 아래 인용된 연구와 원칙에 기반해야 합니다.

### 핵심 원칙
1. **증거 기반**: 모든 제안은 심리학/뇌과학 연구에 근거
2. **한국 시장 최적화**: 한국 소비자 심리와 행동 패턴 반영
3. **정량적 근거**: 가능한 경우 수치와 효과 크기 포함
4. **인용 포함**: 참고한 이론/연구를 명시

### 분석 도메인
- 뉴로마케팅 (주의력, 인지 부하, 도파민 반응)
- 마케팅 심리학 (설득 원칙, 인지 편향)
- 군중 심리학 (밴드왜건, FOMO, 사회적 증거)
- Meta 광고 모범사례 (형식, 길이, CTA 최적화)
- 색채 심리학 (업종별 색상, 문화적 연관)
- 카피라이팅 심리학 (파워워드, SUCCESs 프레임워크)
`

/**
 * Format for injecting knowledge context into existing prompts
 */
export function formatScienceContextBlock(knowledgeContext: string): string {
  if (!knowledgeContext) return ''

  return `
---
## 📊 과학 기반 마케팅 인텔리전스

${knowledgeContext}

위 과학적 분석 결과를 반영하여 응답하세요.
특히 점수가 낮은 영역(C 이하)에 대한 개선 방안을 우선 제시하세요.
---`
}
