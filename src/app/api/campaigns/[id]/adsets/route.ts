import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { CampaignNotFoundError } from '@application/use-cases/adset/CreateAdSetUseCase'
import type { ICampaignRepository } from '@domain/repositories/ICampaignRepository'
import type { CreateAdSetUseCase } from '@application/use-cases/adset/CreateAdSetUseCase'
import type { ListAdSetsUseCase } from '@application/use-cases/adset/ListAdSetsUseCase'
import { revalidateTag } from 'next/cache'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // 캠페인 소유권 확인
    const campaignRepository = container.resolve<ICampaignRepository>(DI_TOKENS.CampaignRepository)
    const campaign = await campaignRepository.findById(id)
    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    const listAdSets = container.resolve<ListAdSetsUseCase>(DI_TOKENS.ListAdSetsUseCase)
    const adSets = await listAdSets.execute(id)

    return NextResponse.json({ adSets })
  } catch (error) {
    console.error('Failed to fetch adsets:', error)
    return NextResponse.json({ error: 'Failed to fetch adsets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // 캠페인 소유권 확인
    const campaignRepository = container.resolve<ICampaignRepository>(DI_TOKENS.CampaignRepository)
    const campaign = await campaignRepository.findById(id)
    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    const body = await request.json()

    const createAdSet = container.resolve<CreateAdSetUseCase>(DI_TOKENS.CreateAdSetUseCase)
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

    revalidateTag('campaigns', 'default')

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    if (error instanceof CampaignNotFoundError) {
      return NextResponse.json({ error: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    console.error('Failed to create adset:', error)
    return NextResponse.json({ error: 'Failed to create adset' }, { status: 500 })
  }
}
