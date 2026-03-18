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
    considerations: ['타겟 오디언스 포화도', '현재 ROAS 안정성', '광고 피로도', '시장 경쟁 상황'],
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
    events: ['설날', '밸런타인', '화이트데이', '블랙프라이데이', '크리스마스', '연말'],
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

  const overallRoas = context.totalSpend > 0 ? context.totalRevenue / context.totalSpend : 0

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
// Diagnostic & Scenario Response Templates (2026 Meta Trinity)
// ============================================================================

/**
 * 광고 피로도 진단 응답 템플릿
 */
export const CREATIVE_FATIGUE_TEMPLATE: ChatResponseTemplate = {
  message: `광고 피로도(Creative Fatigue) 진단결과 및 액션 플랜 (2026 기준):

**현재 상태 진단:**
동일 오디언스 대상 광고 노출 빈도가 한계치를 넘었습니다.

**위험 분석:**
- 노출 빈도 3.5회 초과 시 CPA가 평균 19% 상승하는 페널티가 알고리즘에 의해 부여됩니다.
- 전환 리타겟팅(Retargeting) 캠페인의 경우 최대 10회까지 허용될 수 있으나, 신규 타겟 캠페인은 3.5회가 절대 마지노선입니다.

**개선 액션 플랜:**
1. **긴급 소재 리프레시**: 즉시 시각적으로 상이한 형태의 신규 소재 투입
2. **Entity ID 다양성 확보**: 기존에 사용하지 않던 다른 유형(UGC → 스튜디오, 이미지 → 숏폼 등) 강제 투입
3. **오디언스 제외 설정**: 이미 구매하거나 최근 14일 내 전환된 타겟은 제외 타겟팅(Exclusion) 처리

주의: 기존 소재의 단순 텍스트 변경이나 사소한 색상 변경은 알고리즘이 같은 Entity ID로 인식하므로 피로도가 개선되지 않습니다.`,
  suggestedQuestions: [
    '현재 빈도가 가장 높은 광고 세트는 무엇인가요?',
    '어떤 새로운 유형의 소재를 테스트해보면 좋을까요?',
  ],
}

/**
 * 학습 단계 진단 응답 템플릿
 */
export const LEARNING_PHASE_TEMPLATE: ChatResponseTemplate = {
  message: `학습 단계(Learning Phase) 지연 진단결과 및 액션 플랜:

**현재 상태 진단:**
머신러닝 알고리즘이 캠페인을 최적화하기 위한 충분한 데이터를 얻지 못해 예산 소진과 노출이 정체되어 있습니다.

**병목 원인 분석:**
- Meta GEM 예측 모델은 일주일 내 50회 이상의 전환 데이터가 발생해야 최적화가 안정됩니다.
- 현재 캠페인 구조나 일일 예산 설정이 이 조건을 충족하지 못하고 있습니다.

**개선 액션 플랜:**
1. **캠페인 구조 통합**: 파편화된 다수의 광고 세트를 단일 세트로 통합하여 데이터를 모으세요.
2. **최소 예산 상향**: 50회 전환 목표 달성을 위해 일일 예산을 $50(약 7만원) 이상으로 집중하세요.
3. **상위 퍼널 이벤트로 전환**: 최종 구매 전환 데이터가 50회가 안 된다면, 임시로 '장바구니 담기'나 '콘텐츠 조회' 등 상위 이벤트로 최적화 목표를 변경하세요.`,
  suggestedQuestions: [
    '가장 데이터가 분산되어 있는 캠페인이 무엇인가요?',
    '어떤 이벤트로 최적화 대상을 변경하면 좋을까요?',
  ],
}

/**
 * 캠페인 구조 진단 응답 템플릿
 */
export const STRUCTURE_OPTIMIZATION_TEMPLATE: ChatResponseTemplate = {
  message: `캠페인 파편화 진단결과 및 액션 플랜:

**현재 상태 진단:**
캠페인과 광고 세트가 불필요하게 세분화되어 있어, Lattice/Andromeda 알고리즘의 학습이 방해받고 있습니다.

**성과 하락 요인:**
- 타겟이나 지면별로 세트를 쪼개면 계정 내 자기 잠식(Self-Cannibalization)이 발생하고 CPM이 불필요하게 높아집니다.
- 2026 알고리즘 환경에서는 구조 단순화만으로도 CPA를 최대 34%까지 절감할 수 있습니다.

**개선 액션 플랜:**
1. **Advantage+ 캠페인 도입**: ASC(Advantage+ Shopping Campaign)로 통합하여 알고리즘에게 권한 완전 위임
2. **수동 타겟팅 제거**: 연령/성별 단위의 캠페인 분리 중단 및 광범위 타겟팅(Broad) 사용
3. **노출 지면 통합**: 자동 노출 위치(Advantage+ placements) 전면 적용`,
  suggestedQuestions: [
    '가장 성과가 나쁜 소규모 광고 세트들을 어떻게 합칠까요?',
    'Advantage+ 캠페인은 어떻게 설정해야 하나요?',
  ],
}

