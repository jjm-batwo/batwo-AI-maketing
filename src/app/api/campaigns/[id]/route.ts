import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'
import {
  UpdateCampaignUseCase,
  CampaignNotFoundError,
  UnauthorizedCampaignAccessError,
} from '@application/use-cases/campaign/UpdateCampaignUseCase'
import { DuplicateCampaignNameError } from '@application/use-cases/campaign/CreateCampaignUseCase'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'

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

    const updateCampaign = container.resolve<UpdateCampaignUseCase>(
      DI_TOKENS.UpdateCampaignUseCase
    )

    const result = await updateCampaign.execute({
      campaignId: id,
      userId: user.id,
      name: body.name,
      dailyBudget: body.dailyBudget,
      currency: body.currency,
      startDate: body.startDate,
      endDate: body.endDate,
      targetAudience: body.targetAudience,
      syncToMeta: body.syncToMeta,
      accessToken: body.accessToken,
      adAccountId: body.adAccountId,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof CampaignNotFoundError) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (error instanceof UnauthorizedCampaignAccessError) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (error instanceof DuplicateCampaignNameError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      // Handle domain errors (e.g., "Cannot update a completed campaign")
      if (error.message.includes('Cannot update')) {
        return NextResponse.json(
          { message: error.message },
          { status: 400 }
        )
      }
    }

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
