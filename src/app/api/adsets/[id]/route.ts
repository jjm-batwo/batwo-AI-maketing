import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import {
  UpdateAdSetUseCase,
  AdSetNotFoundError,
} from '@application/use-cases/adset/UpdateAdSetUseCase'
import {
  DeleteAdSetUseCase,
  AdSetNotFoundError as DeleteNotFoundError,
} from '@application/use-cases/adset/DeleteAdSetUseCase'
import { DomainError } from '@domain/errors/DomainError'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { IAdSetRepository } from '@domain/repositories/IAdSetRepository'
import { revalidateTag } from 'next/cache'

// AdSet 소유권 확인 헬퍼
async function verifyAdSetOwnership(adSetId: string, userId: string) {
  const adSetRepository = container.resolve<IAdSetRepository>(DI_TOKENS.AdSetRepository)
  const campaignRepository = container.resolve<ICampaignRepository>(DI_TOKENS.CampaignRepository)
  const adSet = await adSetRepository.findById(adSetId)
  if (!adSet) return null

  const campaign = await campaignRepository.findById(adSet.campaignId)
  if (!campaign || campaign.userId !== userId) return null

  return adSet
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const adSet = await verifyAdSetOwnership(id, user.id)

    if (!adSet) {
      return NextResponse.json({ error: '광고 세트를 찾을 수 없습니다' }, { status: 404 })
    }

    const { toAdSetDTO } = await import('@application/dto/adset/AdSetDTO')
    return NextResponse.json(toAdSetDTO(adSet))
  } catch (error) {
    console.error('Failed to fetch adset:', error)
    return NextResponse.json({ error: 'Failed to fetch adset' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // 소유권 확인
    const existing = await verifyAdSetOwnership(id, user.id)
    if (!existing) {
      return NextResponse.json({ error: '광고 세트를 찾을 수 없습니다' }, { status: 404 })
    }

    const body = await request.json()

    const updateAdSet = container.resolve<UpdateAdSetUseCase>(DI_TOKENS.UpdateAdSetUseCase)
    const result = await updateAdSet.execute({
      id,
      name: body.name,
      dailyBudget: body.dailyBudget,
      lifetimeBudget: body.lifetimeBudget,
      currency: body.currency,
      status: body.status,
      targeting: body.targeting,
    })

    revalidateTag('campaigns', 'default')

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AdSetNotFoundError) {
      return NextResponse.json({ error: '광고 세트를 찾을 수 없습니다' }, { status: 404 })
    }

    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.error('Failed to update adset:', error)
    return NextResponse.json({ error: 'Failed to update adset' }, { status: 500 })
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

    // 소유권 확인
    const existing = await verifyAdSetOwnership(id, user.id)
    if (!existing) {
      return NextResponse.json({ error: '광고 세트를 찾을 수 없습니다' }, { status: 404 })
    }

    const deleteAdSet = container.resolve<DeleteAdSetUseCase>(DI_TOKENS.DeleteAdSetUseCase)
    await deleteAdSet.execute(id)

    revalidateTag('campaigns', 'default')

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof DeleteNotFoundError) {
      return NextResponse.json({ error: '광고 세트를 찾을 수 없습니다' }, { status: 404 })
    }

    console.error('Failed to delete adset:', error)
    return NextResponse.json({ error: 'Failed to delete adset' }, { status: 500 })
  }
}
