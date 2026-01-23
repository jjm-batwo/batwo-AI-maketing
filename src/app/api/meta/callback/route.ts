import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const META_API_URL = 'https://graph.facebook.com/v18.0'

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

    // Store the first ad account (for MVP)
    const primaryAdAccount = adAccountsResponse.data?.[0]

    // Try to store in database, but don't fail if database is unavailable
    let dbSuccess = false
    if (primaryAdAccount) {
      try {
        // Check if account already exists
        const existingAccount = await prisma.metaAdAccount.findFirst({
          where: {
            userId: user.id,
            metaAccountId: primaryAdAccount.id,
          },
        })

        if (existingAccount) {
          // Update existing account
          await prisma.metaAdAccount.update({
            where: { id: existingAccount.id },
            data: {
              accessToken: longLivedTokenResponse.access_token,
              tokenExpiry: new Date(
                Date.now() + longLivedTokenResponse.expires_in * 1000
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
              accessToken: longLivedTokenResponse.access_token,
              tokenExpiry: new Date(
                Date.now() + longLivedTokenResponse.expires_in * 1000
              ),
            },
          })
        }
        dbSuccess = true
      } catch (dbError) {
        console.error('Failed to store Meta account in database:', dbError)
        // Continue without database - OAuth still succeeded
      }
    }

    // Log the token for debugging (TEMPORARY - remove in production)
    console.log('[META CALLBACK] OAuth successful:', {
      hasToken: !!longLivedTokenResponse.access_token,
      tokenLength: longLivedTokenResponse.access_token?.length,
      expiresIn: longLivedTokenResponse.expires_in,
      adAccountId: primaryAdAccount?.id,
      adAccountName: primaryAdAccount?.name,
      dbSuccess,
    })

    // Return success even if database storage failed
    // The OAuth itself was successful
    const successUrl = new URL('/settings/meta-connect', request.url)
    successUrl.searchParams.set('success', 'true')
    if (!dbSuccess) {
      successUrl.searchParams.set('warning', 'db_unavailable')
    }
    if (primaryAdAccount) {
      successUrl.searchParams.set('account', primaryAdAccount.name)
    }
    return NextResponse.redirect(successUrl)
  } catch (error) {
    console.error('Meta OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/settings/meta-connect?error=연결 중 오류가 발생했습니다', request.url)
    )
  }
}
