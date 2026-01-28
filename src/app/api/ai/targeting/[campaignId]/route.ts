import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import {
  getTargetingRecommendationService,
  getQuotaService,
  getCampaignRepository,
  getKPIRepository,
} from '@/lib/di/container'
import {
  buildTargetingOptimizationPrompt,
  TARGETING_OPTIMIZATION_SYSTEM_PROMPT,
  TARGETING_OPTIMIZATION_AI_CONFIG,
} from '@infrastructure/external/openai/prompts/targetingOptimization'
import type { MetricsTimeSeries } from '@application/services/TargetingRecommendationService'

const OPENAI_API_BASE = 'https://api.openai.com/v1'

/**
 * AI 강화 타겟팅 권장사항 응답 타입
 */
interface AITargetingRecommendation {
  category: 'lookalike' | 'interest' | 'geographic' | 'demographic' | 'behavioral'
  action: 'expand' | 'reduce' | 'add' | 'remove' | 'test'
  priority: 'high' | 'medium' | 'low'
  recommendation: string
  specificChanges: string[]
  expectedImpact: string
  rationale: string
  implementationSteps: string[]
}

/**
 * 타겟팅 분석 응답 타입
 */
interface TargetingAnalysisResponse {
  campaignId: string
  campaignName: string
  saturation: {
    frequency: number
    saturationLevel: 'low' | 'moderate' | 'high' | 'critical'
    fatigueIndicators: {
      ctrDecline: number
      cpaIncrease: number
      frequencyTrend: 'increasing' | 'stable' | 'decreasing'
    }
  }
  basicRecommendations: Array<{
    type: 'expand' | 'reduce' | 'maintain' | 'refresh'
    priority: 'high' | 'medium' | 'low'
    category: 'lookalike' | 'interest' | 'geographic' | 'demographic'
    currentState: string
    recommendation: string
    expectedImpact: string
    rationale: string
  }>
  aiRecommendations?: AITargetingRecommendation[]
  summary: string
  remainingQuota: number
  generatedAt: string
}

/**
 * GET /api/ai/targeting/[campaignId]
 * 캠페인 타겟팅 분석 및 권장사항 조회
 *
 * Query Parameters:
 * - includeAI: AI 강화 권장사항 포함 여부 (default: false, AI quota 소모)
 * - days: 분석 기간 (default: 14, max: 90)
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
    const includeAI = searchParams.get('includeAI') === 'true'
    const days = Math.min(parseInt(searchParams.get('days') || '14', 10), 90)

    // Verify campaign ownership
    const campaignRepo = getCampaignRepository()
    const campaign = await campaignRepo.findById(campaignId)

    if (!campaign) {
      return NextResponse.json({ message: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    if (campaign.userId !== user.id) {
      return NextResponse.json({ message: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    // Get KPI time series data
    const kpiRepo = getKPIRepository()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const kpis = await kpiRepo.findByCampaignIdAndDateRange(campaignId, startDate, new Date())

    if (kpis.length === 0) {
      return NextResponse.json(
        { message: '분석할 KPI 데이터가 없습니다. 먼저 KPI 동기화를 진행해주세요.' },
        { status: 400 }
      )
    }

    // Get latest KPI for current metrics
    const latestKPI = kpis[kpis.length - 1]
    const roas = latestKPI.calculateROAS()
    const cpa = latestKPI.calculateCPA().amount
    const ctr = latestKPI.calculateCTR().value

    // FUTURE: Meta Ads API Insights에서 frequency와 reach 실시간 조회
    // 현재는 추정값 사용 (frequency = 평균 2.5, reach = impressions / frequency)
    const frequency = 2.5 // placeholder
    const reach = latestKPI.impressions / (frequency || 1) // estimated reach

    // Build time series data
    const metricsTimeSeries: MetricsTimeSeries[] = kpis.map((kpi) => ({
      date: kpi.date,
      ctr: kpi.calculateCTR().value,
      cpa: kpi.calculateCPA().amount,
      frequency: 2.5, // placeholder - FUTURE: Meta API에서 조회
      impressions: kpi.impressions,
      reach: kpi.impressions / 2.5, // estimated
    }))

    // Analyze targeting
    const targetingService = getTargetingRecommendationService()
    const analysis = targetingService.analyzeTargeting(
      campaignId,
      {
        frequency,
        reach,
        impressions: latestKPI.impressions,
        ctr,
        cpa,
        clicks: latestKPI.clicks,
        conversions: latestKPI.conversions,
        spend: latestKPI.spend.amount,
      },
      metricsTimeSeries
    )

    // Build response
    const response: TargetingAnalysisResponse = {
      campaignId,
      campaignName: campaign.name,
      saturation: analysis.saturation,
      basicRecommendations: analysis.recommendations,
      summary: analysis.summary,
      remainingQuota: 0,
      generatedAt: new Date().toISOString(),
    }

    // Add AI recommendations if requested
    if (includeAI) {
      // Check quota
      const quotaService = getQuotaService()
      const hasQuota = await quotaService.checkQuota(user.id, 'AI_ANALYSIS')
      if (!hasQuota) {
        return NextResponse.json(
          { message: 'AI 분석 쿼터가 초과되었습니다. 다음 주에 다시 시도해주세요.' },
          { status: 429 }
        )
      }

      // Build AI prompt
      const prompt = buildTargetingOptimizationPrompt({
        campaignName: campaign.name,
        currentTargeting: {
          ageRange:
            campaign.targetAudience?.ageMin && campaign.targetAudience?.ageMax
              ? `${campaign.targetAudience.ageMin}-${campaign.targetAudience.ageMax}세`
              : undefined,
          interests: campaign.targetAudience?.interests,
          locations: campaign.targetAudience?.locations,
          behaviors: [],
          lookalikes: [],
        },
        saturationAnalysis: analysis,
        currentMetrics: {
          frequency,
          reach,
          impressions: latestKPI.impressions,
          ctr,
          cpa,
          roas,
          spend: latestKPI.spend.amount,
        },
        industry: campaign.objective, // placeholder - 실제로는 industry 필드가 필요
      })

      // Generate AI recommendations using OpenAI
      try {
        const openaiResponse = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: TARGETING_OPTIMIZATION_AI_CONFIG.model,
            messages: [
              { role: 'system', content: TARGETING_OPTIMIZATION_SYSTEM_PROMPT },
              { role: 'user', content: prompt },
            ],
            temperature: TARGETING_OPTIMIZATION_AI_CONFIG.temperature,
            max_tokens: TARGETING_OPTIMIZATION_AI_CONFIG.maxTokens,
            top_p: TARGETING_OPTIMIZATION_AI_CONFIG.topP,
          }),
        })

        if (!openaiResponse.ok) {
          throw new Error(`OpenAI API error: ${openaiResponse.status}`)
        }

        const data = await openaiResponse.json()
        const aiContent = data.choices[0]?.message?.content

        if (aiContent) {
          const aiRecommendations: AITargetingRecommendation[] = JSON.parse(aiContent)
          response.aiRecommendations = aiRecommendations
        }
      } catch (parseError) {
        console.error('Failed to generate or parse AI recommendations:', parseError)
        // Continue without AI recommendations
      }

      // Log usage
      await quotaService.logUsage(user.id, 'AI_ANALYSIS')

      // Get remaining quota
      const quotaStatus = await quotaService.getRemainingQuota(user.id)
      response.remainingQuota = quotaStatus.AI_ANALYSIS?.remaining ?? 0
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Failed to analyze targeting:', error)
    return NextResponse.json({ message: '타겟팅 분석에 실패했습니다' }, { status: 500 })
  }
}
