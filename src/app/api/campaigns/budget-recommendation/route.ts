import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { BudgetRecommendationService } from '@application/services/BudgetRecommendationService'
import type {
  Industry,
  BusinessScale,
  BudgetRecommendationInput,
  ExistingCampaignData,
} from '@domain/value-objects/BudgetRecommendation'

/**
 * 예산 추천 API
 *
 * POST /api/campaigns/budget-recommendation
 *
 * Request Body:
 * {
 *   industry: Industry,
 *   businessScale: BusinessScale,
 *   monthlyMarketingBudget?: number,
 *   averageOrderValue?: number,
 *   marginRate?: number,
 *   existingCampaignData?: ExistingCampaignData
 * }
 *
 * Response:
 * {
 *   dailyBudget: { min, recommended, max },
 *   source: 'industry' | 'monthly_budget' | 'existing_data',
 *   testBudget: number,
 *   targetROAS: number,
 *   targetCPA: number,
 *   aovUsed: number,
 *   aovSource: 'user_input' | 'meta_data' | 'industry_default',
 *   reasoning: string,
 *   tips: string[],
 *   comparison?: { currentVsRecommended, potentialImpact }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    // 요청 본문 파싱
    const body = await request.json()

    // 입력 유효성 검사
    const { industry, businessScale } = body
    if (!industry || !businessScale) {
      return NextResponse.json(
        { error: '업종과 사업 규모는 필수입니다' },
        { status: 400 }
      )
    }

    // 업종 유효성 검사
    const validIndustries: Industry[] = [
      'ecommerce', 'food_beverage', 'beauty', 'fashion',
      'education', 'service', 'saas', 'other'
    ]
    if (!validIndustries.includes(industry)) {
      return NextResponse.json(
        { error: '유효하지 않은 업종입니다' },
        { status: 400 }
      )
    }

    // 사업 규모 유효성 검사
    const validScales: BusinessScale[] = ['individual', 'small', 'medium', 'large']
    if (!validScales.includes(businessScale)) {
      return NextResponse.json(
        { error: '유효하지 않은 사업 규모입니다' },
        { status: 400 }
      )
    }

    // 예산 추천 생성
    const budgetService = new BudgetRecommendationService()
    const input: BudgetRecommendationInput = {
      industry: industry as Industry,
      businessScale: businessScale as BusinessScale,
      monthlyMarketingBudget: body.monthlyMarketingBudget,
      averageOrderValue: body.averageOrderValue,
      marginRate: body.marginRate,
      existingCampaignData: body.existingCampaignData as ExistingCampaignData | undefined,
    }

    const recommendation = budgetService.generateRecommendation(input)

    return NextResponse.json(recommendation)
  } catch (error) {
    console.error('Budget recommendation error:', error)
    return NextResponse.json(
      { error: '예산 추천 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/campaigns/budget-recommendation
 *
 * 업종/규모 목록 조회
 */
export async function GET() {
  try {
    const industries = [
      { value: 'ecommerce', label: '이커머스/쇼핑몰' },
      { value: 'food_beverage', label: 'F&B/음식점' },
      { value: 'beauty', label: '뷰티/화장품' },
      { value: 'fashion', label: '패션/의류' },
      { value: 'education', label: '교육/학원' },
      { value: 'service', label: '서비스업' },
      { value: 'saas', label: 'SaaS/소프트웨어' },
      { value: 'other', label: '기타' },
    ]

    const businessScales = [
      { value: 'individual', label: '개인사업자', description: '월매출 1천만 미만' },
      { value: 'small', label: '소상공인', description: '월매출 1천만~5천만' },
      { value: 'medium', label: '중소기업', description: '월매출 5천만~5억' },
      { value: 'large', label: '대기업', description: '월매출 5억 이상' },
    ]

    return NextResponse.json({
      industries,
      businessScales,
    })
  } catch (error) {
    console.error('Budget recommendation options error:', error)
    return NextResponse.json(
      { error: '옵션 조회 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
