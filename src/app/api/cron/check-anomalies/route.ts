import { NextRequest, NextResponse } from 'next/server'
import {
  getKPIRepository,
  getCampaignRepository,
  getEmailService,
  getUserRepository,
} from '@/lib/di/container'
import { AnomalyDetectionService } from '@application/services/AnomalyDetectionService'
import { AnomalyAlertService } from '@application/services/AnomalyAlertService'
import { validateCronAuth } from '@/lib/middleware/cronAuth'

/**
 * GET /api/cron/check-anomalies
 *
 * Vercel Cron Job - Run anomaly detection daily and send alerts
 *
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-anomalies",
 *     "schedule": "0 1 * * *"  // Every day at 01:00 UTC (10:00 KST)
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authResult = validateCronAuth(request)
    if (!authResult.authorized) {
      return authResult.response
    }

    console.log('[Anomaly Cron] Starting anomaly detection for all users...')

    // Get all users with active campaigns using repository
    const userRepository = getUserRepository()
    const usersWithCampaigns = await userRepository.findUsersWithActiveCampaigns()

    if (usersWithCampaigns.length === 0) {
      console.log('[Anomaly Cron] No users with active campaigns found')
      return NextResponse.json({
        success: true,
        message: 'No users with active campaigns found',
        processed: 0,
      })
    }

    console.log(
      `[Anomaly Cron] Found ${usersWithCampaigns.length} users with campaigns`
    )

    // Initialize services
    const anomalyDetectionService = new AnomalyDetectionService(
      getKPIRepository(),
      getCampaignRepository()
    )

    const anomalyAlertService = new AnomalyAlertService(getEmailService(), {
      minimumSeverity: 'warning', // Only warning and critical
      maxAlertsPerCampaignPerDay: 3, // Lower limit for cron
      enableEmailAlerts: true,
    })

    // Process each user
    const results = {
      usersProcessed: 0,
      totalAnomaliesDetected: 0,
      totalAlertsSent: 0,
      errors: [] as string[],
    }

    for (const user of usersWithCampaigns) {
      try {
        console.log(`[Anomaly Cron] Processing user ${user.id} (${user.email})`)

        // Detect anomalies
        const anomalies = await anomalyDetectionService.detectAnomalies(user.id)

        console.log(
          `[Anomaly Cron] Detected ${anomalies.length} anomalies for user ${user.id}`
        )

        if (anomalies.length > 0) {
          results.totalAnomaliesDetected += anomalies.length

          // Send alerts
          const alertResult = await anomalyAlertService.sendAlerts({
            userId: user.id,
            userEmail: user.email,
            userName: user.name || undefined,
            anomalies,
          })

          console.log(
            `[Anomaly Cron] Sent ${alertResult.sent.length} alerts to user ${user.id}`
          )

          results.totalAlertsSent += alertResult.sent.length

          if (alertResult.errors.length > 0) {
            results.errors.push(...alertResult.errors)
          }
        }

        results.usersProcessed++
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown error'
        console.error(
          `[Anomaly Cron] Failed to process user ${user.id}:`,
          message
        )
        results.errors.push(`User ${user.id}: ${message}`)
      }
    }

    console.log('[Anomaly Cron] Completed:', results)

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error) {
    console.error('[Anomaly Cron] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Vercel Cron configuration
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout
