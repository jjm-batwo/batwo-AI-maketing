/**
 * 경쟁사 추적 관리 API
 *
 * GET /api/ai/competitors/tracking — 추적 중인 경쟁사 목록
 * DELETE /api/ai/competitors/tracking — 특정 경쟁사 추적 해제
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getGetTrackedCompetitorsUseCase, getUntrackCompetitorUseCase } from '@/lib/di/container'

export async function GET() {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const useCase = getGetTrackedCompetitorsUseCase()
    const trackings = await useCase.execute({ userId: user.id })

    return NextResponse.json({
      success: true,
      data: trackings,
    })
  } catch (error) {
    console.error('[API] /api/ai/competitors/tracking GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { pageId } = body

    if (!pageId || typeof pageId !== 'string') {
      return NextResponse.json(
        { error: 'pageId는 필수입니다' },
        { status: 400 }
      )
    }

    const useCase = getUntrackCompetitorUseCase()
    await useCase.execute({ userId: user.id, pageId })

    return NextResponse.json({
      success: true,
      message: '경쟁사 추적이 해제되었습니다.',
    })
  } catch (error) {
    console.error('[API] /api/ai/competitors/tracking DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
