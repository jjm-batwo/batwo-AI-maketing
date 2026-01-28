import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { ListUserPixelsUseCase } from '@application/use-cases/pixel/ListUserPixelsUseCase'
import { SelectPixelUseCase } from '@application/use-cases/pixel/SelectPixelUseCase'
import { pixelQuerySchema, createPixelSchema, validateQuery, validateBody } from '@/lib/validations'

// GET /api/pixel - List user's pixels
export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Validate query parameters
    const validation = validateQuery(searchParams, pixelQuerySchema)
    if (!validation.success) return validation.error

    const { page, limit, isActive, setupMethod } = validation.data

    const listPixelsUseCase = container.resolve<ListUserPixelsUseCase>(
      DI_TOKENS.ListUserPixelsUseCase
    )

    const result = await listPixelsUseCase.execute({
      userId: session.user.id,
      page,
      limit,
      isActive,
      setupMethod,
    })

    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
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

    // Validate request body
    const validation = await validateBody(request, createPixelSchema)
    if (!validation.success) return validation.error

    const { metaPixelId, name, setupMethod } = validation.data

    const selectPixelUseCase = container.resolve<SelectPixelUseCase>(
      DI_TOKENS.SelectPixelUseCase
    )

    const pixel = await selectPixelUseCase.execute({
      userId: session.user.id,
      metaPixelId,
      name: name.trim(),
      setupMethod,
    })

    return NextResponse.json(pixel, { status: 201 })
  } catch (error) {
    console.error('Error creating pixel:', error)

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
