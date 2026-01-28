/**
 * API Route Error Handling Examples
 *
 * This file demonstrates how to integrate the standardized error handling
 * system with Next.js API routes.
 */

import { NextRequest, NextResponse } from 'next/server'
import { AppError, ValidationError, NotFoundError } from '@application/errors'
import type { CreateCampaignUseCase } from '@application/use-cases/campaign/CreateCampaignUseCase'
import type { DeleteCampaignUseCase } from '@application/use-cases/campaign/DeleteCampaignUseCase'
import type { UpdateCampaignUseCase } from '@application/use-cases/campaign/UpdateCampaignUseCase'
import { isSuccess } from '@application/errors'

// =============================================================================
// Example 1: Exception-based error handling (recommended for most cases)
// =============================================================================

export async function POST_Campaign_ExceptionBased(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const session = await getServerSession()

    if (!session?.user?.id) {
      throw new ValidationError('User session required')
    }

    // UseCase throws AppError instances
    const createCampaignUseCase: CreateCampaignUseCase = getUseCase()
    const campaign = await createCampaignUseCase.execute({
      ...body,
      userId: session.user.id,
    })

    return NextResponse.json(campaign, { status: 201 })
  } catch (error) {
    // Handle AppError instances
    if (error instanceof AppError) {
      // Log errors that should be logged
      if (error.shouldLog) {
        console.error('[API Error]', error.toLogFormat())
      }

      // Return standardized error response
      return NextResponse.json(error.toJSON(), {
        status: error.statusCode,
      })
    }

    // Handle unexpected errors
    console.error('[Unexpected Error]', error)
    return NextResponse.json(
      {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// =============================================================================
// Example 2: Result-based error handling (for explicit error handling)
// =============================================================================

export async function DELETE_Campaign_ResultBased(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const session = await getServerSession()

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
        timestamp: new Date().toISOString(),
      },
      { status: 401 }
    )
  }

  // UseCase returns Result<void, Error>
  const deleteCampaignUseCase: DeleteCampaignUseCase = getUseCase()
  const result = await deleteCampaignUseCase.execute(context.params.id, session.user.id)

  // Handle Result
  if (isSuccess(result)) {
    return new Response(null, { status: 204 })
  } else {
    const error = result.error

    // Log if needed
    if (error.shouldLog) {
      console.error('[API Error]', error.toLogFormat())
    }

    // Return error response
    return NextResponse.json(error.toJSON(), {
      status: error.statusCode,
    })
  }
}

// =============================================================================
// Example 3: Error handling middleware (centralized approach)
// =============================================================================

type ApiHandler = (request: NextRequest, context: any) => Promise<Response>

