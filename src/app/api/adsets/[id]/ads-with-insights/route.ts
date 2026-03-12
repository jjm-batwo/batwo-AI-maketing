import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { getMetaAccountForUser } from '@/lib/meta/metaAccountHelper'

type DatePreset = 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id: adSetId } = await params
    const { searchParams } = new URL(request.url)
    const datePreset = (searchParams.get('datePreset') || 'last_7d') as DatePreset

    const metaAdsService = container.resolve<IMetaAdsService>(DI_TOKENS.MetaAdsService)

    const metaAccount = await getMetaAccountForUser(user.id)
    if (!metaAccount) {
      return NextResponse.json({ message: 'Meta 계정 연결이 필요합니다' }, { status: 400 })
    }

    const ads = await metaAdsService.listAds(metaAccount.accessToken, adSetId)

    const settledInsights = await Promise.allSettled(
      ads.map((ad) => metaAdsService.getAdInsights(metaAccount.accessToken, ad.id, datePreset))
    )

    const adsWithInsights = ads.map((ad, index) => {
      const settled = settledInsights[index]
      if (settled.status === 'fulfilled') {
        return {
          ...ad,
          insights: settled.value,
        }
      }

      console.error('Failed to fetch ad insights:', {
        adId: ad.id,
        error: settled.reason,
      })

      return {
        ...ad,
        insights: {
          campaignId: '',
          impressions: 0,
          reach: 0,
          clicks: 0,
          linkClicks: 0,
          spend: 0,
          conversions: 0,
          revenue: 0,
          dateStart: '',
          dateStop: '',
        },
      }
    })

    return NextResponse.json({ ads: adsWithInsights })
  } catch (error) {
    console.error('Failed to fetch ads with insights:', error)
    return NextResponse.json({ message: 'Failed to fetch ads with insights' }, { status: 500 })
  }
}
