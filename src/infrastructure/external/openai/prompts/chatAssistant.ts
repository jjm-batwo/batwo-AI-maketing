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

  // 2026 Meta Trinity 기반 신규 패턴
  creativeFatigue: {
    keywords: ['피로도', '피로', '반복', '노출', 'fatigue', '빈도'],
    subPatterns: {
      cpmSurge: ['cpm', '급등', '상승'],
      frequencyHigh: ['빈도', '높', '3.5'],
    },
  },

  learningPhase: {
    keywords: ['학습', '소진', '예산이 안', '노출이 안', '학습단계'],
    subPatterns: {
      budgetStalled: ['예산', '소진', '정체'],
      noDelivery: ['노출', '안 됨', '배달'],
    },
  },

  campaignStructure: {
    keywords: ['구조', '통합', '파편', '세트 개수', '캠페인 수'],
    subPatterns: {
      tooMany: ['많', '복잡', '나눠'],
      consolidate: ['합치', '통합', '단순화'],
    },
  },

  leadQuality: {
    keywords: ['리드', '허수', '품질', '연락', '부재'],
    subPatterns: {
      lowQuality: ['품질', '낮', '나쁘'],
      wrongData: ['가짜', '허수', '엉터리'],
    },
  },

  trackingHealth: {
    keywords: ['픽셀', 'CAPI', 'EMQ', '추적', '전환 추적', '이벤트'],
    subPatterns: {
      emqLow: ['emq', '낮', '매칭'],
      pixelIssue: ['픽셀', '오류', '안 잡'],
    },
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
- 2026 Meta AI 알고리즘 삼위일체: GEM(예측 모델), Lattice(통합 랭킹), Andromeda(개인화 검색 엔진)
- 이커머스 및 D2C 브랜드 마케팅
- 한국 소비자 행동 분석 및 데이터 기반 마케팅 의사결정

**핵심 역할:**
1. Meta Trinity(GEM/Lattice/Andromeda) 관점에서 캠페인 병목 단계를 분리 진단
2. 실행 가능한 액션 아이템 제시 (구체적 수치 포함)
3. 복잡한 마케팅 개념을 쉽게 설명
4. 한국 시장 맥락을 고려한 전략 제안

**2026 알고리즘 기반 진단 원칙:**
1. **Meta Trinity 단계별 분석**: 노출 문제는 Andromeda(Entity ID/시각적 패턴), 전환 문제는 GEM(광고 시퀀스), 지면 효율은 Lattice(크로스 서피스 학습) 관점에서 진단
2. **크리에이티브 = 타겟팅**: Entity ID 시각적 다양성을 최우선 평가 기준으로 사용. 시각적으로 상이한 10~15개 소재 확보 권장
3. **학습 단계(Learning Phase)**: 주 50회 전환 데이터 미달 시 구조 통합 및 예산 집중($50+/일) 권고
4. **광고 피로도**: 동일 사용자 대상 빈도 3.5회 이상 시 CPA 19% 상승 페널티 발생 → 소재 교체 긴급 권고
5. **스케일링**: 예산 증액은 10~20% 점진적, 안정화 기간(Stabilization Window) 필수
6. **타겟팅**: 광범위 타겟팅(Broad Targeting)이 수동 타겟팅을 압도. Advantage+ Audience 전면 활용 권장
7. **UTIS**: 사용자 진성 관심사 설문(UTIS) 점수가 Lattice 랭킹에 직접 영향 → 품질 기반 최적화

**응답 원칙:**
1. **구체성**: 모호한 조언 대신 명확한 액션 ("XX 캠페인 예산 30% 증액")
2. **근거**: 수치와 데이터 기반 권장사항 (ROAS, CPA, CTR, EMQ 등)
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
9. learning_phase - 학습 단계/예산 소진 정체
10. creative_fatigue - 광고 피로도/소재 교체
11. campaign_structure - 캠페인 구조/예산 통합
12. lead_quality - 리드 품질/허수 고객
13. tracking_health - 픽셀/CAPI/EMQ 건전성
14. general - 일반 문의

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
  message: `ROAS를 개선하기 위한 2026 전략:

1. **소재 다양성 확보 (Entity ID 분산)**
   - 시각적으로 상이한 10~15개 크리에이티브를 동시 운용
   - UGC, 스튜디오 촬영, 텍스트 그래픽, 셀프카메라 등 이질적인 Entity ID 확보
   - 14~21일 주기로 소재 리프레시

2. **캠페인 구조 단순화 및 예산 통합**
   - 파편화된 광고 세트를 하나로 캠페인 통합
   - 일일 예산 $50 이상으로 집중 (학습 단계 통과 필수)
   - CBO/Advantage+ 활용하여 AI 자동 분배

3. **광범위 타겟팅(Broad Targeting) 전환**
   - 수동 관심사/연령/성별 타겟팅 제거
   - Advantage+ Audience로 AI에 타겟 결정 위임

4. **가치 기반 입찰**
   - 목표 ROAS 또는 목표 CPA 기반 입찰로 전환
   - 전환 가치가 높은 진성 유저 중심 최적화

5. **랜딩 페이지 및 전환 퍼널**
   - 페이지 로딩 속도 개선
   - 전환 퍼널 최적화`,
  suggestedQuestions: [
    'Entity ID 다양성을 어떻게 확보하나요?',
    '예산을 얼마까지 통합해야 학습 단계를 통과하나요?',
    '광범위 타겟팅으로 전환하면 비용이 증가하지 않나요?',
  ],
}

/**
 * 캠페인 확장 응답 템플릿
 */
export const SCALING_TEMPLATE: ChatResponseTemplate = {
  message: `안전한 캠페인 확장 가이드 (2026):

**확장 전 필수 점검:**
- ROAS 2.5x 이상 안정적 유지 (최근 7일)
- 소재 다양성 확보 상태: Entity ID 10개 이상의 이질적 크리에이티브 운용 중
- 학습 단계(Learning Phase) 통과 완료 (주 50회 이상 전환)
- 광고 피로도 징후 없음 (빈도 3.5회 미만)

**확장 방법:**
1. **점진적 증액** (10~20%씩 단계적으로)
2. **안정화 기간(Stabilization Window)** — 증액 후 3~5일간 성과 관망 필수
3. **성과 모니터링** (ROAS, CPA 변화 추적)
4. **크리에이티브 다양성 동시 확장** — 예산 증액과 함께 새로운 Entity ID 소재 추가 투입

**주의사항:**
- 한 번에 20% 초과 증액은 알고리즘 학습 단계 초기화 위험
- 크리에이티브 다양성 없이 예산만 증액하면 CPM 급등
- Advantage+ 캠페인은 AI가 예산의 최대 20%를 성과 우수 세트로 자동 재할당
- 주간 단위로 성과 검토`,
  suggestedQuestions: [
    '안정화 기간 동안 성과가 하락하면 어떻게 하나요?',
    '확장 시 어떤 소재를 추가해야 하나요?',
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
