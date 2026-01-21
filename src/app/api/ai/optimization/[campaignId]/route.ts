import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import {
  getAIService,
  getQuotaService,
  getCampaignRepository,
  getKPIRepository,
  getCampaignAnalyzer,
  getCompetitorBenchmarkService,
} from '@/lib/di/container'
import type { GenerateOptimizationInput } from '@application/ports/IAIService'
import type { Industry } from '@infrastructure/external/openai/prompts/adCopyGeneration'

/**
 * 최적화 제안 응답 타입
 */
interface OptimizationResponse {
  campaignId: string
  campaignName: string
  industry?: Industry
  suggestions: Array<{
    category: 'budget' | 'targeting' | 'creative' | 'timing' | 'bidding'
    priority: 'high' | 'medium' | 'low'
    suggestion: string
    expectedImpact: string
    rationale: string
  }>
  metrics: {
    roas: number
    cpa: number
    ctr: number
    cvr: number
    cpc: number
    impressions: number
    clicks: number
    conversions: number
    spend: number
    revenue?: number
  }
  analysis?: {
    performanceGrade: 'excellent' | 'good' | 'average' | 'below_average' | 'poor'
    insights: Array<{
      category: string
      priority: string
      title: string
      description: string
      expectedImpact: {
        metric: string
        improvement: number
        unit: string
      }
    }>
  }
  benchmark?: {
    overallScore: number
    overallGrade: string
    summary: string
  }
  remainingQuota: number
  generatedAt: string
}

/**
 * GET /api/ai/optimization/[campaignId]
 * 캠페인 최적화 제안 조회
 *
 * Query Parameters:
 * - industry: 업종 (ecommerce, food_beverage, beauty, fashion, education, service, saas, health)
 * - includeAnalysis: 상세 분석 포함 여부 (default: true)
 * - includeBenchmark: 벤치마크 비교 포함 여부 (default: true)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { campaignId } = await params
    const searchParams = request.nextUrl.searchParams
    const industry = searchParams.get('industry') as Industry | null
    const includeAnalysis = searchParams.get('includeAnalysis') !== 'false'
    const includeBenchmark = searchParams.get('includeBenchmark') !== 'false'

    // Verify campaign ownership
    const campaignRepo = getCampaignRepository()
    const campaign = await campaignRepo.findById(campaignId)

    if (!campaign) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Check quota
    const quotaService = getQuotaService()
    const hasQuota = await quotaService.checkQuota(user.id, 'AI_ANALYSIS')
    if (!hasQuota) {
      return NextResponse.json(
        { message: 'AI 분석 쿼터가 초과되었습니다. 다음 주에 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // Get latest KPI data for the campaign
    const kpiRepo = getKPIRepository()
    const latestKPI = await kpiRepo.findLatestByCampaignId(campaignId)

    if (!latestKPI) {
      return NextResponse.json(
        { message: '캠페인의 KPI 데이터가 없습니다. 먼저 KPI 동기화를 진행해주세요.' },
        { status: 400 }
      )
    }

    // Calculate additional metrics
    const cvr = latestKPI.clicks > 0 ? (latestKPI.conversions / latestKPI.clicks) * 100 : 0
    const cpc = latestKPI.clicks > 0 ? latestKPI.spend.amount / latestKPI.clicks : 0
    const roas = latestKPI.calculateROAS()
    const cpa = latestKPI.calculateCPA().amount
    const ctr = latestKPI.calculateCTR().value

    // Build optimization input from campaign and KPI data
    const input: GenerateOptimizationInput = {
      campaignName: campaign.name,
      objective: campaign.objective,
      industry: industry || undefined,
      currentMetrics: {
        roas,
        cpa,
        ctr,
        cvr,
        cpc,
        impressions: latestKPI.impressions,
        clicks: latestKPI.clicks,
        conversions: latestKPI.conversions,
        spend: latestKPI.spend.amount,
        revenue: latestKPI.revenue?.amount,
      },
      targetAudience: campaign.targetAudience
        ? {
            ageRange:
              campaign.targetAudience.ageMin && campaign.targetAudience.ageMax
                ? `${campaign.targetAudience.ageMin}-${campaign.targetAudience.ageMax}세`
                : undefined,
            interests: campaign.targetAudience.interests,
            locations: campaign.targetAudience.locations,
          }
        : undefined,
    }

    // Generate optimization suggestions using AI
    const aiService = getAIService()
    const suggestions = await aiService.generateCampaignOptimization(input)

    // Build response
    const response: OptimizationResponse = {
      campaignId,
      campaignName: campaign.name,
      industry: industry || undefined,
      suggestions,
      metrics: {
        roas,
        cpa,
        ctr,
        cvr,
        cpc,
        impressions: latestKPI.impressions,
        clicks: latestKPI.clicks,
        conversions: latestKPI.conversions,
        spend: latestKPI.spend.amount,
        revenue: latestKPI.revenue?.amount,
      },
      remainingQuota: 0,
      generatedAt: new Date().toISOString(),
    }

    // Add campaign analysis if requested and industry is provided
    if (includeAnalysis && industry) {
      const analyzer = getCampaignAnalyzer()
      const analysisResult = analyzer.analyze(
        {
          impressions: latestKPI.impressions,
          clicks: latestKPI.clicks,
          conversions: latestKPI.conversions,
          spend: latestKPI.spend.amount,
          revenue: latestKPI.revenue?.amount || 0,
          ctr,
          cvr,
          cpa,
          roas,
          cpc,
        },
        industry
      )

      response.analysis = {
        performanceGrade: analysisResult.performanceGrade,
        insights: analysisResult.insights.slice(0, 5).map((insight) => ({
          category: insight.category,
          priority: insight.priority,
          title: insight.title,
          description: insight.description,
          expectedImpact: insight.expectedImpact,
        })),
      }
    }

    // Add benchmark comparison if requested and industry is provided
    if (includeBenchmark && industry) {
      const benchmarkService = getCompetitorBenchmarkService()
      const benchmarkReport = benchmarkService.generateReport(
        { ctr, cvr, cpa, roas, cpc, spend: latestKPI.spend.amount, revenue: latestKPI.revenue?.amount || 0 },
        industry
      )

      response.benchmark = {
        overallScore: benchmarkReport.overallScore,
        overallGrade: benchmarkReport.overallGrade,
        summary: benchmarkService.getPerformanceSummary(
          { ctr, cvr, cpa, roas, cpc, spend: latestKPI.spend.amount, revenue: latestKPI.revenue?.amount || 0 },
          industry
        ),
      }
    }

    // Log usage only on success
    await quotaService.logUsage(user.id, 'AI_ANALYSIS')

    // Get remaining quota
    const quotaStatus = await quotaService.getRemainingQuota(user.id)
    response.remainingQuota = quotaStatus.AI_ANALYSIS?.remaining ?? 0

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to generate optimization suggestions:', error)
    return NextResponse.json(
      { message: 'AI 최적화 제안 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}
