import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { MetaAdsClient } from '@/infrastructure/external/meta-ads/MetaAdsClient'
import { prisma } from '@/lib/prisma'

// Map limits concurrency
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
            return NextResponse.json({ error: 'Unauthorized', adSets: [] }, { status: 401 })
        }
        const { searchParams } = new URL(request.url)
        const datePreset = searchParams.get('datePreset') || 'last_7d'

        // Get Meta Account
        const metaAccount = await prisma.metaAdAccount.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
        })

        if (!metaAccount || !metaAccount.accessToken || !metaAccount.metaAccountId) {
            return NextResponse.json({ adSets: [] })
        }

        const metaAdsClient = new MetaAdsClient()

        // 1. Get all campaigns
        const { campaigns } = await metaAdsClient.listCampaigns(
            metaAccount.accessToken,
            metaAccount.metaAccountId,
            { limit: 20 }
        )

        // 2. Map all ad sets across all campaigns sequentially to avoid rate limits
        const allAdSets = await mapWithConcurrency(campaigns as any[], 2, async (campaign: any) => {
            try {
                const adSets = await metaAdsClient.listAdSets(metaAccount.accessToken!, campaign.id)
                return adSets.map((as) => ({ ...as, campaignId: campaign.id }))
            } catch (error: any) {
                if (error?.message?.includes('limit reached')) {
                    // If rate limited, return empty instead of failing everything
                    console.warn(`Rate limit fetching adsets for campaign ${campaign.id}`)
                }
                return []
            }
        })

        const flattenedAdSets = allAdSets.flat()

        // 3. Map all insights sequentially
        const adSetsWithInsights = await mapWithConcurrency(flattenedAdSets, 2, async (adSet) => {
            try {
                const insights = await metaAdsClient.getAdSetInsights(
                    metaAccount.accessToken!,
                    adSet.id,
                    datePreset as any
                )

                return {
                    id: adSet.id,
                    name: adSet.name,
                    status: adSet.status,
                    dailyBudget: adSet.dailyBudget,
                    insights: {
                        impressions: insights.impressions,
                        clicks: insights.clicks,
                        spend: insights.spend,
                        conversions: insights.conversions,
                        revenue: insights.revenue,
                    },
                }
            } catch (error: any) {
                // Fallback for insights if rate limited
                return {
                    id: adSet.id,
                    name: adSet.name,
                    status: adSet.status,
                    dailyBudget: adSet.dailyBudget,
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

        return NextResponse.json({ adSets: adSetsWithInsights })
    } catch (error: any) {
        console.error('[AllAdSets API]', error)
        // Always return empty array on failure instead of 500
        return NextResponse.json({ adSets: [], error: 'Internal server error' }, { status: 500 })
    }
}
