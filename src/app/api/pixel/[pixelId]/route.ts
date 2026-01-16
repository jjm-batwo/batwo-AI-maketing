import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { prisma } from '@/lib/prisma'

interface RouteContext {
  params: Promise<{ pixelId: string }>
}

// GET /api/pixel/[pixelId] - Get pixel details
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
    })

    if (!pixel) {
      return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: pixel.id,
      userId: pixel.userId,
      metaPixelId: pixel.metaPixelId,
      name: pixel.name,
      isActive: pixel.isActive,
      setupMethod: pixel.setupMethod,
      createdAt: pixel.createdAt.toISOString(),
      updatedAt: pixel.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error('Error fetching pixel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/pixel/[pixelId] - Delete pixel
export async function DELETE(request: NextRequest, context: RouteContext) {
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
    })

    if (!pixel) {
      return NextResponse.json({ error: 'Pixel not found' }, { status: 404 })
    }

    // Delete related records first (cascade should handle this, but being explicit)
    await prisma.conversionEvent.deleteMany({
      where: { pixelId },
    })

    await prisma.platformIntegration.deleteMany({
      where: { pixelId },
    })

    // Delete the pixel
    await prisma.metaPixel.delete({
      where: { id: pixelId },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting pixel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
