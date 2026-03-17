import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { prisma } from '@/lib/prisma'
import { getMetaAccountForUser } from '@/lib/meta/metaAccountHelper'

type DatePreset = 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id: campaignId } = await params
    const { searchParams } = new URL(request.url)
    const datePreset = (searchParams.get('datePreset') || 'last_7d') as DatePreset

    const metaAdsService = container.resolve<IMetaAdsService>(DI_TOKENS.MetaAdsService)

    const metaAccount = await getMetaAccountForUser(user.id)
    if (!metaAccount) {
      return NextResponse.json({ message: 'Meta 계정 연결이 필요합니다' }, { status: 400 })
    }

    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: user.id },
      select: { metaCampaignId: true },
    })

    if (!campaign) {
      return NextResponse.json({ message: '캠페인을 찾을 수 없습니다' }, { status: 404 })
    }

    if (!campaign.metaCampaignId) {
      return NextResponse.json({ adSets: [] })
    }

    const [adSets, insightsMap] = await Promise.all([
      metaAdsService.listAdSets(metaAccount.accessToken, campaign.metaCampaignId),
      metaAdsService.getAccountInsights(metaAccount.accessToken, metaAccount.metaAccountId, {
        level: 'adset',
        datePreset,
        campaignIds: [campaign.metaCampaignId],
      }),
    ])

    const emptyInsights = {
      campaignId: campaign.metaCampaignId,
      impressions: 0,
      reach: 0,
      clicks: 0,
      linkClicks: 0,
      spend: 0,
      conversions: 0,
      revenue: 0,
      dateStart: '',
      dateStop: '',
    }

    const adSetsWithInsights = adSets.map((adSet) => ({
      ...adSet,
      insights: insightsMap.get(adSet.id) ?? emptyInsights,
    }))

    return NextResponse.json({ adSets: adSetsWithInsights })
  } catch (error) {
    console.error('Failed to fetch ad sets with insights:', error)
    return NextResponse.json({ message: 'Failed to fetch ad sets with insights' }, { status: 500 })
  }
}
