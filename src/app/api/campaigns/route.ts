import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import { CreateCampaignUseCase, DuplicateCampaignNameError } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { CampaignStatus } from '@domain/value-objects/CampaignStatus'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const status = searchParams.get('status') as CampaignStatus | null

    const listCampaigns = container.resolve<ListCampaignsUseCase>(
      DI_TOKENS.ListCampaignsUseCase
    )

    const result = await listCampaigns.execute({
      userId: user.id,
      page,
      limit: pageSize,
      status: status || undefined,
    })

    return NextResponse.json({
      campaigns: result.data,
      total: result.total,
      page: result.page,
      pageSize: result.limit,
    })
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
    return NextResponse.json(
      { message: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.objective || !body.dailyBudget || !body.startDate) {
      return NextResponse.json(
        { message: '필수 항목을 모두 입력해주세요' },
        { status: 400 }
      )
    }

    const createCampaign = container.resolve<CreateCampaignUseCase>(
      DI_TOKENS.CreateCampaignUseCase
    )

    const result = await createCampaign.execute({
      userId: user.id,
      name: body.name,
      objective: body.objective as CampaignObjective,
      dailyBudget: body.dailyBudget,
      currency: body.currency || 'KRW',
      startDate: body.startDate,
      endDate: body.endDate,
      targetAudience: body.targetAudience,
      syncToMeta: body.syncToMeta,
      accessToken: body.accessToken,
      adAccountId: body.adAccountId,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Failed to create campaign:', error)

    if (error instanceof DuplicateCampaignNameError) {
      return NextResponse.json(
        { message: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
