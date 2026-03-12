/**
 * Cron Authentication Middleware
 *
 * Validates Vercel Cron requests using CRON_SECRET environment variable.
 *
 * Security Requirements:
 * 1. CRON_SECRET must be configured in environment variables
 * 2. Authorization header must match "Bearer {CRON_SECRET}"
 * 3. Fails closed: returns 500 if CRON_SECRET is not configured
 * 4. Uses timingSafeEqual to prevent timing attacks
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'

export interface CronAuthResult {
  authorized: boolean
  response?: NextResponse
}

/**
 * Validates Vercel Cron request authorization
 *
 * @param request - Next.js request object
 * @returns CronAuthResult with authorized flag and error response if unauthorized
 *
 * @example
 * ```typescript
 * const authResult = validateCronAuth(request)
 * if (!authResult.authorized) {
 *   return authResult.response
 * }
 * // Continue with cron job logic
 * ```
 */
export function validateCronAuth(request: NextRequest): CronAuthResult {
  const cronSecret = process.env.CRON_SECRET

  // CRITICAL: CRON_SECRET must be configured
  if (!cronSecret || cronSecret.trim() === '') {
    console.error('[Cron Auth] CRON_SECRET is not configured')
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Server configuration error: CRON_SECRET not set' },
        { status: 500 }
      ),
    }
  }

  const authHeader = request.headers.get('authorization')
  const expectedValue = `Bearer ${cronSecret}`

  // Validate authorization header with timing-safe comparison
  if (!authHeader || authHeader.length !== expectedValue.length) {
    console.warn('[Cron Auth] Unauthorized cron request attempt')
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const isValid = timingSafeEqual(Buffer.from(authHeader), Buffer.from(expectedValue))

  if (!isValid) {
    console.warn('[Cron Auth] Unauthorized cron request attempt')
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  return {
    authorized: true,
  }
}
