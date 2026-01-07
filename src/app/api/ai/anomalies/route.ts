import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getAnomalyDetectionService } from '@/lib/di/container'

/**
 * GET /api/ai/anomalies
 * 사용자의 캠페인에서 발생한 이상 현상 조회
 */
export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const anomalyService = getAnomalyDetectionService()
    const anomalies = await anomalyService.detectAnomalies(user.id)

    return NextResponse.json({
      anomalies,
      detectedAt: new Date().toISOString(),
      count: anomalies.length,
      summary: {
        critical: anomalies.filter((a) => a.severity === 'critical').length,
        warning: anomalies.filter((a) => a.severity === 'warning').length,
        info: anomalies.filter((a) => a.severity === 'info').length,
      },
    })
  } catch (error) {
    console.error('Failed to detect anomalies:', error)
    return NextResponse.json(
      { message: '이상 탐지에 실패했습니다' },
      { status: 500 }
    )
  }
}
