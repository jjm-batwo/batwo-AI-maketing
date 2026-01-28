import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getBudgetAlertService, getCampaignRepository } from '@/lib/di/container'
import { createBudgetAlertSchema, updateBudgetAlertSchema, validateBody } from '@/lib/validations'

/**
 * GET /api/campaigns/[id]/budget-alert
 * 캠페인의 예산 알림 설정 조회
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

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
    const alert = await budgetAlertService.getAlert(id)

    if (!alert) {
      return NextResponse.json(
        { message: '예산 알림 설정이 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      campaignId: alert.campaignId,
      thresholdPercent: alert.thresholdPercent,
      isEnabled: alert.isEnabled,
      alertedAt: alert.alertedAt,
    })
  } catch (error) {
    console.error('Failed to get budget alert:', error)
    return NextResponse.json(
      { message: '예산 알림 설정 조회에 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/budget-alert
 * 캠페인의 예산 알림 설정 생성
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // Validate request body
    const validation = await validateBody(request, createBudgetAlertSchema)
    if (!validation.success) return validation.error

    const { thresholdPercent } = validation.data

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
    const alert = await budgetAlertService.createAlert({
      campaignId: id,
      thresholdPercent,
    })

    return NextResponse.json({
      campaignId: alert.campaignId,
      thresholdPercent: alert.thresholdPercent,
      isEnabled: alert.isEnabled,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('이미')) {
      return NextResponse.json(
        { message: error.message },
        { status: 409 }
      )
    }

    console.error('Failed to create budget alert:', error)
    return NextResponse.json(
      { message: '예산 알림 설정 생성에 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/campaigns/[id]/budget-alert
 * 캠페인의 예산 알림 설정 수정
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // Validate request body
    const validation = await validateBody(request, updateBudgetAlertSchema)
    if (!validation.success) return validation.error

    const { thresholdPercent, isEnabled } = validation.data

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

    // 임계값 또는 활성화 상태 업데이트
    if (thresholdPercent !== undefined || isEnabled !== undefined) {
      await budgetAlertService.updateAlert({
        campaignId: id,
        thresholdPercent,
        isEnabled,
      })
    }

    const alert = await budgetAlertService.getAlert(id)

    return NextResponse.json({
      campaignId: alert!.campaignId,
      thresholdPercent: alert!.thresholdPercent,
      isEnabled: alert!.isEnabled,
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('찾을 수 없습니다')) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      )
    }

    console.error('Failed to update budget alert:', error)
    return NextResponse.json(
      { message: '예산 알림 설정 수정에 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/campaigns/[id]/budget-alert
 * 캠페인의 예산 알림 설정 삭제
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

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
    await budgetAlertService.deleteAlert(id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete budget alert:', error)
    return NextResponse.json(
      { message: '예산 알림 설정 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
