import { NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { GetTrackingHealthUseCase } from '@application/use-cases/pixel/GetTrackingHealthUseCase'

/**
 * GET /api/pixel/[pixelId]/health
 *
 * 픽셀 하이브리드 트래킹 건강 상태 조회 API
 * - matchRate(EMQ 근사치) 조회
 * - CAPI 배치 전송 통계
 * - 건강 상태 판정 (healthy / warning / critical / unknown)
 * - 개선 제안 목록
 */
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ pixelId: string }> }
) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { pixelId } = await params

        if (!pixelId) {
            return NextResponse.json({ error: 'Pixel ID is required' }, { status: 400 })
        }

        const useCase = container.resolve<GetTrackingHealthUseCase>(
            DI_TOKENS.GetTrackingHealthUseCase
        )

        const result = await useCase.execute({
            userId: session.user.id,
            pixelId,
        })

        return NextResponse.json(result)
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })
        }

        console.error('[PixelHealth API] Error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export const dynamic = 'force-dynamic'
