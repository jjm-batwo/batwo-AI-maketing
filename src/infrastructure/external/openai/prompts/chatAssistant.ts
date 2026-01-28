/**
 * Chat Assistant Prompts
 *
 * RAG-based chatbot을 위한 시스템 프롬프트 및 질문 패턴 정의
 */

import type { AIConfig } from '@application/ports/IAIService'

// ============================================================================
// Pre-defined Query Patterns
// ============================================================================

/**
 * 일반적인 마케팅 질문 패턴 및 처리 전략
 */
export const QUERY_PATTERNS = {
  // ROAS 관련
  roasAnalysis: {
    keywords: ['roas', '로아스', '광고 수익률', '투자 대비'],
    subPatterns: {
      drop: ['떨어', '낮', '하락', '감소', '악화'],
      improve: ['개선', '향상', '높이', '올리'],
      comparison: ['비교', '평균', '벤치마크'],
    },
  },

  // 캠페인 확장/스케일링
  scaling: {
    keywords: ['확장', '스케일', '늘리', '증액', '키우'],
    considerations: [
      '타겟 오디언스 포화도',
      '현재 ROAS 안정성',
      '광고 피로도',
      '시장 경쟁 상황',
    ],
  },

  // 예산 배분
  budgetAllocation: {
    keywords: ['예산', '배분', '분배', '할당'],
    criteria: [
      'ROAS 기준 우선순위',
      '캠페인 목적별 분리',
      '시즌/이벤트 고려',
      '신규 vs 기존 캠페인 밸런스',
    ],
  },

  // 캠페인 중단
  campaignStop: {
    keywords: ['중단', '멈춤', '종료', '끄'],
    thresholds: {
      critical: 'ROAS < 0.5x',
      warning: 'ROAS < 1.0x',
      review: 'ROAS < 1.5x',
    },
  },

  // 크리에이티브 성과
  creativePerformance: {
    keywords: ['소재', '크리에이티브', '광고', '이미지', '영상', '텍스트'],
    metrics: ['CTR', '전환율', '피로도', 'Hook Rate'],
  },

  // 타겟팅
  targeting: {
    keywords: ['타겟', '오디언스', '대상', '고객'],
    topics: ['관심사', '행동', '인구통계', '룩어라이크', '리타게팅'],
  },

  // 경쟁사
  competitor: {
    keywords: ['경쟁사', '경쟁자', '다른 업체', '업계'],
    analysis: ['시장 점유율', 'CPM 비교', '크리에이티브 트렌드'],
  },

  // 시즌/트렌드
  seasonal: {
    keywords: ['시즌', '트렌드', '계절', '이벤트', '시기'],
    events: [
      '설날',
      '밸런타인',
      '화이트데이',
      '블랙프라이데이',
      '크리스마스',
      '연말',
    ],
  },
}

// ============================================================================
// System Prompts
// ============================================================================

/**
 * 메인 챗봇 시스템 프롬프트
 */
export const CHAT_ASSISTANT_SYSTEM_PROMPT = `당신은 한국 디지털 마케팅 전문 AI 어시스턴트 "바투 마케팅 봇"입니다.

**전문 분야:**
- Meta 광고 캠페인 최적화 (Facebook, Instagram)
- 이커머스 및 D2C 브랜드 마케팅
- 한국 소비자 행동 분석
- 데이터 기반 마케팅 의사결정

**핵심 역할:**
1. 사용자의 캠페인 데이터를 분석하여 맞춤형 인사이트 제공
2. 실행 가능한 액션 아이템 제시 (구체적 수치 포함)
3. 복잡한 마케팅 개념을 쉽게 설명
4. 한국 시장 맥락을 고려한 전략 제안

**응답 원칙:**
1. **구체성**: 모호한 조언 대신 명확한 액션 ("XX 캠페인 예산 30% 증액")
2. **근거**: 수치와 데이터 기반 권장사항 (ROAS, CPA, CTR 등)
3. **맥락**: 업종, 시즌, 시장 상황 고려
4. **실행 가능성**: 사용자가 바로 실행할 수 있는 형태
5. **명확성**: 비전문가도 이해할 수 있는 쉬운 언어

**제약사항:**
- 사용자 데이터가 없는 경우 일반적인 조언만 제공
- 불확실한 경우 "추가 데이터 분석이 필요합니다" 명시
- 절대적인 보장 대신 "일반적으로", "데이터 기반으로" 표현 사용

**성과 기준:**
- Excellent: ROAS 4x 이상
- Good: ROAS 2.5-4x
- Average: ROAS 1.5-2.5x
- Below Average: ROAS 1-1.5x
- Poor: ROAS 1x 미만

응답 언어: 한국어 (자연스럽고 친근한 톤)`

/**
 * 컨텍스트 주입 템플릿
 */
