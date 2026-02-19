/**
 * RefreshMetaTokenUseCase
 *
 * Meta long-lived token(60일) 자동 갱신 유스케이스.
 * 만료 7일 이내 토큰을 가진 MetaAdAccount를 조회하여 갱신 처리.
 *
 * Meta Graph API: /oauth/access_token (grant_type=fb_exchange_token)
 */

import { prisma } from '@/lib/prisma'
import { safeDecryptToken, encryptToken } from '@application/utils/TokenEncryption'

const META_API_VERSION = 'v25.0'
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`

/** 갱신 대상 기준: 만료까지 남은 일수 */
const REFRESH_THRESHOLD_DAYS = 7

interface TokenRefreshResult {
  refreshed: number
  skipped: number
  failed: number
  errors: string[]
}

interface MetaTokenResponse {
  access_token?: string
  token_type?: string
  expires_in?: number
  error?: {
    message: string
    type: string
    code: number
  }
}

export class RefreshMetaTokenUseCase {
  async execute(): Promise<TokenRefreshResult> {
    const result: TokenRefreshResult = {
      refreshed: 0,
      skipped: 0,
      failed: 0,
      errors: [],
    }

    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    if (!appId || !appSecret) {
      throw new Error('META_APP_ID 또는 META_APP_SECRET이 설정되지 않았습니다')
    }

    // 만료 7일 이내 계정 조회
    const thresholdDate = new Date(Date.now() + REFRESH_THRESHOLD_DAYS * 24 * 60 * 60 * 1000)

    const accounts = await prisma.metaAdAccount.findMany({
      where: {
        tokenExpiry: {
          lte: thresholdDate,
        },
      },
      select: {
        id: true,
        userId: true,
        accessToken: true,
        tokenExpiry: true,
        metaAccountId: true,
      },
    })

    if (accounts.length === 0) {
      return result
    }

    for (const account of accounts) {
      // tokenExpiry가 null이면 스킵 (토큰 만료 정보 없음)
      if (!account.tokenExpiry) {
        result.skipped++
        continue
      }

      try {
        const newToken = await this.exchangeToken(safeDecryptToken(account.accessToken), appId, appSecret)

        // DB 업데이트 (새 토큰 암호화 저장)
        const tokenExpiry = new Date(Date.now() + newToken.expires_in * 1000)
        await prisma.metaAdAccount.update({
          where: { id: account.id },
          data: {
            accessToken: encryptToken(newToken.access_token),
            tokenExpiry,
          },
        })

        console.log(
          `[RefreshMetaToken] 사용자 ${account.userId} 토큰 갱신 완료. 새 만료일: ${tokenExpiry.toISOString()}`
        )
        result.refreshed++
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error(`[RefreshMetaToken] 사용자 ${account.userId} 토큰 갱신 실패:`, message)
        result.errors.push(`User ${account.userId}: ${message}`)
        result.failed++
      }
    }

    return result
  }

  private async exchangeToken(
    currentToken: string,
    appId: string,
    appSecret: string
  ): Promise<{ access_token: string; expires_in: number }> {
    const url = new URL(`${META_GRAPH_URL}/oauth/access_token`)
    url.searchParams.set('grant_type', 'fb_exchange_token')
    url.searchParams.set('client_id', appId)
    url.searchParams.set('client_secret', appSecret)
    url.searchParams.set('fb_exchange_token', currentToken)

    const response = await fetch(url.toString())
    const data: MetaTokenResponse = await response.json()

    if (data.error) {
      throw new Error(`Meta API 오류: ${data.error.message} (code: ${data.error.code})`)
    }

    if (!data.access_token) {
      throw new Error('Meta API 응답에 access_token이 없습니다')
    }

    return {
      access_token: data.access_token,
      expires_in: data.expires_in ?? 60 * 24 * 60 * 60, // 기본값 60일
    }
  }
}
