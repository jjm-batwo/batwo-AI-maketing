import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TrackingScriptService } from '@infrastructure/external/tracking/TrackingScriptService'

interface RouteContext {
  params: Promise<{ pixelId: string }>
}

const trackingScriptService = new TrackingScriptService({
  appBaseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://batwo.ai',
})

// GET /api/pixel/[pixelId]/tracker.js - Get dynamic tracking script
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { pixelId } = await context.params

    // Validate pixelId format (UUID)
    if (!pixelId || pixelId.length < 10) {
      return new NextResponse('// Invalid pixel ID', {
        status: 400,
        headers: { 'Content-Type': 'application/javascript' },
      })
    }

    // Find the pixel in database
    const pixel = await prisma.metaPixel.findUnique({
      where: { id: pixelId },
    })

    if (!pixel) {
      return new NextResponse('// Pixel not found', {
        status: 404,
        headers: { 'Content-Type': 'application/javascript' },
      })
    }

    if (!pixel.isActive) {
      return new NextResponse('// Pixel is inactive', {
        status: 200,
        headers: { 'Content-Type': 'application/javascript' },
      })
    }

    // Generate tracking script
    const script = trackingScriptService.generatePixelScript(pixel.metaPixelId)
    const cacheHeaders = trackingScriptService.getCacheHeaders()

    return new NextResponse(script, {
      status: 200,
      headers: cacheHeaders,
    })
  } catch (error) {
    console.error('Error generating tracker script:', error)
    return new NextResponse('// Error generating script', {
      status: 500,
      headers: { 'Content-Type': 'application/javascript' },
    })
  }
}
