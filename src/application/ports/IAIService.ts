export interface CampaignOptimizationSuggestion {
  category: 'budget' | 'targeting' | 'creative' | 'timing'
  priority: 'high' | 'medium' | 'low'
  suggestion: string
  expectedImpact: string
  rationale: string
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
  currentMetrics: {
    roas: number
    cpa: number
    ctr: number
    impressions: number
    clicks: number
    conversions: number
    spend: number
  }
  targetAudience?: {
    ageRange?: string
    interests?: string[]
    locations?: string[]
  }
}

export interface GenerateReportInsightInput {
  reportType: 'weekly' | 'monthly'
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
}

export interface GenerateAdCopyInput {
  productName: string
  productDescription: string
  targetAudience: string
  tone: 'professional' | 'casual' | 'playful' | 'urgent'
  objective: 'awareness' | 'consideration' | 'conversion'
  keywords?: string[]
  variantCount?: number
}

export interface IAIService {
  generateCampaignOptimization(
    input: GenerateOptimizationInput
  ): Promise<CampaignOptimizationSuggestion[]>

  generateReportInsights(
    input: GenerateReportInsightInput
  ): Promise<ReportInsight>

  generateAdCopy(input: GenerateAdCopyInput): Promise<AdCopyVariant[]>
}
