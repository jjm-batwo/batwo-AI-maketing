import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ pixelId: string }>
}

// Operational status enum
enum PixelOperationalStatus {
  PENDING = 'PENDING',
  AWAITING_PLATFORM_CONNECT = 'AWAITING_PLATFORM_CONNECT',
  PLATFORM_CONNECTED = 'PLATFORM_CONNECTED',
  RECEIVING_EVENTS = 'RECEIVING_EVENTS',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR',
}

// GET /api/pixel/[pixelId]/status - Get pixel operational status
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { pixelId } = await context.params

    const pixel = await prisma.metaPixel.findFirst({
      where: {
        id: pixelId,
        userId: session.user.id,
      },
      include: {
        platformIntegration: true,
      },
    })

    if (!pixel) {
      return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })
    }

    // Get event statistics
    const eventCount = await prisma.conversionEvent.count({
      where: { pixelId },
    })

    const lastEvent = await prisma.conversionEvent.findFirst({
      where: { pixelId },
      orderBy: { eventTime: 'desc' },
    })

    const hasReceivedEvents = eventCount > 0

    // Determine operational status
    let operationalStatus: PixelOperationalStatus
    let errorMessage: string | undefined
    let platformStatus: string | undefined
    let lastSyncAt: string | undefined

    if (pixel.setupMethod === 'MANUAL') {
      operationalStatus = hasReceivedEvents
        ? PixelOperationalStatus.RECEIVING_EVENTS
        : PixelOperationalStatus.PENDING
    } else {
      // PLATFORM_API setup method
      const integration = pixel.platformIntegration

      if (!integration) {
        operationalStatus = PixelOperationalStatus.AWAITING_PLATFORM_CONNECT
      } else {
        platformStatus = integration.status
        lastSyncAt = integration.lastSyncAt?.toISOString()

        switch (integration.status) {
          case 'CONNECTED':
          case 'SCRIPT_INJECTED':
            operationalStatus = PixelOperationalStatus.PLATFORM_CONNECTED
            break
          case 'ACTIVE':
            operationalStatus = PixelOperationalStatus.ACTIVE
            break
          case 'ERROR':
          case 'DISCONNECTED':
            operationalStatus = PixelOperationalStatus.ERROR
            errorMessage = integration.errorMessage || undefined
            break
          default:
            operationalStatus = PixelOperationalStatus.AWAITING_PLATFORM_CONNECT
        }
      }
    }

    return NextResponse.json({
      pixelId: pixel.id,
      metaPixelId: pixel.metaPixelId,
      name: pixel.name,
      isActive: pixel.isActive,
      setupMethod: pixel.setupMethod,
      operationalStatus,
      hasReceivedEvents,
      eventCount,
      lastEventAt: lastEvent?.eventTime?.toISOString() || null,
      errorMessage,
      platformStatus,
      lastSyncAt,
    })
  } catch (error) {
    console.error('Error fetching pixel status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
