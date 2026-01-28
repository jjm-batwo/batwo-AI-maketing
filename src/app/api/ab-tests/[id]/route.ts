import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getABTestRepository, getCampaignRepository } from '@/lib/di/container'
import { updateABTestSchema, validateBody } from '@/lib/validations'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/ab-tests/[id]
 * Get A/B test details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const abTestRepository = getABTestRepository()
    const campaignRepository = getCampaignRepository()

    const abTest = await abTestRepository.findById(id)
    if (!abTest) {
      return NextResponse.json(
        { message: 'A/B 테스트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Verify ownership
    const campaign = await campaignRepository.findById(abTest.campaignId)
    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        { message: 'A/B 테스트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    const statisticalResult = abTest.calculateStatisticalSignificance()

    return NextResponse.json({
      abTest: {
        id: abTest.id,
        campaignId: abTest.campaignId,
        name: abTest.name,
        description: abTest.description,
        status: abTest.status,
        variants: abTest.variants.map((v) => ({
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
          ctr: v.impressions > 0 ? (v.clicks / v.impressions) * 100 : 0,
          conversionRate: v.clicks > 0 ? (v.conversions / v.clicks) * 100 : 0,
        })),
        startDate: abTest.startDate.toISOString(),
        endDate: abTest.endDate?.toISOString() ?? null,
        confidenceLevel: abTest.confidenceLevel,
        minimumSampleSize: abTest.minimumSampleSize,
        statisticalResult: {
          winner: statisticalResult.winner
            ? {
                id: statisticalResult.winner.id,
                name: statisticalResult.winner.name,
              }
            : null,
          isSignificant: statisticalResult.isSignificant,
          confidence: statisticalResult.confidence,
          uplift: statisticalResult.uplift,
          pValue: statisticalResult.pValue,
        },
        createdAt: abTest.createdAt.toISOString(),
        updatedAt: abTest.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to fetch A/B test:', error)
    return NextResponse.json(
      { message: 'A/B 테스트를 조회하는데 실패했습니다' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/ab-tests/[id]
 * Update A/B test (start, pause, complete)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params

    // Validate request body
    const validation = await validateBody(request, updateABTestSchema)
    if (!validation.success) return validation.error

    const { action, variantMetrics } = validation.data

    const abTestRepository = getABTestRepository()
    const campaignRepository = getCampaignRepository()

    const abTest = await abTestRepository.findById(id)
    if (!abTest) {
      return NextResponse.json(
        { message: 'A/B 테스트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Verify ownership
    const campaign = await campaignRepository.findById(abTest.campaignId)
    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        { message: 'A/B 테스트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    let updated = abTest

    // Handle status change actions
    if (action) {
      switch (action) {
        case 'start':
          updated = abTest.start()
          break
        case 'pause':
          updated = abTest.pause()
          break
        case 'complete':
          updated = abTest.complete()
          break
        default:
          return NextResponse.json(
            { message: '유효하지 않은 액션입니다' },
            { status: 400 }
          )
      }
    }

    // Handle variant metrics update
    if (variantMetrics && Array.isArray(variantMetrics)) {
      for (const metrics of variantMetrics) {
        updated = updated.updateVariantMetrics(metrics.variantId, {
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          conversions: metrics.conversions,
        })
      }
    }

    const saved = await abTestRepository.update(updated)

    return NextResponse.json({
      message: 'A/B 테스트가 업데이트되었습니다',
      abTest: {
        id: saved.id,
        name: saved.name,
        status: saved.status,
        statisticalResult: saved.calculateStatisticalSignificance(),
      },
    })
  } catch (error) {
    console.error('Failed to update A/B test:', error)
    const message = error instanceof Error ? error.message : 'A/B 테스트 업데이트에 실패했습니다'
    return NextResponse.json({ message }, { status: 500 })
  }
}

/**
 * DELETE /api/ab-tests/[id]
 * Delete an A/B test
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const abTestRepository = getABTestRepository()
    const campaignRepository = getCampaignRepository()

    const abTest = await abTestRepository.findById(id)
    if (!abTest) {
      return NextResponse.json(
        { message: 'A/B 테스트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Verify ownership
    const campaign = await campaignRepository.findById(abTest.campaignId)
    if (!campaign || campaign.userId !== user.id) {
      return NextResponse.json(
        { message: 'A/B 테스트를 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    // Only allow deletion of DRAFT or COMPLETED tests
    if (abTest.status === 'RUNNING') {
      return NextResponse.json(
        { message: '실행 중인 테스트는 삭제할 수 없습니다. 먼저 테스트를 완료해주세요.' },
        { status: 400 }
      )
    }

    await abTestRepository.delete(id)

    return NextResponse.json({
      message: 'A/B 테스트가 삭제되었습니다',
    })
  } catch (error) {
    console.error('Failed to delete A/B test:', error)
    return NextResponse.json(
      { message: 'A/B 테스트 삭제에 실패했습니다' },
      { status: 500 }
    )
  }
}
