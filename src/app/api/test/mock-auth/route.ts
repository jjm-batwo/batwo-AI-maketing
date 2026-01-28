import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { encode } from 'next-auth/jwt'

/**
 * Mock Authentication API for E2E Tests
 *
 * Playwright 테스트를 위한 Mock 인증 세션 생성
 * - 프로덕션에서는 비활성화됨
 * - 테스트 환경에서만 사용
 */
export async function GET() {
  // 프로덕션 환경에서는 차단
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_API) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Mock 사용자 세션 데이터
    const mockSession = {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      provider: 'credentials',
      globalRole: 'USER',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7일
    }

    // NextAuth 세션 쿠키 설정
    const cookieStore = await cookies()
    const secureCookie = process.env.NODE_ENV === 'production'
    const cookieName = secureCookie
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'

    // NextAuth JWT 토큰 생성
    const secret = process.env.AUTH_SECRET || 'test-secret-key'
    const token = await encode({
      token: mockSession,
      secret,
      salt: cookieName,
      maxAge: 60 * 60 * 24 * 7,
    })

    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: secureCookie,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      success: true,
      message: 'Mock session created',
      user: {
        email: mockSession.email,
        name: mockSession.name,
      },
    })
  } catch (error) {
    console.error('[Mock Auth] Error creating mock session:', error)
    return NextResponse.json(
      { error: 'Failed to create mock session' },
      { status: 500 }
    )
  }
}

/**
 * Mock 세션 삭제 (로그아웃)
 */
export async function DELETE() {
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_TEST_API) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    const cookieStore = await cookies()
    const secureCookie = process.env.NODE_ENV === 'production'
    const cookieName = secureCookie
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'

    cookieStore.delete(cookieName)

    return NextResponse.json({
      success: true,
      message: 'Mock session deleted',
    })
  } catch (error) {
    console.error('[Mock Auth] Error deleting mock session:', error)
    return NextResponse.json(
      { error: 'Failed to delete mock session' },
      { status: 500 }
    )
  }
}