/**
 * 리드 품질 진단 응답 템플릿
 */
export const LEAD_QUALITY_TEMPLATE: ChatResponseTemplate = {
  message: `리드 광고/잠재고객(Lead Quality) 품질 진단결과 및 해결책:

**현재 상태 진단:**
CPA는 낮아 보이나, 실제 연락이 닿지 않거나 관심이 없는 허수 고객(Low-Intent Lead) 비율이 매우 높습니다.

**품질 하락 원인:**
- 원클릭 자동 완성 폼으로 인해 사용자가 의도하지 않게 제출했을 확률이 높습니다.
- 알고리즘이 '가장 싼' 리드를 찾는 데만 집중하고 있습니다.

**개선 액션 플랜:**
1. **마찰(Friction) 추가**: 설문에 주관식 단답형 질문이나 선택지(드롭다운) 질문을 1~2개 추가하세요.
2. **의도 확인 단계 삽입**: 리뷰 화면(Review screen)을 활성화하여 마지막으로 한 번 더 검토하게 만드세요.
3. **Higher Intent 설정 전환**: 양(Volume) 중심에서 '높은 의도(Higher Intent)' 중심으로 폼 설정을 변경하세요.
4. **번호 인증 추가**: 허수가 너무 많다면 카카오 알림톡/문자 인증 등을 연동하세요.`,
  suggestedQuestions: [
    '비용이 조금 오르더라도 진성 유저만 남기려면 질문을 어떻게 구성해야 할까요?',
    'CRM과 연결하여 오프라인 전환 최적화도 가능한가요?',
  ],
}

/**
 * 트래킹 건전성 진단 응답 템플릿
 */
export const TRACKING_HEALTH_TEMPLATE: ChatResponseTemplate = {
  message: `트래킹 건전성(Tracking Health) 진단결과 (CAPI/EMQ 중심):

**현재 상태 진단:**
사용자 행동 데이터 매칭률이 낮아 알고리즘(Lattice)이 진성 전환에 기여하는 시그널을 제대로 학습하지 못하고 있습니다.

**기술적 병목 요인:**
- 하이브리드 트래킹(Pixel + CAPI)이 완전하지 않아 크롬 3rd 파티 쿠키 지원 중단 등의 브라우저 정책에 데이터가 누락되고 있습니다.
- EMQ(Event Match Quality) 점수가 권장 기준인 6.0/10 에 미달할 수 있습니다.

**개선 액션 플랜:**
1. **CAPI(Conversions API) 구축**: 서버 간(Server-to-Server) 직접 통신으로 브라우저 제약 우회
2. **사용자 정보 보강 전송**: 해시된 이메일, 전화번호, 이름 등 가능한 많은 고객 파라미터를 이벤트와 함께 전송
3. **중복 제거(Deduplication) 설정**: Pixel과 CAPI 동시 전송 시 event_id를 일치시켜 중복 카운트 방지`,
  suggestedQuestions: [
    'CAPI 구축은 개발자 없이도 가능한 방법이 있나요?',
    '현재 전송되지 않고 있는 매칭 파라미터가 무엇인지 확인할 수 있나요?',
  ],
}

// ============================================================================
// AI Configuration
// ============================================================================

export const CHAT_ASSISTANT_AI_CONFIG: AIConfig = {
  model: 'gpt-5-mini',
  temperature: 0.6, // 창의성과 일관성의 균형
  maxTokens: 2000,
  topP: 0.9,
}

/**
 * 빠른 응답용 설정 (간단한 질문)
 */
export const CHAT_QUICK_RESPONSE_AI_CONFIG: AIConfig = {
  model: 'gpt-5-mini',
  temperature: 0.3,
  maxTokens: 500,
  topP: 0.8,
}
