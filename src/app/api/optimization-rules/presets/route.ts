import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { OptimizationRule } from '@domain/entities/OptimizationRule'
import { toOptimizationRuleDTO } from '@application/dto/optimization/OptimizationRuleDTO'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    if (!campaignId) {
      return NextResponse.json(
        { message: 'campaignId는 필수입니다' },
        { status: 400 }
      )
    }

    const presets = OptimizationRule.ecommercePresets(campaignId, user.id)

    return NextResponse.json({ presets: presets.map(toOptimizationRuleDTO) })
  } catch (error) {
    console.error('최적화 규칙 프리셋 조회 실패:', error)
    return NextResponse.json(
      { message: '최적화 규칙 프리셋을 불러오지 못했습니다' },
      { status: 500 }
    )
  }
}
