import { NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { getAnomalyDetectionService } from '@/lib/di/container'

/**
 * GET /api/alerts
 * 사용자의 모든 활성 캠페인에 대한 이상 탐지 알림 조회
 */
export async function GET() {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const anomalyService = getAnomalyDetectionService()
    const anomalies = await anomalyService.detectAnomalies(user.id)

    return NextResponse.json({
      alerts: anomalies.map((anomaly) => ({
        id: anomaly.id,
        campaignId: anomaly.campaignId,
        campaignName: anomaly.campaignName,
        type: anomaly.type,
        severity: anomaly.severity,
        metric: anomaly.metric,
        currentValue: anomaly.currentValue,
        previousValue: anomaly.previousValue,
        changePercent: anomaly.changePercent,
        message: anomaly.message,
        detectedAt: anomaly.detectedAt.toISOString(),
      })),
      count: anomalies.length,
    })
  } catch (error) {
    console.error('Failed to detect anomalies:', error)
    return NextResponse.json(
      { message: '알림을 조회하는데 실패했습니다' },
      { status: 500 }
    )
  }
}
