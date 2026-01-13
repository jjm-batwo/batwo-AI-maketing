import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getABTestRepository, getCampaignRepository } from '@/lib/di/container'
import { ABTest, ABTestVariant } from '@domain/entities/ABTest'
import { Money } from '@domain/value-objects/Money'

/**
 * GET /api/ab-tests
 * Get all A/B tests for a campaign
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { searchParams } = new URL(request.url)
    const campaignId = searchParams.get('campaignId')

    const abTestRepository = getABTestRepository()
    const campaignRepository = getCampaignRepository()

    // If campaignId is provided, verify ownership
    if (campaignId) {
      const campaign = await campaignRepository.findById(campaignId)
      if (!campaign || campaign.userId !== user.id) {
        return NextResponse.json(
          { message: '캠페인을 찾을 수 없습니다' },
          { status: 404 }
        )
      }
    }

    const filters = campaignId ? { campaignId } : {}
    const abTests = await abTestRepository.findByFilters(filters)

    // Filter by user's campaigns
    const userCampaigns = await campaignRepository.findByUserId(user.id)
    const userCampaignIds = new Set(userCampaigns.map((c) => c.id))

    const userAbTests = abTests.filter((test) =>
      userCampaignIds.has(test.campaignId)
    )

    return NextResponse.json({
      abTests: userAbTests.map((test) => ({
        id: test.id,
        campaignId: test.campaignId,
        name: test.name,
        description: test.description,
        status: test.status,
        variants: test.variants.map((v) => ({
          id: v.id,
          name: v.name,
          description: v.description,
          trafficPercent: v.trafficPercent,
          impressions: v.impressions,
          clicks: v.clicks,
          conversions: v.conversions,
          spend: v.spend.amount,
          revenue: v.revenue.amount,
          isControl: v.isControl,
          conversionRate: v.clicks > 0 ? (v.conversions / v.clicks) * 100 : 0,
        })),
        startDate: test.startDate.toISOString(),
        endDate: test.endDate?.toISOString() ?? null,
        confidenceLevel: test.confidenceLevel,
        minimumSampleSize: test.minimumSampleSize,
        statisticalResult: test.calculateStatisticalSignificance(),
        createdAt: test.createdAt.toISOString(),
        updatedAt: test.updatedAt.toISOString(),
      })),
      count: userAbTests.length,
    })
  } catch (error) {
    console.error('Failed to fetch A/B tests:', error)
    return NextResponse.json(
      { message: 'A/B 테스트 목록을 조회하는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ab-tests
 * Create a new A/B test
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { campaignId, name, description, variants, startDate, confidenceLevel, minimumSampleSize } = body

    // Validate required fields
    if (!campaignId || !name || !variants || variants.length < 2) {
      return NextResponse.json(
        { message: '캠페인 ID, 이름, 최소 2개의 변형이 필요합니다' },
        { status: 400 }
      )
    }

    const campaignRepository = getCampaignRepository()
    const abTestRepository = getABTestRepository()

    // Verify campaign ownership
    const campaign = await campaignRepository.findById(campaignId)
    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        { message: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Build variants
    const abTestVariants: ABTestVariant[] = variants.map((v: {
      name: string
      description?: string
      trafficPercent: number
      isControl: boolean
    }) => ({
      id: crypto.randomUUID(),
      name: v.name,
      description: v.description,
      trafficPercent: v.trafficPercent,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: Money.create(0, 'KRW'),
      revenue: Money.create(0, 'KRW'),
      isControl: v.isControl,
    }))

    // Create A/B test
    const abTest = ABTest.create({
      campaignId,
      name,
      description,
      status: 'DRAFT',
      variants: abTestVariants,
      startDate: startDate ? new Date(startDate) : new Date(),
      confidenceLevel: confidenceLevel || 95,
      minimumSampleSize: minimumSampleSize || 1000,
    })

    const saved = await abTestRepository.save(abTest)

    return NextResponse.json({
      message: 'A/B 테스트가 생성되었습니다',
      abTest: {
        id: saved.id,
        campaignId: saved.campaignId,
        name: saved.name,
        status: saved.status,
        variants: saved.variants.map((v) => ({
          id: v.id,
          name: v.name,
          trafficPercent: v.trafficPercent,
          isControl: v.isControl,
        })),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create A/B test:', error)
    const message = error instanceof Error ? error.message : 'A/B 테스트 생성에 실패했습니다'
    return NextResponse.json({ message }, { status: 500 })
  }
}
