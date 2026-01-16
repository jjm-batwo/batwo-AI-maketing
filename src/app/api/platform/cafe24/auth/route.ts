import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { Cafe24Adapter } from '@infrastructure/external/platforms/cafe24/Cafe24Adapter'
import crypto from 'crypto'

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID || ''
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET || ''
const CAFE24_REDIRECT_URI = process.env.CAFE24_REDIRECT_URI || ''

/**
 * GET /api/platform/cafe24/auth
 * 카페24 OAuth 인증 URL 생성
 */
export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const pixelId = searchParams.get('pixelId')

  if (!pixelId) {
    return NextResponse.json(
      { error: '픽셀 ID가 필요합니다' },
      { status: 400 }
    )
  }

  if (!CAFE24_CLIENT_ID || !CAFE24_CLIENT_SECRET) {
    return NextResponse.json(
      { error: '카페24 API 설정이 되어있지 않습니다' },
      { status: 500 }
    )
  }

  try {
    const adapter = new Cafe24Adapter(CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET)

    // State includes userId and pixelId for callback verification
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        pixelId,
        nonce: crypto.randomBytes(16).toString('hex'),
      })
    ).toString('base64url')

    const redirectUri = CAFE24_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/platform/cafe24/callback`
    const authUrl = adapter.getAuthUrl(redirectUri, state)

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('Cafe24 auth URL generation error:', error)
    return NextResponse.json(
      { error: '인증 URL 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
