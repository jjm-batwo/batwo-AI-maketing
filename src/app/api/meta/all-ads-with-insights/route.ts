import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { MetaAdsClient } from '@/infrastructure/external/meta-ads/MetaAdsClient'
import { MetaAdsApiError } from '@/infrastructure/external/errors'
import { prisma } from '@/lib/prisma'
import { mapWithConcurrency } from '@/lib/utils/mapWithConcurrency'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

const LOG_PREFIX = '[AllAds API]'

/** 기본 인사이트 (에러 발생 시 fallback) */
const EMPTY_INSIGHTS = {
    impressions: 0,
    clicks: 0,
    spend: 0,
    conversions: 0,
    revenue: 0,
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

        // 1. accessToken 복호화 (실패 시 토큰 만료로 처리)
        let decryptedToken: string
        try {
            decryptedToken = safeDecryptToken(metaAccount.accessToken)
        } catch (error) {
            console.error(`${LOG_PREFIX} Token decryption failed for user ${user.id}`, error)
            return NextResponse.json(
                { error: 'Token decryption failed. Please reconnect your Meta account.', ads: [] },
                { status: 401 }
            )
        }

        if (!decryptedToken) {
            return NextResponse.json(
                { error: 'Invalid access token. Please reconnect your Meta account.', ads: [] },
                { status: 401 }
            )
        }

        const metaAdsClient = new MetaAdsClient()

        // 2. Get campaigns (권한 박탈/토큰 만료 감지)
        let campaigns: any[]
        try {
            const result = await metaAdsClient.listCampaigns(
                decryptedToken,
                metaAccount.metaAccountId,
                { limit: 10 }
            )
            campaigns = result.campaigns ?? []
        } catch (error) {
            if (error instanceof MetaAdsApiError) {
                if (MetaAdsApiError.isAuthError(error)) {
                    console.warn(`${LOG_PREFIX} Auth error (token expired/revoked) for user ${user.id}`, error.message)
                    return NextResponse.json(
                        { error: 'Meta access token expired or revoked. Please reconnect your account.', ads: [] },
                        { status: 401 }
                    )
                }
                if (MetaAdsApiError.isRateLimitError(error)) {
                    console.warn(`${LOG_PREFIX} Rate limit hit at campaign level for user ${user.id}`)
                    return NextResponse.json(
                        { error: 'Meta API rate limit reached. Please try again later.', ads: [], _rateLimited: true },
                        { status: 429 }
                    )
                }
            }
            throw error
        }

        // 3. 빈 캠페인 → 빈 광고
        if (campaigns.length === 0) {
            return NextResponse.json({ ads: [] })
        }

        // 4. Get adsets (conc 2) - rate limit 발생 시 partial 결과 반환
        let rateLimitHit = false
        const allAdSetsNested = await mapWithConcurrency(campaigns, 2, async (campaign: any) => {
            try {
                const adSets = await metaAdsClient.listAdSets(decryptedToken, campaign.id)
                return adSets
            } catch (error) {
                if (error instanceof MetaAdsApiError) {
                    if (MetaAdsApiError.isAuthError(error)) {
                        throw error // 인증 에러는 즉시 전파
                    }
                    if (MetaAdsApiError.isRateLimitError(error)) {
                        rateLimitHit = true
                        console.warn(`${LOG_PREFIX} Rate limit fetching adsets for campaign ${campaign.id}`)
                    }
                }
                return []
            }
        })
        const flattenedAdSets = allAdSetsNested.flat()

        // 5. Get ads (conc 2)
        const allAdsNested = await mapWithConcurrency(flattenedAdSets, 2, async (adSet) => {
            try {
                const ads = await metaAdsClient.listAds(decryptedToken, adSet.id)
                return ads
            } catch (error) {
                if (error instanceof MetaAdsApiError) {
                    if (MetaAdsApiError.isAuthError(error)) {
                        throw error
                    }
                    if (MetaAdsApiError.isRateLimitError(error)) {
                        rateLimitHit = true
                        console.warn(`${LOG_PREFIX} Rate limit fetching ads for adset ${adSet.id}`)
                    }
                }
                return []
            }
        })
        const flattenedAds = allAdsNested.flat()

        // 6. 빈 광고 → early return
        if (flattenedAds.length === 0) {
            return NextResponse.json({ ads: [], ...(rateLimitHit && { _rateLimited: true }) })
        }

        // 7. Get insights (conc 2)
        const adsWithInsights = await mapWithConcurrency(flattenedAds, 2, async (ad) => {
            try {
                const insights = await metaAdsClient.getAdInsights(
                    decryptedToken,
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
                if (error instanceof MetaAdsApiError) {
                    if (MetaAdsApiError.isAuthError(error)) {
                        throw error
                    }
                    if (MetaAdsApiError.isRateLimitError(error)) {
                        rateLimitHit = true
                        console.warn(`${LOG_PREFIX} Rate limit fetching insights for ad ${ad.id}`)
                    }
                }
                return {
                    id: ad.id,
                    name: ad.name,
                    status: ad.status,
                    insights: { ...EMPTY_INSIGHTS },
                }
            }
        })

        return NextResponse.json({
            ads: adsWithInsights,
            ...(rateLimitHit && { _rateLimited: true }),
        })
    } catch (error: any) {
        // Auth 에러가 최외부까지 전파된 경우
        if (error instanceof MetaAdsApiError && MetaAdsApiError.isAuthError(error)) {
            console.warn(`${LOG_PREFIX} Auth error propagated`, error.message)
            return NextResponse.json(
                { error: 'Meta access token expired or revoked. Please reconnect your account.', ads: [] },
                { status: 401 }
            )
        }

        console.error(LOG_PREFIX, error)
        return NextResponse.json({ ads: [], error: 'Internal server error' }, { status: 500 })
    }
}
