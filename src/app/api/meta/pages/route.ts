import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MetaPagesClient } from '@/infrastructure/external/meta-pages'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

/**
 * GET /api/meta/pages
 * 사용자가 관리하는 Facebook 페이지 목록 조회
 * 권한: pages_show_list
 */
export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    // 사용자의 Meta 토큰 조회
    const metaAccount = await prisma.metaAdAccount.findFirst({
      where: { userId: user.id },
      select: { accessToken: true }
    })

    if (!metaAccount?.accessToken) {
      return NextResponse.json(
        { message: 'Meta 계정이 연결되어 있지 않습니다', pages: [] },
        { status: 200 }
      )
    }

    const client = new MetaPagesClient(safeDecryptToken(metaAccount.accessToken))
    const pages = await client.listPages()

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Failed to fetch Meta pages:', error)
    return NextResponse.json(
      { message: 'Failed to fetch Meta pages', pages: [] },
      { status: 500 }
    )
  }
}
