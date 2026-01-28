/**
 * Centralized Zod validation schemas for API routes
 */

export * from './campaign'
export * from './pixel'
export * from './ai'
export * from './report'
export * from './team'
export * from './abtest'
export * from './budgetAlert'
export * from './admin'

import { z } from 'zod'
import { NextResponse } from 'next/server'

/**
 * Generic validation error handler
 */
export function handleValidationError(error: z.ZodError<unknown>) {
  const errors = error.issues.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return NextResponse.json(
    {
      error: 'Validation failed',
      details: errors,
    },
    { status: 400 }
  )
}

/**
 * Helper function to validate request body
 */
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: handleValidationError(error) }
    }
    return {
      success: false,
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }
}

/**
 * Helper function to validate query parameters
 */
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: NextResponse } {
  try {
    const params = Object.fromEntries(searchParams.entries())
    const data = schema.parse(params)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: handleValidationError(error) }
    }
    return {
      success: false,
      error: NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 }),
    }
  }
}
