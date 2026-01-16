import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TrackingScriptService } from '@infrastructure/external/tracking/TrackingScriptService'

interface RouteContext {
  params: Promise<{ pixelId: string }>
}

const trackingScriptService = new TrackingScriptService({
  appBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://batwo.ai',
})

// POST /api/pixel/[pixelId]/event - Receive client-side events for CAPI
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { pixelId } = await context.params

    // Validate pixelId format
    if (!pixelId || pixelId.length < 10) {
      return NextResponse.json({ error: 'Invalid pixel ID' }, { status: 400 })
    }

    // Find the pixel in database
    const pixel = await prisma.metaPixel.findUnique({
      where: { id: pixelId },
    })

    if (!pixel) {
      return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })
    }

    if (!pixel.isActive) {
      return NextResponse.json({ error: 'Pixel is inactive' }, { status: 400 })
    }

    // Parse the event payload
    let payload: string
    try {
      payload = await request.text()
    } catch {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Validate and parse the event
    let parsedEvent
    try {
      parsedEvent = trackingScriptService.parseEventPayload(payload)
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Invalid event payload' },
        { status: 400 }
      )
    }

    // Store the event in the database for later CAPI processing
    await prisma.conversionEvent.create({
      data: {
        pixelId: pixel.id,
        eventName: parsedEvent.eventName,
        eventId: parsedEvent.eventId,
        eventTime: parsedEvent.eventTime,
        eventSourceUrl: parsedEvent.eventSourceUrl,
        userData: parsedEvent.userData ? JSON.parse(JSON.stringify(parsedEvent.userData)) : undefined,
        customData: parsedEvent.customData ? JSON.parse(JSON.stringify(parsedEvent.customData)) : undefined,
        sentToMeta: false,
      },
    })

    // Return 204 No Content for successful beacon requests
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error processing event:', error)

    // For Prisma unique constraint violations (duplicate eventId)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      // Duplicate event is OK - just ignore
      return new NextResponse(null, { status: 204 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Allow GET for debugging purposes (returns supported events)
export async function GET() {
  const supportedEvents = trackingScriptService.getSupportedEvents()
  return NextResponse.json({
    supportedEvents,
    message: 'POST events to this endpoint',
  })
}
