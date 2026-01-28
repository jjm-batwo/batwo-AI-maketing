import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth'
import { prisma } from '@/lib/prisma'
import {
  getKPIRepository,
  getCampaignRepository,
  getEmailService,
} from '@/lib/di/container'
import { AnomalyDetectionService } from '@application/services/AnomalyDetectionService'
import { AnomalyAlertService } from '@application/services/AnomalyAlertService'

/**
 * GET /api/alerts/anomaly
 *
 * Detect anomalies for user's campaigns and return results
 * (Does not send alerts, just returns detected anomalies)
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user for industry context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Initialize services
    const anomalyDetectionService = new AnomalyDetectionService(
      getKPIRepository(),
      getCampaignRepository()
    )

    // Detect anomalies
    const anomalies = await anomalyDetectionService.detectAnomalies(userId)

    return NextResponse.json({
      success: true,
      anomalies,
      count: anomalies.length,
      detectedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Anomaly detection failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/alerts/anomaly
 *
 * Trigger anomaly detection and send alerts for critical anomalies
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        name: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      )
    }

    // Parse request body for custom config
    const body = await request.json().catch(() => ({}))
    const {
      minimumSeverity = 'warning',
      sendEmail = true,
    } = body

    // Initialize services
    const anomalyDetectionService = new AnomalyDetectionService(
      getKPIRepository(),
      getCampaignRepository()
    )

    const anomalyAlertService = new AnomalyAlertService(getEmailService(), {
      minimumSeverity,
      enableEmailAlerts: sendEmail,
    })

    // Detect anomalies
    const anomalies = await anomalyDetectionService.detectAnomalies(userId)

    // Send alerts
    const alertResult = await anomalyAlertService.sendAlerts({
      userId,
      userEmail: user.email,
      userName: user.name || undefined,
      anomalies,
    })

    return NextResponse.json({
      success: true,
      detected: {
        total: anomalies.length,
        critical: anomalies.filter((a) => a.severity === 'critical').length,
        warning: anomalies.filter((a) => a.severity === 'warning').length,
        info: anomalies.filter((a) => a.severity === 'info').length,
      },
      alerts: {
        sent: alertResult.sent.length,
        skipped: alertResult.skipped.length,
        errors: alertResult.errors,
      },
      detectedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Anomaly alert failed:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
