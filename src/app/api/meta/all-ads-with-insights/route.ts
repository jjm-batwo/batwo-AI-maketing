import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { MetaAdsClient } from '@/infrastructure/external/meta-ads/MetaAdsClient'
import { prisma } from '@/lib/prisma'

async function mapWithConcurrency<T, U>(
    items: T[],
    limit: number,
    fn: (item: T) => Promise<U>
): Promise<U[]> {
    const results: U[] = []
    for (let i = 0; i < items.length; i += limit) {
        const chunk = items.slice(i, i + limit)
        const chunkResults = await Promise.all(chunk.map(fn))
        results.push(...chunkResults)
    }
    return results
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthenticatedUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized', ads: [] }, { status: 401 })
        }
        const { searchParams } = new URL(request.url)
        const datePreset = searchParams.get('datePreset') || 'last_7d'

        const metaAccount = await prisma.metaAdAccount.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        })

        if (!metaAccount || !metaAccount.accessToken || !metaAccount.metaAccountId) {
            return NextResponse.json({ ads: [] })
        }

        const metaAdsClient = new MetaAdsClient()

        // 1. Get campaigns
        const { campaigns } = await metaAdsClient.listCampaigns(
            metaAccount.accessToken,
            metaAccount.metaAccountId,
            { limit: 10 } // limit campaigns to prevent abuse
        )

        // 2. Get adsets (conc 2)
        const allAdSetsNested = await mapWithConcurrency(campaigns as any[], 2, async (campaign: any) => {
            try {
                const adSets = await metaAdsClient.listAdSets(metaAccount.accessToken!, campaign.id)
                return adSets
            } catch (error) {
                return []
            }
        })
        const flattenedAdSets = allAdSetsNested.flat()

        // 3. Get ads (conc 2)
        const allAdsNested = await mapWithConcurrency(flattenedAdSets, 2, async (adSet) => {
            try {
                const ads = await metaAdsClient.listAds(metaAccount.accessToken!, adSet.id)
                return ads
            } catch (error) {
                return []
            }
        })
        const flattenedAds = allAdsNested.flat()

        // 4. Get insights (conc 2)
        const adsWithInsights = await mapWithConcurrency(flattenedAds, 2, async (ad) => {
            try {
                const insights = await metaAdsClient.getAdInsights(
                    metaAccount.accessToken!,
                    ad.id,
                    datePreset as any
                )

                return {
                    id: ad.id,
                    name: ad.name,
                    status: ad.status,
                    insights: {
                        impressions: insights.impressions,
                        clicks: insights.clicks,
                        spend: insights.spend,
                        conversions: insights.conversions,
                        revenue: insights.revenue,
                    },
                }
            } catch (error) {
                return {
                    id: ad.id,
                    name: ad.name,
                    status: ad.status,
                    insights: {
                        impressions: 0,
                        clicks: 0,
                        spend: 0,
                        conversions: 0,
                        revenue: 0,
                    },
                }
            }
        })

        return NextResponse.json({ ads: adsWithInsights })
    } catch (error: any) {
        console.error('[AllAds API]', error)
        return NextResponse.json({ ads: [], error: 'Internal server error' }, { status: 500 })
    }
}
