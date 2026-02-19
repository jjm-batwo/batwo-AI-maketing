import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { oauthCache } from '@/lib/cache/oauthCache'
import { encryptToken } from '@application/utils/TokenEncryption'

const META_API_URL = 'https://graph.facebook.com/v25.0'

interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface MetaAdAccount {
  id: string
  name: string
  account_status: number
  currency: string
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth error
  if (error) {
    console.error('Meta OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL('/settings/meta-connect?error=' + encodeURIComponent(errorDescription || error), request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/settings/meta-connect?error=인증 코드가 없습니다', request.url)
    )
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`${META_API_URL}/oauth/access_token`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }).then(async () => {
      // Using the code to get long-lived access token
      const params = new URLSearchParams({
        client_id: process.env.META_APP_ID || '',
        client_secret: process.env.META_APP_SECRET || '',
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/meta/callback`,
      })

      const res = await fetch(
        `${META_API_URL}/oauth/access_token?${params.toString()}`
      )
      return res.json() as Promise<MetaTokenResponse>
    })

    if (!tokenResponse.access_token) {
      throw new Error('Failed to get access token')
    }

    // Get long-lived access token
    const longLivedTokenParams = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_APP_ID || '',
      client_secret: process.env.META_APP_SECRET || '',
      fb_exchange_token: tokenResponse.access_token,
    })

    const longLivedTokenResponse = await fetch(
      `${META_API_URL}/oauth/access_token?${longLivedTokenParams.toString()}`
    ).then((res) => res.json() as Promise<MetaTokenResponse>)

    // Get user's ad accounts
    const adAccountsResponse = await fetch(
      `${META_API_URL}/me/adaccounts?fields=id,name,account_status,currency&access_token=${longLivedTokenResponse.access_token}`
    ).then((res) => res.json() as Promise<{ data: MetaAdAccount[] }>)

    const accounts = adAccountsResponse.data || []

    // Development logging only (no sensitive data)
    if (process.env.NODE_ENV === 'development') {
      console.log('[META CALLBACK] OAuth successful:', {
        hasToken: !!longLivedTokenResponse.access_token,
        tokenLength: longLivedTokenResponse.access_token?.length,
        expiresIn: longLivedTokenResponse.expires_in,
        accountCount: accounts.length,
      })
    }

    // 계정이 없는 경우
    if (accounts.length === 0) {
      return NextResponse.redirect(
        new URL('/settings/meta-connect?error=광고 계정이 없습니다', request.url)
      )
    }

    // 계정이 1개인 경우: 기존 로직대로 자동 선택
    if (accounts.length === 1) {
      const primaryAdAccount = accounts[0]
      let dbSuccess = false
      // expires_in이 없는 경우 기본값 60일(5184000초) 사용
      const singleAccountTokenExpiry = longLivedTokenResponse.expires_in || 5184000

      try {
        // Check if account already exists
        const existingAccount = await prisma.metaAdAccount.findFirst({
          where: {
            userId: user.id,
            metaAccountId: primaryAdAccount.id,
          },
        })

        const encryptedToken = encryptToken(longLivedTokenResponse.access_token)

        if (existingAccount) {
          // Update existing account
          await prisma.metaAdAccount.update({
            where: { id: existingAccount.id },
            data: {
              accessToken: encryptedToken,
              tokenExpiry: new Date(
                Date.now() + singleAccountTokenExpiry * 1000
              ),
            },
          })
        } else {
          // Create new account
          await prisma.metaAdAccount.create({
            data: {
              userId: user.id,
              metaAccountId: primaryAdAccount.id,
              businessName: primaryAdAccount.name,
              accessToken: encryptedToken,
              tokenExpiry: new Date(
                Date.now() + singleAccountTokenExpiry * 1000
              ),
            },
          })
        }
        dbSuccess = true
      } catch (dbError) {
        console.error('Failed to store Meta account in database:', dbError)
        // Continue without database - OAuth still succeeded
      }

      const successUrl = new URL('/settings/meta-connect', request.url)
      successUrl.searchParams.set('success', 'true')
      if (!dbSuccess) {
        successUrl.searchParams.set('warning', 'db_unavailable')
      }
      successUrl.searchParams.set('account', primaryAdAccount.name)
      return NextResponse.redirect(successUrl)
    }

    // 계정이 여러 개인 경우: 선택 페이지로 리다이렉트
    // accessToken을 임시 캐시에 저장 (10분 TTL, DB 기반)
    // expires_in이 없는 경우 기본값 60일(5184000초) 사용
    const tokenExpirySeconds = longLivedTokenResponse.expires_in || 5184000

    if (process.env.NODE_ENV === 'development') {
      console.log('[META CALLBACK] Saving to OAuth cache:', {
        userId: user.id.substring(0, 10) + '...',
        tokenExpirySeconds,
        accountCount: accounts.length,
      })
    }

    let sessionId: string
    try {
      sessionId = await oauthCache.set(user.id, {
        accessToken: longLivedTokenResponse.access_token,
        tokenExpiry: tokenExpirySeconds,
        accounts: accounts,
      })
    } catch (cacheError) {
      console.error('[META CALLBACK] OAuth cache set failed:', cacheError)
      throw new Error(`OAuth 세션 저장 실패: ${cacheError instanceof Error ? cacheError.message : 'Unknown'}`)
    }

    const selectUrl = new URL('/settings/meta-connect', request.url)
    selectUrl.searchParams.set('mode', 'select')
    selectUrl.searchParams.set('session', sessionId)
    selectUrl.searchParams.set('count', accounts.length.toString())
    return NextResponse.redirect(selectUrl)
  } catch (error) {
    // 상세 에러 로깅
    console.error('Meta OAuth callback error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })

    // 에러 메시지를 URL에 포함 (디버깅용)
    const errorMessage = error instanceof Error
      ? encodeURIComponent(error.message)
      : encodeURIComponent('연결 중 오류가 발생했습니다')

    return NextResponse.redirect(
      new URL(`/settings/meta-connect?error=${errorMessage}`, request.url)
    )
  }
}