/**
 * Wraps an API handler with standardized error handling
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest, context: any) => {
    try {
      return await handler(request, context)
    } catch (error) {
      if (error instanceof AppError) {
        if (error.shouldLog) {
          console.error('[API Error]', error.toLogFormat())
        }

        return NextResponse.json(error.toJSON(), {
          status: error.statusCode,
        })
      }

      console.error('[Unexpected Error]', error)
      return NextResponse.json(
        {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      )
    }
  }
}

// Usage with middleware
export const POST_Campaign_WithMiddleware = withErrorHandling(async (request, context) => {
  const body = await request.json()
  const session = await getServerSession()

  if (!session?.user?.id) {
    throw ValidationError.missingField('session')
  }

  const useCase: CreateCampaignUseCase = getUseCase()
  const campaign = await useCase.execute({
    ...body,
    userId: session.user.id,
  })

  return NextResponse.json(campaign, { status: 201 })
})

// =============================================================================
// Example 4: Manual error creation in route
// =============================================================================

export async function GET_Campaign(request: NextRequest, context: { params: { id: string } }) {
  try {
    const session = await getServerSession()

    // Manual validation with ValidationError
    if (!context.params.id) {
      throw ValidationError.missingField('id')
    }

    if (!session?.user?.id) {
      throw new UnauthorizedError('Authentication required')
    }

    const campaign = await getCampaignUseCase.execute(context.params.id, session.user.id)

    // Manual NotFoundError
    if (!campaign) {
      throw NotFoundError.entity('Campaign', context.params.id)
    }

    return NextResponse.json(campaign, { status: 200 })
  } catch (error) {
    if (error instanceof AppError) {
      if (error.shouldLog) {
        console.error('[API Error]', error.toLogFormat())
      }
      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }

    console.error('[Unexpected Error]', error)
    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// =============================================================================
// Example 5: Structured logging with error context
// =============================================================================

export async function PUT_Campaign(request: NextRequest, context: { params: { id: string } }) {
  const requestId = crypto.randomUUID()

  try {
    const body = await request.json()
    const session = await getServerSession()

    if (!session?.user?.id) {
      throw ValidationError.missingField('session')
    }

    const useCase: UpdateCampaignUseCase = getUseCase()
    const campaign = await useCase.execute(context.params.id, session.user.id, body)

    // Structured success log
    console.info('[API Success]', {
      requestId,
      method: 'PUT',
      path: `/api/campaigns/${context.params.id}`,
      userId: session.user.id,
      duration: performance.now(),
    })

    return NextResponse.json(campaign, { status: 200 })
  } catch (error) {
    if (error instanceof AppError) {
      // Structured error log with full context
      const logData = {
        requestId,
        method: 'PUT',
        path: `/api/campaigns/${context.params.id}`,
        error: error.toLogFormat(),
        duration: performance.now(),
      }

      if (error.shouldLog) {
        console.error('[API Error]', logData)
      } else {
        console.info('[API Client Error]', logData)
      }

      return NextResponse.json(error.toJSON(), { status: error.statusCode })
    }

    console.error('[Unexpected Error]', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// =============================================================================
// Example 6: Error response format
// =============================================================================

/**
 * Example error responses that will be sent to clients
 */
const errorResponseExamples = {
  validation: {
    code: 'VALIDATION_ERROR',
    message: 'Required field is missing: name',
    statusCode: 400,
    timestamp: '2026-01-25T12:00:00.000Z',
    context: {
      field: 'name',
    },
  },

  notFound: {
    code: 'NOT_FOUND',
    message: 'Campaign not found with id: 123',
    statusCode: 404,
    timestamp: '2026-01-25T12:00:00.000Z',
    context: {
      entityName: 'Campaign',
      id: '123',
    },
  },

  forbidden: {
    code: 'FORBIDDEN',
    message: 'Access denied to Campaign',
    statusCode: 403,
    timestamp: '2026-01-25T12:00:00.000Z',
    context: {
      resourceType: 'Campaign',
      resourceId: '123',
    },
  },

  rateLimit: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'AI Copy Generation quota exceeded. Limit: 20 per day',
    statusCode: 429,
    timestamp: '2026-01-25T12:00:00.000Z',
    resetAt: '2026-01-26T00:00:00.000Z',
    limit: 20,
    context: {
      resourceType: 'AI Copy Generation',
      limit: 20,
      period: 'day',
    },
  },

  externalService: {
    code: 'EXTERNAL_SERVICE_ERROR',
    message: 'Meta Ads API error during fetch campaigns: Rate limit exceeded',
    statusCode: 502,
    timestamp: '2026-01-25T12:00:00.000Z',
    serviceName: 'Meta Ads API',
    context: {
      serviceName: 'Meta Ads API',
      operation: 'fetch campaigns',
      details: 'Rate limit exceeded',
    },
  },
}

// =============================================================================
// Helper functions (mock implementations for example)
// =============================================================================

async function getServerSession() {
  return { user: { id: 'user-123' } }
}

function getUseCase(): any {
  return {} as any
}

const getCampaignUseCase: any = {}
const UpdateCampaignUseCase: any = {}
const UnauthorizedError: any = {}
