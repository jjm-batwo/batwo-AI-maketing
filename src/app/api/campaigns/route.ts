import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { ListCampaignsUseCase } from '@application/use-cases/campaign/ListCampaignsUseCase'
import { CreateCampaignUseCase, DuplicateCampaignNameError } from '@application/use-cases/campaign/CreateCampaignUseCase'
import { CreateAdvantageCampaignUseCase, InvalidAdvantageConfigError } from '@application/use-cases/campaign/CreateAdvantageCampaignUseCase'
import { CampaignObjective } from '@domain/value-objects/CampaignObjective'
import { campaignQuerySchema, createCampaignSchema, validateQuery, validateBody } from '@/lib/validations'
import { invalidateCache, getUserPattern } from '@/lib/cache/kpiCache'
import { revalidateTag } from 'next/cache'
import { checkRateLimit, getClientIp, addRateLimitHeaders, rateLimitExceededResponse } from '@/lib/middleware/rateLimit'

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const validation = validateQuery(searchParams, campaignQuerySchema)
    if (!validation.success) return validation.error

    const { page, pageSize, status } = validation.data

    const listCampaigns = container.resolve<ListCampaignsUseCase>(
      DI_TOKENS.ListCampaignsUseCase
    )

    const result = await listCampaigns.execute({
      userId: user.id,
      page,
      limit: pageSize,
      status,
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

  // Rate limiting for campaign creation
  const clientIp = getClientIp(request)
  const rateLimitKey = `${user.id}:${clientIp}`
  const rateLimitResult = await checkRateLimit(rateLimitKey, 'campaignCreate')

  if (!rateLimitResult.success) {
    return rateLimitExceededResponse(rateLimitResult)
  }

  try {
    // Validate request body
    const validation = await validateBody(request, createCampaignSchema)
    if (!validation.success) return validation.error

    const body = validation.data

    const dtoBase = {
      userId: user.id,
      name: body.name,
      objective: body.objective as CampaignObjective,
      dailyBudget: body.dailyBudget,
      currency: body.currency,
      startDate: body.startDate,
      endDate: body.endDate,
      targetAudience: body.targetAudience,
      syncToMeta: body.syncToMeta,
      accessToken: body.accessToken,
      adAccountId: body.adAccountId,
      advantageConfig: body.advantageConfig,
    }

    // Advantage+ 분기: advantageConfig가 있으면 CreateAdvantageCampaignUseCase 사용
    let result
    if (body.advantageConfig) {
      const createAdvantage = container.resolve<CreateAdvantageCampaignUseCase>(
        DI_TOKENS.CreateAdvantageCampaignUseCase
      )
      result = await createAdvantage.execute(dtoBase)
    } else {
      const createCampaign = container.resolve<CreateCampaignUseCase>(
        DI_TOKENS.CreateCampaignUseCase
      )
      result = await createCampaign.execute(dtoBase)
    }

    // Invalidate KPI cache for this user
    invalidateCache(getUserPattern(user.id))
    revalidateTag('campaigns', 'default')
    revalidateTag('kpi', 'default')
    revalidateTag('admin-dashboard', 'default')

    const response = NextResponse.json(result, { status: 201 })
    return addRateLimitHeaders(response, rateLimitResult)
  } catch (error) {
    console.error('Failed to create campaign:', error)

    if (error instanceof DuplicateCampaignNameError) {
      return NextResponse.json(
        { message: error.message },
        { status: 409 }
      )
    }

    if (error instanceof InvalidAdvantageConfigError) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}
