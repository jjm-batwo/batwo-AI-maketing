/**
 * AI 서비스 설정 인터페이스
 * 기능별로 최적화된 파라미터를 외부에서 관리
 */
export interface AIConfig {
  /** 사용할 모델 (예: 'gpt-4o', 'gpt-4o-mini') */
  model?: string
  /** 응답의 창의성/일관성 조절 (0.0~2.0) */
  temperature: number
  /** 최대 응답 토큰 수 */
  maxTokens: number
  /** 누적 확률 샘플링 (0.0~1.0) */
  topP?: number
}

export interface CampaignOptimizationSuggestion {
  category: 'budget' | 'targeting' | 'creative' | 'timing' | 'bidding'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  expectedImpact: string
  rationale: string
}

/**
 * 인사이트 유형
 * - performance: 전체 성과 분석
 * - trend: 추세 분석 (상승/하락/안정)
 * - comparison: 이전 기간 대비 비교
 * - anomaly: 이상 징후 감지
 * - recommendation: 개선 제안
 * - forecast: 향후 예측
 * - benchmark: 업종 벤치마크 비교
 */
export type InsightType = 'performance' | 'trend' | 'comparison' | 'anomaly' | 'recommendation' | 'forecast' | 'benchmark'

/**
 * 상세 인사이트 항목
 */
export interface InsightItem {
  type: InsightType
  title: string
  description: string
  importance: 'critical' | 'high' | 'medium' | 'low'
  relatedMetrics?: string[]
}

/**
 * 구조화된 액션 아이템
 */
export interface ActionItem {
  priority: 'high' | 'medium' | 'low'
  category: 'budget' | 'creative' | 'targeting' | 'timing' | 'general'
  action: string
  expectedImpact: string
  deadline?: string  // 권장 실행 시점 (예: "이번 주 내", "다음 월요일까지")
}

/**
 * 성과 예측
 */
export interface ForecastMetric {
  metric: string
  current: number
  predicted7d: number
  predicted30d: number
  confidence: 'high' | 'medium' | 'low'
  trend: 'improving' | 'declining' | 'stable'
}

export interface ReportInsight {
  title: string
  summary: string
  keyMetrics: {
    name: string
    value: string
    change: string
    trend: 'up' | 'down' | 'stable'
  }[]
  recommendations: string[]
  /** 확장된 상세 인사이트 (선택적 - 호환성 유지) */
  insights?: InsightItem[]
  /** 구조화된 액션 아이템 (선택적 - 호환성 유지) */
  actionItems?: ActionItem[]
  /** 성과 예측 (선택적 - 호환성 유지) */
  forecast?: ForecastMetric[]
  /** 업종 벤치마크 비교 (선택적 - 호환성 유지) */
  benchmarkComparison?: {
    industry: string
    overallScore: number
    grade: 'excellent' | 'good' | 'average' | 'below_average' | 'poor'
    gaps: { metric: string; gap: string; suggestion: string }[]
  }
}

export interface AdCopyVariant {
  headline: string
  primaryText: string
  description: string
  callToAction: string
  targetAudience: string
}

export interface GenerateOptimizationInput {
  campaignName: string
  objective: string
  industry?: 'ecommerce' | 'food_beverage' | 'beauty' | 'fashion' | 'education' | 'service' | 'saas' | 'health'
  currentMetrics: {
    roas: number
    cpa: number
    ctr: number
    cvr?: number
    cpc?: number
    impressions: number
    clicks: number
    conversions: number
    spend: number
    revenue?: number
  }
  targetAudience?: {
    ageRange?: string
    interests?: string[]
    locations?: string[]
  }
  /** 과학 기반 마케팅 지식 컨텍스트 (자동 주입) */
  scienceContext?: string
}

export interface GenerateReportInsightInput {
  reportType: 'daily' | 'weekly' | 'monthly'
  /** 업종 (벤치마크 비교용) */
  industry?: 'ecommerce' | 'food_beverage' | 'beauty' | 'fashion' | 'education' | 'service' | 'saas' | 'health'
  campaignSummaries: {
    name: string
    objective: string
    metrics: {
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
    }
  }[]
  comparisonPeriod?: {
    previousMetrics: {
      impressions: number
      clicks: number
      conversions: number
      spend: number
      revenue: number
    }
  }
  /** 확장 인사이트 포함 여부 (기본: false - 호환성) */
  includeExtendedInsights?: boolean
  /** 예측 포함 여부 (기본: false) */
  includeForecast?: boolean
  /** 벤치마크 비교 포함 여부 (기본: false) */
  includeBenchmark?: boolean
}

export interface GenerateAdCopyInput {
  productName: string
  productDescription: string
  targetAudience: string
  tone: 'professional' | 'casual' | 'playful' | 'urgent'
  objective: 'awareness' | 'consideration' | 'conversion'
  keywords?: string[]
  variantCount?: number
  /** 과학 기반 마케팅 지식 컨텍스트 (자동 주입) */
  scienceContext?: string
}

export interface GenerateBudgetRecommendationInput {
  industry: 'ecommerce' | 'food_beverage' | 'beauty' | 'fashion' | 'education' | 'service' | 'saas' | 'other'
  businessScale: 'individual' | 'small' | 'medium' | 'large'
  averageOrderValue?: number
  monthlyMarketingBudget?: number
  marginRate?: number
  existingCampaignData?: {
    avgDailySpend: number
    avgROAS: number
    avgCPA: number
    avgAOV: number
    totalSpend30Days: number
    totalRevenue30Days: number
    totalPurchases30Days: number
  }
  calculatedBudget: {
    min: number
    recommended: number
    max: number
  }
  calculatedTargetROAS: number
  calculatedTargetCPA: number
}

export interface BudgetRecommendationResult {
  recommendedBudget: {
    daily: number
    testPeriod: number
    reasoning: string
  }
  targetMetrics: {
    roas: number
    cpa: number
    roasReasoning: string
  }
  tips: string[]
  warnings: string[]
  comparison?: {
    currentVsRecommended: string
    potentialImpact: string
  }
}

export interface GenerateCreativeVariantsInput {
  element: 'headline' | 'primary_text' | 'description' | 'cta'
  currentText: string
  productContext: string
  targetAudience: string
  weaknessAnalysis: string
  /** 과학 기반 마케팅 지식 컨텍스트 (자동 주입) */
  scienceContext?: string
}

export interface CreativeVariant {
  text: string
  hypothesis: string
  hookType: string
}

export interface IAIService {
  generateCampaignOptimization(
    input: GenerateOptimizationInput
  ): Promise<CampaignOptimizationSuggestion[]>

  generateReportInsights(
    input: GenerateReportInsightInput
  ): Promise<ReportInsight>

  generateAdCopy(input: GenerateAdCopyInput): Promise<AdCopyVariant[]>

  generateBudgetRecommendation(
    input: GenerateBudgetRecommendationInput
  ): Promise<BudgetRecommendationResult>

  generateCreativeVariants(
    input: GenerateCreativeVariantsInput
  ): Promise<CreativeVariant[]>

  chatCompletion(
    systemPrompt: string,
    userPrompt: string,
    config?: AIConfig
  ): Promise<string>
}
