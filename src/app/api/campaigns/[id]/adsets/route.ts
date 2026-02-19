import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { PrismaAdSetRepository } from '@infrastructure/database/repositories/PrismaAdSetRepository'
import { PrismaCampaignRepository } from '@infrastructure/database/repositories/PrismaCampaignRepository'
import { CreateAdSetUseCase, CampaignNotFoundError } from '@application/use-cases/adset/CreateAdSetUseCase'
import { ListAdSetsUseCase } from '@application/use-cases/adset/ListAdSetsUseCase'
import { prisma } from '@/lib/prisma'

const campaignRepository = new PrismaCampaignRepository(prisma)
const adSetRepository = new PrismaAdSetRepository(prisma)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // 캠페인 소유권 확인
    const campaign = await campaignRepository.findById(id)
    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const listAdSets = new ListAdSetsUseCase(adSetRepository)
    const adSets = await listAdSets.execute(id)

    return NextResponse.json({ adSets })
  } catch (error) {
    console.error('Failed to fetch adsets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adsets' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // 캠페인 소유권 확인
    const campaign = await campaignRepository.findById(id)
    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const body = await request.json()

    const createAdSet = new CreateAdSetUseCase(campaignRepository, adSetRepository)
    const result = await createAdSet.execute({
      campaignId: id,
      name: body.name,
      dailyBudget: body.dailyBudget,
      lifetimeBudget: body.lifetimeBudget,
      currency: body.currency,
      billingEvent: body.billingEvent,
      optimizationGoal: body.optimizationGoal,
      bidStrategy: body.bidStrategy,
      targeting: body.targeting,
      placements: body.placements,
      schedule: body.schedule,
      startDate: body.startDate,
      endDate: body.endDate,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof CampaignNotFoundError) {
      return NextResponse.json(
        { error: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    console.error('Failed to create adset:', error)
    return NextResponse.json(
      { error: 'Failed to create adset' },
      { status: 500 }
    )
  }
}
