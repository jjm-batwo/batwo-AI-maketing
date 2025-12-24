import {
  IAIService,
  CampaignOptimizationSuggestion,
  ReportInsight,
  AdCopyVariant,
  GenerateOptimizationInput,
  GenerateReportInsightInput,
  GenerateAdCopyInput,
} from '@application/ports/IAIService'

export class MockAIService implements IAIService {
  private shouldFail = false
  private failureError: Error | null = null
  private mockOptimizations: CampaignOptimizationSuggestion[] = []
  private mockInsights: ReportInsight | null = null
  private mockAdCopies: AdCopyVariant[] = []

  async generateCampaignOptimization(
    input: GenerateOptimizationInput
  ): Promise<CampaignOptimizationSuggestion[]> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError
    }

    if (this.mockOptimizations.length > 0) {
      return this.mockOptimizations
    }

    return [
      {
        category: 'budget',
        priority: 'high',
        suggestion: '일일 예산을 20% 증액하세요',
        expectedImpact: 'ROAS 15% 개선 예상',
        rationale: '현재 예산 소진율이 높고 전환율이 양호합니다',
      },
    ]
  }

  async generateReportInsights(
    input: GenerateReportInsightInput
  ): Promise<ReportInsight> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError
    }

    if (this.mockInsights) {
      return this.mockInsights
    }

    return {
      title: '주간 마케팅 성과 분석',
      summary: '이번 주 전체 캠페인 성과가 전주 대비 10% 향상되었습니다.',
      keyMetrics: [
        {
          name: 'ROAS',
          value: '2.5',
          change: '+15%',
          trend: 'up',
        },
        {
          name: 'CPA',
          value: '15,000원',
          change: '-8%',
          trend: 'down',
        },
      ],
      recommendations: [
        '고성과 광고 세트에 예산 추가 배분을 권장합니다',
        '전환율이 낮은 광고 소재 교체를 고려하세요',
      ],
    }
  }

  async generateAdCopy(input: GenerateAdCopyInput): Promise<AdCopyVariant[]> {
    if (this.shouldFail && this.failureError) {
      throw this.failureError
    }

    if (this.mockAdCopies.length > 0) {
      return this.mockAdCopies
    }

    const count = input.variantCount || 3
    const variants: AdCopyVariant[] = []

    for (let i = 0; i < count; i++) {
      variants.push({
        headline: `${input.productName} - 지금 만나보세요 (${i + 1})`,
        primaryText: `${input.productDescription}`,
        description: `${input.targetAudience}를 위한 특별한 제안`,
        callToAction: '자세히 보기',
        targetAudience: input.targetAudience,
      })
    }

    return variants
  }

  // Test helpers
  clear(): void {
    this.shouldFail = false
    this.failureError = null
    this.mockOptimizations = []
    this.mockInsights = null
    this.mockAdCopies = []
  }

  setShouldFail(shouldFail: boolean, error?: Error): void {
    this.shouldFail = shouldFail
    this.failureError = error || new Error('Mock AI service error')
  }

  setMockOptimizations(optimizations: CampaignOptimizationSuggestion[]): void {
    this.mockOptimizations = optimizations
  }

  setMockInsights(insights: ReportInsight): void {
    this.mockInsights = insights
  }

  setMockAdCopies(adCopies: AdCopyVariant[]): void {
    this.mockAdCopies = adCopies
  }
}
