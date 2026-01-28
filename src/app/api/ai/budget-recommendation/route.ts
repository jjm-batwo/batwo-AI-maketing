import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { AIService } from '@infrastructure/external/openai/AIService'
import { BudgetRecommendationService } from '@application/services/BudgetRecommendationService'
import type { Industry, BusinessScale, BudgetRecommendationInput } from '@domain/value-objects/BudgetRecommendation'
import { budgetRecommendationSchema, validateBody } from '@/lib/validations'
import { checkRateLimit, getClientIp, addRateLimitHeaders, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // Rate limiting for AI budget recommendation
    const clientIp = getClientIp(request)
    const rateLimitKey = `${user.id}:${clientIp}`
    const rateLimitResult = await checkRateLimit(rateLimitKey, 'ai')

    if (!rateLimitResult.success) {
      return rateLimitExceededResponse(rateLimitResult)
    }

    // Validate request body
    const validation = await validateBody(request, budgetRecommendationSchema)
    if (!validation.success) return validation.error

    const body = validation.data

    // Calculate base recommendation using rule-based service
    const budgetService = new BudgetRecommendationService()
    const input: BudgetRecommendationInput = {
      industry: body.industry as Industry,
      businessScale: body.businessScale as BusinessScale,
      monthlyMarketingBudget: body.monthlyMarketingBudget,
      averageOrderValue: body.averageOrderValue,
      marginRate: body.marginRate,
      existingCampaignData: body.existingCampaignData,
    }
    const baseRecommendation = budgetService.generateRecommendation(input)

    // Get AI-enhanced recommendation
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      // Fallback to rule-based if no API key
      return NextResponse.json({
        ...baseRecommendation,
        aiEnhanced: false,
      })
    }

    const aiService = new AIService(apiKey)
    const aiRecommendation = await aiService.generateBudgetRecommendation({
      industry: body.industry as Industry,
      businessScale: body.businessScale as BusinessScale,
      averageOrderValue: body.averageOrderValue,
      monthlyMarketingBudget: body.monthlyMarketingBudget,
      marginRate: body.marginRate,
      existingCampaignData: body.existingCampaignData,
      calculatedBudget: baseRecommendation.dailyBudget,
      calculatedTargetROAS: baseRecommendation.targetROAS,
      calculatedTargetCPA: baseRecommendation.targetCPA,
    })

    const response = NextResponse.json({
      ...baseRecommendation,
      aiRecommendation,
      aiEnhanced: true,
    })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('AI Budget recommendation error:', error)
    return NextResponse.json(
      { error: 'AI 예산 추천 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
