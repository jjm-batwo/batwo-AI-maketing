import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { MetaAdsClient } from '@/infrastructure/external/meta-ads/MetaAdsClient'
import { MetaAdsApiError } from '@/infrastructure/external/errors'
import type { MetaCampaignListItem } from '@application/ports/IMetaAdsService'
import { getMetaAccountForUser } from '@/lib/meta/metaAccountHelper'

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

    // Get Meta Account (중앙 헬퍼: 조회 + 복호화 + 만료검사 통합)
    const metaAccount = await getMetaAccountForUser(user.id)
    if (!metaAccount) {
      return NextResponse.json({ adSets: [] })
    }

    // getMetaAccountForUser가 내부적으로 safeDecryptToken 적용
    const decryptedToken = metaAccount.accessToken

    const metaAdsClient = new MetaAdsClient()

    // 1. Get all campaigns (권한 박탈/토큰 만료 감지)
    let campaigns: MetaCampaignListItem[]
    try {
      const result = await metaAdsClient.listCampaigns(decryptedToken, metaAccount.metaAccountId, {
        limit: 20,
      })
      campaigns = result.campaigns ?? []
    } catch (error) {
      if (error instanceof MetaAdsApiError) {
        if (MetaAdsApiError.isAuthError(error)) {
          console.warn(
            `${LOG_PREFIX} Auth error (token expired/revoked) for user ${user.id}`,
            error.message
          )
          return NextResponse.json(
            {
              error: 'Meta access token expired or revoked. Please reconnect your account.',
              adSets: [],
            },
            { status: 401 }
          )
        }
        if (MetaAdsApiError.isRateLimitError(error)) {
          console.warn(`${LOG_PREFIX} Rate limit hit at campaign level for user ${user.id}`)
          return NextResponse.json(
            {
              error: 'Meta API rate limit reached. Please try again later.',
              adSets: [],
              _rateLimited: true,
            },
            { status: 429 }
          )
        }
      }
      throw error
    }

    // 2. 빈 캠페인 → 빈 광고 세트
    if (campaigns.length === 0) {
      return NextResponse.json({ adSets: [] })
    }

    const campaignIds = campaigns.map((c) => c.id)

    // 3. 벌크 조회: 계정 레벨 광고세트 (N회 → 1회)
    let allAdSets
    try {
      allAdSets = await metaAdsClient.listAllAdSets(decryptedToken, metaAccount.metaAccountId, {
        campaignIds,
      })
    } catch (error) {
      if (error instanceof MetaAdsApiError) {
        if (MetaAdsApiError.isAuthError(error)) {
          throw error
        }
        if (MetaAdsApiError.isRateLimitError(error)) {
          return NextResponse.json({ adSets: [], _rateLimited: true })
        }
      }
      throw error
    }

    // 4. 빈 광고 세트 → early return
    if (allAdSets.length === 0) {
      return NextResponse.json({ adSets: [] })
    }

    // 5. 벌크 조회: 계정 레벨 인사이트 (N회 → 1회)
    let insightsMap: Map<string, { impressions: number; clicks: number; spend: number; conversions: number; revenue: number }>
    try {
      insightsMap = await metaAdsClient.getAccountInsights(decryptedToken, metaAccount.metaAccountId, {
        level: 'adset',
        datePreset,
        campaignIds,
      })
    } catch (error) {
      if (error instanceof MetaAdsApiError) {
        if (MetaAdsApiError.isAuthError(error)) {
          throw error
        }
        if (MetaAdsApiError.isRateLimitError(error)) {
          insightsMap = new Map()
        } else {
          throw error
        }
      } else {
        throw error
      }
    }

    // 6. ID 기반 매핑으로 조합
    const adSetsWithInsights = allAdSets.map((adSet) => {
      const insights = insightsMap.get(adSet.id)
      return {
        id: adSet.id,
        name: adSet.name,
        status: adSet.status,
        dailyBudget: adSet.dailyBudget,
        insights: insights
          ? {
              impressions: insights.impressions,
              clicks: insights.clicks,
              spend: insights.spend,
              conversions: insights.conversions,
              revenue: insights.revenue,
            }
          : { ...EMPTY_INSIGHTS },
      }
    })

    return NextResponse.json({ adSets: adSetsWithInsights })
  } catch (error: unknown) {
    // Auth 에러가 최외부까지 전파된 경우
    if (error instanceof MetaAdsApiError && MetaAdsApiError.isAuthError(error)) {
      console.warn(`${LOG_PREFIX} Auth error propagated`, error.message)
      return NextResponse.json(
        {
          error: 'Meta access token expired or revoked. Please reconnect your account.',
          adSets: [],
        },
        { status: 401 }
      )
    }

    console.error(LOG_PREFIX, error)
    return NextResponse.json({ adSets: [], error: 'Internal server error' }, { status: 500 })
  }
}
