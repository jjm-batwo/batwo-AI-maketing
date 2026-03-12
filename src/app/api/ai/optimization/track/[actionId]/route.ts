import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth'
import { container } from '@/lib/di/container'
import { DI_TOKENS } from '@/lib/di/types'
import { OptimizationTrackerService } from '@/application/services/OptimizationTrackerService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ actionId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { actionId } = await params

    // We register the Tracker Service in DI container in the next step
    const trackerService = container.resolve<OptimizationTrackerService>(
      DI_TOKENS.OptimizationTrackerService
    )

    const result = await trackerService.getOptimizationResult(actionId)

    if (!result) {
      return NextResponse.json({ error: '최적화 결과를 찾을 수 없습니다' }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: '알 수 없는 오류가 발생했습니다.' }, { status: 500 })
  }
}