export function buildChatContextPrompt(context: {
  campaigns: Array<{
    name: string
    status: string
    roas: number
    spend: number
    conversions: number
  }>
  recentAnomalies: Array<{
    campaignName: string
    metric: string
    change: number
    severity: string
  }>
  totalSpend: number
  totalRevenue: number
}): string {
  const campaignList =
    context.campaigns.length > 0
      ? context.campaigns
          .map(
            (c) =>
              `- ${c.name} (${c.status}): ROAS ${c.roas.toFixed(2)}x, 지출 ₩${c.spend.toLocaleString('ko-KR')}, 전환 ${c.conversions}개`
          )
          .join('\n')
      : '- 활성 캠페인 없음'

  const anomalyList =
    context.recentAnomalies.length > 0
      ? context.recentAnomalies
          .map(
            (a) =>
              `- ${a.campaignName}: ${a.metric} ${a.change > 0 ? '+' : ''}${a.change.toFixed(1)}x (${a.severity})`
          )
          .join('\n')
      : '- 특이사항 없음'

  const overallRoas =
    context.totalSpend > 0 ? context.totalRevenue / context.totalSpend : 0

  return `
**사용자 캠페인 현황:**
${campaignList}

**전체 성과:**
- 총 지출: ₩${context.totalSpend.toLocaleString('ko-KR')}
- 총 매출: ₩${context.totalRevenue.toLocaleString('ko-KR')}
- 전체 ROAS: ${overallRoas.toFixed(2)}x

**최근 이상 징후:**
${anomalyList}
`
}

/**
 * 질문 분류 프롬프트
 */
export function buildQueryClassificationPrompt(message: string): string {
  return `다음 사용자 질문을 분류하세요:

질문: "${message}"

다음 중 하나로 분류:
1. roas_analysis - ROAS 분석 및 개선
2. scaling - 캠페인 확장/스케일링
3. budget_allocation - 예산 배분/재분배
4. campaign_stop - 캠페인 중단 결정
5. creative_performance - 소재/크리에이티브 성과
6. targeting - 타겟팅 최적화
7. competitor - 경쟁사 분석
8. seasonal - 시즌/트렌드 전략
9. general - 일반 문의

JSON 형식으로 응답:
{
  "category": "카테고리명",
  "confidence": 0.0-1.0,
  "keywords": ["감지된 키워드들"]
}`
}

// ============================================================================
// Response Templates
// ============================================================================

/**
 * 구조화된 응답 템플릿
 */
export interface ChatResponseTemplate {
  message: string
  sources?: Array<{
    type: 'campaign' | 'report' | 'anomaly'
    id: string
    name: string
  }>
  suggestedActions?: Array<{
    priority: 'high' | 'medium' | 'low'
    action: string
    campaignId?: string
    expectedImpact?: string
  }>
  suggestedQuestions?: string[]
}

/**
 * ROAS 개선 응답 템플릿
 */
export const ROAS_IMPROVEMENT_TEMPLATE: ChatResponseTemplate = {
  message: `ROAS를 개선하기 위한 전략:

1. **크리에이티브 최적화**
   - 성과가 낮은 광고 소재 교체
   - A/B 테스트를 통한 최적 조합 발견

2. **타겟팅 조정**
   - 전환율이 높은 오디언스에 집중
   - 룩어라이크 오디언스 활용

3. **입찰 전략**
   - 전환 목표 기반 입찰로 전환
   - 예산을 고성과 시간대에 집중

4. **랜딩 페이지**
   - 페이지 로딩 속도 개선
   - 전환 퍼널 최적화`,
  suggestedQuestions: [
    '어떤 크리에이티브가 가장 효과적인가요?',
    '타겟팅을 어떻게 조정해야 하나요?',
    '예산을 얼마나 줄여야 하나요?',
  ],
}

/**
 * 캠페인 확장 응답 템플릿
 */
export const SCALING_TEMPLATE: ChatResponseTemplate = {
  message: `안전한 캠페인 확장 가이드:

**확장 기준:**
- ROAS 2.5x 이상 안정적 유지 (최근 7일)
- 타겟 오디언스 포화도 50% 미만
- 광고 피로도 징후 없음

**확장 방법:**
1. **점진적 증액** (일일 예산 20-30%씩)
2. **성과 모니터링** (ROAS, CPA 변화 추적)
3. **오디언스 확장** (룩어라이크 1-3% 추가)

**주의사항:**
- 너무 빠른 확장은 ROAS 하락 유발
- 크리에이티브 다양성 확보 필수
- 주간 단위로 성과 검토`,
  suggestedQuestions: [
    '얼마나 빨리 예산을 늘려야 하나요?',
    '확장 시 ROAS가 떨어지면 어떻게 하나요?',
    '언제 확장을 멈춰야 하나요?',
  ],
}

// ============================================================================
// AI Configuration
// ============================================================================

export const CHAT_ASSISTANT_AI_CONFIG: AIConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.6, // 창의성과 일관성의 균형
  maxTokens: 2000,
  topP: 0.9,
}

/**
 * 빠른 응답용 설정 (간단한 질문)
 */
export const CHAT_QUICK_RESPONSE_AI_CONFIG: AIConfig = {
  model: 'gpt-4o-mini',
  temperature: 0.3,
  maxTokens: 500,
  topP: 0.8,
}
