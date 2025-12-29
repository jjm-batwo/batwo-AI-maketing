import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const getCampaign = container.resolve<GetCampaignUseCase>(
      DI_TOKENS.GetCampaignUseCase
    )

    const campaign = await getCampaign.execute({
      campaignId: id,
      userId: user.id,
    })

    if (!campaign) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Failed to fetch campaign:', error)
    return NextResponse.json(
      { message: 'Failed to fetch campaign' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const body = await request.json()

    const campaignRepository = container.resolve<ICampaignRepository>(
      DI_TOKENS.CampaignRepository
    )

    const campaign = await campaignRepository.findById(id)

    if (!campaign) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Check ownership
    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Update campaign status if provided
    let updatedCampaign = campaign
    if (body.status) {
      const newStatus = body.status as CampaignStatus
      updatedCampaign = campaign.changeStatus(newStatus)
    }

    const saved = await campaignRepository.update(updatedCampaign)

    return NextResponse.json({
      id: saved.id,
      name: saved.name,
      objective: saved.objective,
      status: saved.status,
      dailyBudget: saved.dailyBudget.amount,
      currency: saved.dailyBudget.currency,
      startDate: saved.startDate.toISOString(),
      endDate: saved.endDate?.toISOString(),
      createdAt: saved.createdAt.toISOString(),
      updatedAt: saved.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Failed to update campaign:', error)
    return NextResponse.json(
      { message: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const campaignRepository = container.resolve<ICampaignRepository>(
      DI_TOKENS.CampaignRepository
    )

    const campaign = await campaignRepository.findById(id)

    if (!campaign) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Check ownership
    if (campaign.userId !== user.id) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    await campaignRepository.delete(id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Failed to delete campaign:', error)
    return NextResponse.json(
      { message: 'Failed to delete campaign' },
      { status: 500 }
    )
  }
}
