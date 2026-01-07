import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getBudgetAlertService, getCampaignRepository } from '@/lib/di/container'

/**
 * GET /api/campaigns/[id]/budget-status
 * 캠페인의 현재 예산 상태 조회
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const dailyBudget = parseFloat(searchParams.get('dailyBudget') || '0')

    if (dailyBudget <= 0) {
      return NextResponse.json(
        { message: '일일 예산이 필요합니다' },
        { status: 400 }
      )
    }

    // 캠페인 소유권 확인
    const campaignRepo = getCampaignRepository()
    const campaign = await campaignRepo.findById(id)

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

    const budgetAlertService = getBudgetAlertService()
    const result = await budgetAlertService.checkBudgetStatus(id, dailyBudget)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to get budget status:', error)
    return NextResponse.json(
      { message: '예산 상태 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}
