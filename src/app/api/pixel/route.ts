import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { prisma } from '@/lib/prisma'
import { PixelSetupMethod } from '@domain/entities/MetaPixel'

// GET /api/pixel - List user's pixels
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const isActiveParam = searchParams.get('isActive')
    const setupMethod = searchParams.get('setupMethod') as PixelSetupMethod | null

    // Build where clause
    const where: Record<string, unknown> = {
      userId: session.user.id,
    }

    if (isActiveParam !== null) {
      where.isActive = isActiveParam === 'true'
    }

    if (setupMethod) {
      where.setupMethod = setupMethod
    }

    // Get total count
    const total = await prisma.metaPixel.count({ where })

    // Get paginated results
    const pixels = await prisma.metaPixel.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: pixels.map((pixel) => ({
        id: pixel.id,
        userId: pixel.userId,
        metaPixelId: pixel.metaPixelId,
        name: pixel.name,
        isActive: pixel.isActive,
        setupMethod: pixel.setupMethod,
        createdAt: pixel.createdAt.toISOString(),
        updatedAt: pixel.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages,
    })
  } catch (error) {
    console.error('Error fetching pixels:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/pixel - Create a new pixel
export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { metaPixelId, name, setupMethod } = body

    // Validate name
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Pixel name is required' }, { status: 400 })
    }

    // Validate Meta Pixel ID format
    const pixelIdRegex = /^\d{15,16}$/
    if (!pixelIdRegex.test(metaPixelId)) {
      return NextResponse.json(
        { error: 'Invalid Meta Pixel ID format. Must be a 15-16 digit numeric string.' },
        { status: 400 }
      )
    }

    // Check for duplicates
    const existingPixel = await prisma.metaPixel.findFirst({
      where: {
        userId: session.user.id,
        metaPixelId,
      },
    })

    if (existingPixel) {
      return NextResponse.json(
        { error: `Pixel with Meta Pixel ID ${metaPixelId} already exists` },
        { status: 409 }
      )
    }

    // Create pixel
    const pixel = await prisma.metaPixel.create({
      data: {
        userId: session.user.id,
        metaPixelId,
        name: name.trim(),
        isActive: true,
        setupMethod: setupMethod || 'MANUAL',
      },
    })

    return NextResponse.json(
      {
        id: pixel.id,
        userId: pixel.userId,
        metaPixelId: pixel.metaPixelId,
        name: pixel.name,
        isActive: pixel.isActive,
        setupMethod: pixel.setupMethod,
        createdAt: pixel.createdAt.toISOString(),
        updatedAt: pixel.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating pixel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
