/**
 * DEV ONLY: 현재 로그인된 사용자에게 Meta 광고 계정을 자동 연결합니다.
 * .env의 META_ACCESS_TOKEN과 META_AD_ACCOUNT_ID를 사용합니다.
 *
 * 프로덕션에서는 접근 불가합니다.
 *
 * POST /api/dev/connect-meta
 */
import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encryptToken } from '@application/utils/TokenEncryption'

export async function POST() {
  // 프로덕션에서는 절대 사용 불가
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const accessToken = process.env.META_ACCESS_TOKEN
  const adAccountId = process.env.META_AD_ACCOUNT_ID

  if (!accessToken || !adAccountId) {
    return NextResponse.json(
      {
        error: 'META_ACCESS_TOKEN 또는 META_AD_ACCOUNT_ID가 .env에 설정되지 않았습니다.',
        hint: '.env 파일에 META_ACCESS_TOKEN과 META_AD_ACCOUNT_ID를 설정하세요.',
      },
      { status: 500 }
    )
  }

  try {
    // 기존 연결이 있으면 업데이트, 없으면 생성
    const metaAccount = await prisma.metaAdAccount.upsert({
      where: { userId: user.id },
      update: {
        accessToken: encryptToken(accessToken),
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60일 후 만료
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        metaAccountId: adAccountId,
        accessToken: encryptToken(accessToken),
        tokenExpiry: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60일 후 만료
        businessName: '개발 테스트 계정',
        currency: 'KRW',
        timezone: 'Asia/Seoul',
      },
    })

    console.log(`[DEV] Meta account connected for user ${user.id} (${user.email})`)

    return NextResponse.json({
      success: true,
      message: `Meta 광고 계정이 성공적으로 연결되었습니다.`,
      account: {
        id: metaAccount.id,
        metaAccountId: metaAccount.metaAccountId,
        businessName: metaAccount.businessName,
        userId: user.id,
        userEmail: user.email,
      },
    })
  } catch (error) {
    console.error('[DEV] Failed to connect Meta account:', error)
    return NextResponse.json(
      { error: 'Meta 계정 연결 실패', details: String(error) },
      { status: 500 }
    )
  }
}

export async function GET() {
  // 프로덕션에서는 절대 사용 불가
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode' },
      { status: 403 }
    )
  }

  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  // 현재 사용자의 Meta 계정 연결 상태를 확인
  const metaAccount = await prisma.metaAdAccount.findUnique({
    where: { userId: user.id },
    select: {
      id: true,
      metaAccountId: true,
      businessName: true,
      tokenExpiry: true,
      createdAt: true,
    },
  })

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    metaAccount: metaAccount || null,
    isConnected: !!metaAccount,
    envConfigured: !!(process.env.META_ACCESS_TOKEN && process.env.META_AD_ACCOUNT_ID),
  })
}
