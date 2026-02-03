import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { encode } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { GlobalRole } from '@domain/value-objects/GlobalRole'

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
    // 1. 데이터베이스에 테스트 사용자 생성 또는 조회
    const testEmail = 'test@example.com'
    let user = await prisma.user.findUnique({
      where: { email: testEmail },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: testEmail,
          name: 'Test User',
          globalRole: GlobalRole.USER,
        },
      })
    }

    // Mock 사용자 세션 데이터 - NextAuth JWT 구조와 일치해야 함
    // NextAuth JWT는 sub, id, email, name, picture, globalRole, provider 필드를 사용
    const mockSession = {
      sub: user.id, // NextAuth는 sub 필드를 사용자 ID로 사용
      id: user.id,
      email: user.email,
      name: user.name,
      picture: null,
      provider: 'credentials',
      globalRole: user.globalRole,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7일
      jti: crypto.randomUUID(), // JWT ID - NextAuth에서 사용
    }

    // NextAuth 세션 쿠키 설정
    const cookieStore = await cookies()
    const secureCookie = process.env.NODE_ENV === 'production'
    const cookieName = secureCookie
      ? '__Secure-authjs.session-token'
      : 'authjs.session-token'

    // NextAuth JWT 토큰 생성 - NextAuth와 동일한 시크릿 사용
    // NextAuth는 AUTH_SECRET을 우선 사용하고, 없으면 NEXTAUTH_SECRET 사용
    const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'test-secret-key'
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
      // Playwright E2E 테스트를 위한 토큰 및 쿠키 정보 반환
      token,
      cookieName,
      cookieOptions: {
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'Lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
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
