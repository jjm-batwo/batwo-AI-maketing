import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { PrismaAdSetRepository } from '@infrastructure/database/repositories/PrismaAdSetRepository'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { UpdateAdSetUseCase, AdSetNotFoundError } from '@application/use-cases/adset/UpdateAdSetUseCase'
import { DeleteAdSetUseCase, AdSetNotFoundError as DeleteNotFoundError } from '@application/use-cases/adset/DeleteAdSetUseCase'
import { prisma } from '@/lib/prisma'

const campaignRepository = new PrismaCampaignRepository(prisma)
const adSetRepository = new PrismaAdSetRepository(prisma)

// AdSet 소유권 확인 헬퍼
async function verifyAdSetOwnership(adSetId: string, userId: string) {
  const adSet = await adSetRepository.findById(adSetId)
  if (!adSet) return null

  const campaign = await campaignRepository.findById(adSet.campaignId)
  if (!campaign || campaign.userId !== userId) return null

  return adSet
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const adSet = await verifyAdSetOwnership(id, user.id)

    if (!adSet) {
      return NextResponse.json(
        { error: '광고 세트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const { toAdSetDTO } = await import('@application/dto/adset/AdSetDTO')
    return NextResponse.json(toAdSetDTO(adSet))
  } catch (error) {
    console.error('Failed to fetch adset:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adset' },
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

    // 소유권 확인
    const existing = await verifyAdSetOwnership(id, user.id)
    if (!existing) {
      return NextResponse.json(
        { error: '광고 세트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const updateAdSet = new UpdateAdSetUseCase(adSetRepository)
    const result = await updateAdSet.execute({
      id,
      name: body.name,
      dailyBudget: body.dailyBudget,
      lifetimeBudget: body.lifetimeBudget,
      currency: body.currency,
      status: body.status,
      targeting: body.targeting,
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AdSetNotFoundError) {
      return NextResponse.json(
        { error: '광고 세트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (error instanceof Error && error.message.includes('Cannot change status')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    console.error('Failed to update adset:', error)
    return NextResponse.json(
      { error: 'Failed to update adset' },
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

    // 소유권 확인
    const existing = await verifyAdSetOwnership(id, user.id)
    if (!existing) {
      return NextResponse.json(
        { error: '광고 세트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const deleteAdSet = new DeleteAdSetUseCase(adSetRepository)
    await deleteAdSet.execute(id)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    if (error instanceof DeleteNotFoundError) {
      return NextResponse.json(
        { error: '광고 세트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    console.error('Failed to delete adset:', error)
    return NextResponse.json(
      { error: 'Failed to delete adset' },
      { status: 500 }
    )
  }
}
