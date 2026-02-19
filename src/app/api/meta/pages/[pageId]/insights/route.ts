import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MetaPagesClient } from '@/infrastructure/external/meta-pages'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

/**
 * GET /api/meta/pages/[pageId]/insights
 * 페이지 참여 데이터 조회
 * 권한: pages_read_engagement
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ pageId: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { pageId } = await context.params

  try {
    // 사용자의 Meta 토큰 조회
    const metaAccount = await prisma.metaAdAccount.findFirst({
      where: { userId: user.id },
      select: { accessToken: true }
    })

    if (!metaAccount?.accessToken) {
      return NextResponse.json(
        { message: 'Meta 계정이 연결되어 있지 않습니다' },
        { status: 400 }
      )
    }

    const client = new MetaPagesClient(safeDecryptToken(metaAccount.accessToken))

    // 페이지 정보 조회하여 page access token 획득
    const page = await client.getPage(pageId)

    if (!page.access_token) {
      return NextResponse.json(
        { message: '페이지 액세스 토큰을 가져올 수 없습니다' },
        { status: 400 }
      )
    }

    // 참여 데이터 조회
    const [engagement, posts] = await Promise.all([
      client.getEngagementSummary(pageId, page.access_token),
      client.getPagePosts(pageId, page.access_token, 5)
    ])

    return NextResponse.json({
      page: {
        id: page.id,
        name: page.name,
        category: page.category,
        fanCount: page.fan_count,
        followersCount: page.followers_count,
        picture: page.picture?.data?.url
      },
      engagement,
      recentPosts: posts.map(post => ({
        id: post.id,
        message: post.message?.substring(0, 100) || '(이미지 게시물)',
        createdTime: post.created_time,
        likes: post.likes?.summary?.total_count || 0,
        comments: post.comments?.summary?.total_count || 0,
        shares: post.shares?.count || 0
      }))
    })
  } catch (error) {
    console.error('Failed to fetch page insights:', error)
    return NextResponse.json(
      { message: 'Failed to fetch page insights' },
      { status: 500 }
    )
  }
}
