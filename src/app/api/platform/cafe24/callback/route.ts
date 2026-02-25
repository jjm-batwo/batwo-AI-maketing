import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Cafe24Adapter } from '@infrastructure/external/platforms/cafe24/Cafe24Adapter'
import { EcommercePlatform, IntegrationStatus } from '@domain/entities/PlatformIntegration'
import { PixelSetupMethod } from '@domain/entities/MetaPixel'
import { encryptToken } from '@application/utils/TokenEncryption'

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID || ''
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET || ''
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI || ''

interface StatePayload {
  userId: string
  pixelId: string
  nonce: string
}

/**
 * GET /api/platform/cafe24/callback
 * 카페24 OAuth 콜백 처리
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // Handle OAuth error
  if (error) {
    console.error('Cafe24 OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/settings/pixel?error=${encodeURIComponent(errorDescription || error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings/pixel?error=인증 코드가 없습니다', request.url)
    )
  }

  // Decode and verify state
  let statePayload: StatePayload
  try {
    statePayload = JSON.parse(Buffer.from(state, 'base64url').toString())
  } catch {
    return NextResponse.redirect(
      new URL('/settings/pixel?error=잘못된 인증 상태입니다', request.url)
    )
  }

  // Verify user matches state
  if (user && user.id !== statePayload.userId) {
    return NextResponse.redirect(
      new URL('/settings/pixel?error=사용자 인증이 일치하지 않습니다', request.url)
    )
  }

  try {
    const adapter = new Cafe24Adapter(CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET)
    const redirectUri = CAFE24_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/platform/cafe24/callback`

    // Exchange code for tokens
    const tokens = await adapter.exchangeToken(code, redirectUri)

    // Get store information
    const storeInfo = await adapter.getStoreInfo(tokens.accessToken)

    // Check if pixel exists
    const pixel = await prisma.metaPixel.findUnique({
      where: { id: statePayload.pixelId },
      include: { platformIntegration: true },
    })

    if (!pixel) {
      return NextResponse.redirect(
        new URL('/settings/pixel?error=픽셀을 찾을 수 없습니다', request.url)
      )
    }

    // Calculate token expiry
    const tokenExpiry = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null

    // Create or update platform integration
    if (pixel.platformIntegration) {
      // Update existing integration
      await prisma.platformIntegration.update({
        where: { id: pixel.platformIntegration.id },
        data: {
          accessToken: encryptToken(tokens.accessToken),
          refreshToken: tokens.refreshToken,
          tokenExpiry,
          platformStoreId: storeInfo.storeId,
          status: IntegrationStatus.CONNECTED,
          errorMessage: null,
          lastSyncAt: new Date(),
        },
      })
    } else {
      // Create new integration
      await prisma.platformIntegration.create({
        data: {
          pixelId: pixel.id,
          platform: EcommercePlatform.CAFE24,
          platformStoreId: storeInfo.storeId,
          accessToken: encryptToken(tokens.accessToken),
          refreshToken: tokens.refreshToken,
          tokenExpiry,
          status: IntegrationStatus.CONNECTED,
        },
      })
    }

    // Update pixel setup method
    await prisma.metaPixel.update({
      where: { id: pixel.id },
      data: { setupMethod: PixelSetupMethod.PLATFORM_API },
    })

    return NextResponse.redirect(
      new URL(`/settings/pixel?success=cafe24&store=${encodeURIComponent(storeInfo.storeName)}`, request.url)
    )
  } catch (error) {
    console.error('Cafe24 OAuth callback error:', error)
    const errorMessage = error instanceof Error ? error.message : '연결 중 오류가 발생했습니다'
    return NextResponse.redirect(
      new URL(`/settings/pixel?error=${encodeURIComponent(errorMessage)}`, request.url)
    )
  }
}
