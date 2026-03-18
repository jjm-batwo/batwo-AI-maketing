// src/application/dto/report/EnhancedReportSections.ts

// ── 공통 ──

export interface ChangeRate {
  value: number           // 변화율 (%) — 양수: 증가, 음수: 감소
  direction: 'up' | 'down' | 'flat'
  isPositive: boolean     // 이 지표에서 증가가 좋은지 (spend는 false)
}

// ── 1. 전체 성과 요약 ──

export interface OverallSummarySection {
  totalSpend: number
  totalRevenue: number
  roas: number
  ctr: number
  totalConversions: number
  changes: {
    spend: ChangeRate
    revenue: ChangeRate
    roas: ChangeRate
    ctr: ChangeRate
    conversions: ChangeRate
  }
}

// ── 2. 성과 추이 (일별) ──

export interface DailyTrendSection {
  days: DailyDataPoint[]
}

export interface DailyDataPoint {
  date: string            // YYYY-MM-DD
  spend: number
  revenue: number
  roas: number
  impressions: number
  clicks: number
  conversions: number
}

// ── 3. 캠페인별 성과 ──

export interface CampaignPerformanceSection {
  campaigns: CampaignPerformanceItem[]
}

export interface CampaignPerformanceItem {
  campaignId: string
  name: string
  objective: string
  status: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
}

// ── 4. 소재별 성과 (TOP N) ──

export interface CreativePerformanceSection {
  topN: number
  creatives: CreativePerformanceItem[]
}

export interface CreativePerformanceItem {
  creativeId: string
  name: string
  format: string
  thumbnailUrl?: string
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
}

// ── 5. 소재 피로도 지수 ──

export interface CreativeFatigueSection {
  creatives: CreativeFatigueItem[]
}

export type FatigueLevel = 'healthy' | 'warning' | 'critical'

export interface CreativeFatigueItem {
  creativeId: string
  name: string
  format: string
  frequency: number
  ctr: number
  ctrTrend: number[]      // 최근 7일 일별 CTR 변화
  fatigueScore: number    // 0-100 (높을수록 피로)
  fatigueLevel: FatigueLevel
  activeDays: number
  recommendation: string
}

// ── 6. 소재 포맷별 성과 ──

export interface FormatComparisonSection {
  formats: FormatPerformanceItem[]
}

export interface FormatPerformanceItem {
  format: string
  formatLabel: string
  adCount: number
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  roas: number
  ctr: number
  avgFrequency: number
  videoViews?: number
  thruPlayRate?: number
}

// ── 7. 퍼널 단계별 성과 ──

export interface FunnelPerformanceSection {
  stages: FunnelStageItem[]
  totalBudget: number
}

export interface FunnelStageItem {
  stage: 'tofu' | 'mofu' | 'bofu' | 'auto'
  stageLabel: string
  campaignCount: number
  spend: number
  budgetRatio: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  roas: number
  ctr: number
}

// ── 8. 성과 분석 (AI) ──

export interface PerformanceAnalysisSection {
  positiveFactors: AnalysisFactor[]
  negativeFactors: AnalysisFactor[]
  summary: string
}

export interface AnalysisFactor {
  title: string
  description: string
  relatedCampaigns?: string[]
  relatedCreatives?: string[]
  impact: 'high' | 'medium' | 'low'
}

// ── 9. 개선사항 + 추천 액션 ──

export interface RecommendationsSection {
  actions: RecommendedAction[]
}

export interface RecommendedAction {
  priority: 'high' | 'medium' | 'low'
  category: 'budget' | 'creative' | 'targeting' | 'funnel' | 'general'
  title: string
  description: string
  expectedImpact: string
  deadline?: string
}

// ── 통합 타입 (9개 섹션 합체) ──

export interface EnhancedReportSections {
  overallSummary: OverallSummarySection
  dailyTrend: DailyTrendSection
  campaignPerformance: CampaignPerformanceSection
  creativePerformance: CreativePerformanceSection
  creativeFatigue: CreativeFatigueSection
  formatComparison: FormatComparisonSection
  funnelPerformance: FunnelPerformanceSection
  performanceAnalysis: PerformanceAnalysisSection
  recommendations: RecommendationsSection
}
