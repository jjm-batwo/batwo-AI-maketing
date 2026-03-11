import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { MetaAdsClient } from '@/infrastructure/external/meta-ads/MetaAdsClient'
import { MetaAdsApiError } from '@/infrastructure/external/errors'
import type { MetaCampaignListItem } from '@application/ports/IMetaAdsService'
import { prisma } from '@/lib/prisma'
import { mapWithConcurrency } from '@/lib/utils/mapWithConcurrency'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

const LOG_PREFIX = '[AllAdSets API]'

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

        // 1. accessToken 복호화 (실패 시 토큰 만료로 처리)
        let decryptedToken: string
        try {
            decryptedToken = safeDecryptToken(metaAccount.accessToken)
        } catch (error) {
            console.error(`${LOG_PREFIX} Token decryption failed for user ${user.id}`, error)
            return NextResponse.json(
                { error: 'Token decryption failed. Please reconnect your Meta account.', adSets: [] },
                { status: 401 }
            )
        }

        if (!decryptedToken) {
            return NextResponse.json(
                { error: 'Invalid access token. Please reconnect your Meta account.', adSets: [] },
                { status: 401 }
            )
        }

        const metaAdsClient = new MetaAdsClient()

        // 2. Get all campaigns (권한 박탈/토큰 만료 감지)
        let campaigns: MetaCampaignListItem[]
        try {
            const result = await metaAdsClient.listCampaigns(
                decryptedToken,
                metaAccount.metaAccountId,
                { limit: 20 }
            )
            campaigns = result.campaigns ?? []
        } catch (error) {
            if (error instanceof MetaAdsApiError) {
                if (MetaAdsApiError.isAuthError(error)) {
                    console.warn(`${LOG_PREFIX} Auth error (token expired/revoked) for user ${user.id}`, error.message)
                    return NextResponse.json(
                        { error: 'Meta access token expired or revoked. Please reconnect your account.', adSets: [] },
                        { status: 401 }
                    )
                }
                if (MetaAdsApiError.isRateLimitError(error)) {
                    console.warn(`${LOG_PREFIX} Rate limit hit at campaign level for user ${user.id}`)
                    return NextResponse.json(
                        { error: 'Meta API rate limit reached. Please try again later.', adSets: [], _rateLimited: true },
                        { status: 429 }
                    )
                }
            }
            throw error
        }

        // 3. 빈 캠페인 → 빈 광고 세트
        if (campaigns.length === 0) {
            return NextResponse.json({ adSets: [] })
        }

        // 4. Map all ad sets across all campaigns (conc 2) - rate limit graceful degradation
        let rateLimitHit = false
        const allAdSets = await mapWithConcurrency(campaigns, 2, async (campaign) => {
            try {
                const adSets = await metaAdsClient.listAdSets(decryptedToken, campaign.id)
                return adSets.map((as) => ({ ...as, campaignId: campaign.id }))
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

        const flattenedAdSets = allAdSets.flat()

        // 5. 빈 광고 세트 → early return
        if (flattenedAdSets.length === 0) {
            return NextResponse.json({ adSets: [], ...(rateLimitHit ? { _rateLimited: true } : {}) })
        }

        // 6. Map all insights (conc 2) - rate limit graceful degradation
        const adSetsWithInsights = await mapWithConcurrency(flattenedAdSets, 2, async (adSet) => {
            try {
                const insights = await metaAdsClient.getAdSetInsights(
                    decryptedToken,
                    adSet.id,
                    datePreset as 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d'
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
            } catch (error) {
                if (error instanceof MetaAdsApiError) {
                    if (MetaAdsApiError.isAuthError(error)) {
                        throw error
                    }
                    if (MetaAdsApiError.isRateLimitError(error)) {
                        rateLimitHit = true
                        console.warn(`${LOG_PREFIX} Rate limit fetching insights for adset ${adSet.id}`)
                    }
                }
                return {
                    id: adSet.id,
                    name: adSet.name,
                    status: adSet.status,
                    dailyBudget: adSet.dailyBudget,
                    insights: { ...EMPTY_INSIGHTS },
                }
            }
        })

        return NextResponse.json({
            adSets: adSetsWithInsights,
            ...(rateLimitHit ? { _rateLimited: true } : {}),
        })
    } catch (error: unknown) {
        // Auth 에러가 최외부까지 전파된 경우
        if (error instanceof MetaAdsApiError && MetaAdsApiError.isAuthError(error)) {
            console.warn(`${LOG_PREFIX} Auth error propagated`, error.message)
            return NextResponse.json(
                { error: 'Meta access token expired or revoked. Please reconnect your account.', adSets: [] },
                { status: 401 }
            )
        }

        console.error(LOG_PREFIX, error)
        return NextResponse.json({ adSets: [], error: 'Internal server error' }, { status: 500 })
    }
}
