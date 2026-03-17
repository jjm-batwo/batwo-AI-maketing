// src/domain/services/IntentClassifierConfig.ts
import { ChatIntent } from '../value-objects/ChatIntent'

export interface IntentClassifierConfig {
  keywordMap: Record<Exclude<ChatIntent, ChatIntent.GENERAL>, string[]>
  contextMap: Record<Exclude<ChatIntent, ChatIntent.GENERAL>, string[]>
  negationPatterns: string[]
  ambiguityThreshold: number
  singleMatchConfidence: number
  llmConfidenceCoeff: number
  /** Confidence threshold below which classifyAsync() calls LLM (default: 0.5) */
  llmFallbackThreshold: number
}

// v2: 원본 유지 + autoresearch combined 모드에서 발견한 일반화 키워드 추가 (2026-03-17)
export const DEFAULT_INTENT_CLASSIFIER_CONFIG: IntentClassifierConfig = {
  keywordMap: {
    [ChatIntent.CAMPAIGN_CREATION]: ['캠페인', 'campaign', 'create', '만들', '생성', '시작'],
    [ChatIntent.REPORT_QUERY]: ['리포트', 'report', '보고서', '보여줘', '보기', '조회', '이번'],
    [ChatIntent.KPI_ANALYSIS]: [
      'roas', 'cpc', 'cpa', '성과', '분석', 'performance', 'analyze', '전환율',
      '하락', '급증', '급감', '이상', '감지', 'ctr', '돈만',
    ],
    [ChatIntent.PIXEL_SETUP]: ['픽셀', 'pixel', '설치', 'install', 'gtm'],
    [ChatIntent.BUDGET_OPTIMIZATION]: ['예산', 'budget', '최적화', 'optimize', '광고비', '비용'],
    [ChatIntent.CREATIVE_FATIGUE]: ['피로도', '피로', '반복', '빈도', 'fatigue', '노출 빈도', '소재', 'cpm', '프리퀀시'],
    [ChatIntent.LEARNING_PHASE]: ['학습', '학습단계', '소진', '예산이 안', '노출이 안', 'learning phase', '멈춰', '하나도'],
    [ChatIntent.STRUCTURE_OPTIMIZATION]: ['구조', '통합', '파편', '세트 개수', '캠페인 수', '단순화', '합치', '줄여', 'cbo', 'abo'],
    [ChatIntent.LEAD_QUALITY]: ['리드', '허수', '품질', '연락', '부재', 'lead quality', '가짜', '진짜 고객'],
    [ChatIntent.TRACKING_HEALTH]: ['capi', 'emq', '추적', '전환 추적', '이벤트', '트래킹', '매칭률', '전환이', 'ios14', '연동'],
  },
  contextMap: {
    [ChatIntent.CAMPAIGN_CREATION]: ['매출', '전략', '광고를 시작', '새로', '광고 좀', '해볼까', '소액으로', '일단'],
    [ChatIntent.REPORT_QUERY]: ['데이터', '살펴', '확인', '실적', '봐줘', '궁금', '보여드', '비교'],
    [ChatIntent.KPI_ANALYSIS]: ['효율', '대비', '어떤가', '올리', '지표', '광고 효율', '반응', '떨어', '결과가 없', '잘 되고', '클릭은', '상태가', '경쟁사'],
    [ChatIntent.PIXEL_SETUP]: ['태그매니저'],
    [ChatIntent.BUDGET_OPTIMIZATION]: ['절감', '조정', '아껴', '나가', '좀 줄'],
    [ChatIntent.CREATIVE_FATIGUE]: ['같은 광고', '지겨', '같은 사람', '자꾸', '바꿔야', '같은거'],
    [ChatIntent.LEARNING_PHASE]: ['배달이 안', '돈이 안 써', '학습 중', '초기화', '나가질 않', '써지질 않', '나오질 않', '멈춰버', '안 써져', '안 돌아가', '건가'],
    [ChatIntent.STRUCTURE_OPTIMIZATION]: ['너무 많', '정리', '분산', '좁은', '세트를 좀', '갈지', '개인데', '합쳐버릴'],
    [ChatIntent.LEAD_QUALITY]: ['허수 고객', '가짜', '전화 안', '양질', '진짜인지', '이상한 게 많', '없는번호'],
    [ChatIntent.TRACKING_HEALTH]: ['전환이 안 잡', '이벤트 누락', '서버 이벤트', '숫자가 맞지', '매칭률', '태그매니저', '대시보드', '서버사이드'],
  },
  negationPatterns: ['지 마', '지마', '하지', '안 ', '못 ', '없'],
  ambiguityThreshold: 2.0,
  singleMatchConfidence: 0.6,
  llmConfidenceCoeff: 0.05,
  llmFallbackThreshold: 0.5,
}
