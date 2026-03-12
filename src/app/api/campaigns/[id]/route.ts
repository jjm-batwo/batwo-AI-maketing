import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { GetCampaignUseCase } from '@application/use-cases/campaign/GetCampaignUseCase'
import {
  UpdateCampaignUseCase,
  CampaignNotFoundError,
  UnauthorizedCampaignAccessError,
} from '@application/use-cases/campaign/UpdateCampaignUseCase'
import { DeleteCampaignUseCase } from '@application/use-cases/campaign/DeleteCampaignUseCase'
import { DuplicateCampaignNameError } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { InvalidCampaignError } from '@domain/errors/InvalidCampaignError'
import { invalidateCache, getUserPattern } from '@/lib/cache/kpiCache'
import { revalidateTag } from 'next/cache'
import { updateCampaignSchema, validateBody } from '@/lib/validations'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    const getCampaign = container.resolve<GetCampaignUseCase>(DI_TOKENS.GetCampaignUseCase)

    const campaign = await getCampaign.execute({
      campaignId: id,
      userId: user.id,
    })

    if (!campaign) {
      return NextResponse.json({ message: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json(campaign)
  } catch (error) {
    console.error('Failed to fetch campaign:', error)
    return NextResponse.json({ message: 'Failed to fetch campaign' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // Validate request body
    const validation = await validateBody(request, updateCampaignSchema)
    if (!validation.success) return validation.error

    const body = validation.data

    const updateCampaign = container.resolve<UpdateCampaignUseCase>(DI_TOKENS.UpdateCampaignUseCase)

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
      status: body.status,
    })

    // Invalidate KPI cache for this user
    invalidateCache(getUserPattern(user.id))
    revalidateTag('campaigns', 'default')
    revalidateTag('admin-dashboard', 'default')

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof CampaignNotFoundError) {
      return NextResponse.json({ message: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    if (error instanceof UnauthorizedCampaignAccessError) {
      return NextResponse.json({ message: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    if (error instanceof DuplicateCampaignNameError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    if (error instanceof InvalidCampaignError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    console.error('Failed to update campaign:', error)
    return NextResponse.json({ message: 'Failed to update campaign' }, { status: 500 })
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

    const deleteCampaign = container.resolve<DeleteCampaignUseCase>(DI_TOKENS.DeleteCampaignUseCase)

    await deleteCampaign.execute(id, user.id)

    // Invalidate KPI cache for this user
    invalidateCache(getUserPattern(user.id))
    revalidateTag('campaigns', 'default')
    revalidateTag('admin-dashboard', 'default')

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof Error && error.name === 'NotFoundError') {
      return NextResponse.json({ message: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }
    if (error instanceof Error && error.name === 'ForbiddenError') {
      return NextResponse.json({ message: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }
    console.error('Failed to delete campaign:', error)
    return NextResponse.json({ message: 'Failed to delete campaign' }, { status: 500 })
  }
}
