import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { oauthCache } from '@/lib/cache/oauthCache'
import { encryptToken } from '@application/utils/TokenEncryption'

/**
 * POST /api/meta/select-account
 * 사용자가 선택한 Meta 광고 계정을 저장
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const body = await request.json()
    const { sessionId, accountId } = body

    if (!sessionId || !accountId) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다' },
        { status: 400 }
      )
    }

    // 캐시에서 OAuth 데이터 조회 (DB 기반)
    const oauthData = await oauthCache.get(sessionId, user.id)

    if (!oauthData) {
      return NextResponse.json(
        { error: '세션이 만료되었습니다. 다시 연결해주세요.' },
        { status: 401 }
      )
    }

    // 선택한 계정이 유효한지 확인
    const selectedAccount = oauthData.accounts.find((acc) => acc.id === accountId)

    if (!selectedAccount) {
      return NextResponse.json(
        { error: '유효하지 않은 계정입니다' },
        { status: 400 }
      )
    }

    // DB에 저장 (기존 계정이 있으면 업데이트)
    let dbSuccess = false
    try {
      const existingAccount = await prisma.metaAdAccount.findFirst({
        where: {
          userId: user.id,
          metaAccountId: selectedAccount.id,
        },
      })

      const encryptedToken = encryptToken(oauthData.accessToken)

      if (existingAccount) {
        // Update existing account
        await prisma.metaAdAccount.update({
          where: { id: existingAccount.id },
          data: {
            accessToken: encryptedToken,
            tokenExpiry: new Date(
              Date.now() + oauthData.tokenExpiry * 1000
            ),
          },
        })
      } else {
        // Create new account
        await prisma.metaAdAccount.create({
          data: {
            userId: user.id,
            metaAccountId: selectedAccount.id,
            businessName: selectedAccount.name,
            accessToken: encryptedToken,
            tokenExpiry: new Date(
              Date.now() + oauthData.tokenExpiry * 1000
            ),
          },
        })
      }
      dbSuccess = true
    } catch (dbError) {
      console.error('Failed to store Meta account in database:', dbError)
    }

    // 캐시에서 OAuth 데이터 삭제 (보안)
    await oauthCache.delete(sessionId)

    if (!dbSuccess) {
      return NextResponse.json(
        { error: '데이터베이스 저장에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      account: {
        id: selectedAccount.id,
        name: selectedAccount.name,
      },
    })
  } catch (error) {
    console.error('Select account error:', error)
    return NextResponse.json(
      { error: '계정 선택 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
