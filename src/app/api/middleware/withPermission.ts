/**
 * Permission Middleware
 *
 * Higher-order function that wraps API route handlers with permission checks.
 * Integrates with NextAuth and PermissionService for team-based access control.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import { IPermissionService } from '@/application/ports/IPermissionService'

type RouteHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> }
) => Promise<NextResponse>

interface PermissionCheckOptions {
  /**
   * Permission string to check (e.g., "campaign:create")
   */
  permission: string

  /**
   * Strategy to extract teamId from the request
   * - 'param': Extract from URL params (e.g., /api/teams/[teamId]/...)
   * - 'query': Extract from query string (e.g., ?teamId=...)
   * - 'header': Extract from X-Team-Id header
   */
  teamIdSource?: 'param' | 'query' | 'header'

  /**
   * Name of the param if using 'param' source (default: 'teamId')
   */
  paramName?: string
}

/**
 * Middleware to check if authenticated user has required permission within a team
 *
 * @example
 * ```ts
 * export const POST = withPermission(
 *   async (request, { params }) => {
 *     // Your handler logic
 *     return NextResponse.json({ success: true })
 *   },
 *   {
 *     permission: 'campaign:create',
 *     teamIdSource: 'param', // Extract from URL params
 *   }
 * )
 * ```
 */
export function withPermission(
  handler: RouteHandler,
  options: PermissionCheckOptions
): RouteHandler {
  return async (request: NextRequest, context) => {
    // 1. Check authentication
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 2. Extract teamId based on source strategy
    let teamId: string | null = null

    try {
      const source = options.teamIdSource || 'param'

      if (source === 'param') {
        const paramName = options.paramName || 'teamId'
        const params = await context.params
        teamId = params[paramName] || null
      } else if (source === 'query') {
        const { searchParams } = new URL(request.url)
        teamId = searchParams.get('teamId')
      } else if (source === 'header') {
        teamId = request.headers.get('X-Team-Id')
      }
    } catch (error) {
      console.error('Failed to extract teamId:', error)
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    if (!teamId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Team ID is required' },
        { status: 400 }
      )
    }

    // 3. Check permission
    try {
      const permissionService = container.resolve<IPermissionService>(
        DI_TOKENS.PermissionService
      )

      const hasPermission = await permissionService.checkPermission(
        userId,
        teamId,
        options.permission
      )

      if (!hasPermission) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // 4. Call the original handler if permission check passes
      return handler(request, context)
    } catch (error) {
      console.error('Permission check failed:', error)
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Permission check failed' },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware to check if user has ANY of the specified permissions (OR logic)
 *
 * @example
 * ```ts
 * export const GET = withAnyPermission(
 *   async (request, { params }) => {
 *     // Your handler logic
 *     return NextResponse.json({ data: [] })
 *   },
 *   {
 *     permissions: ['campaign:read', 'campaign:manage'],
 *     teamIdSource: 'param',
 *   }
 * )
 * ```
 */
export function withAnyPermission(
  handler: RouteHandler,
  options: Omit<PermissionCheckOptions, 'permission'> & {
    permissions: string[]
  }
): RouteHandler {
  return async (request: NextRequest, context) => {
    // 1. Check authentication
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // 2. Extract teamId based on source strategy
    let teamId: string | null = null

    try {
      const source = options.teamIdSource || 'param'

      if (source === 'param') {
        const paramName = options.paramName || 'teamId'
        const params = await context.params
        teamId = params[paramName] || null
      } else if (source === 'query') {
        const { searchParams } = new URL(request.url)
        teamId = searchParams.get('teamId')
      } else if (source === 'header') {
        teamId = request.headers.get('X-Team-Id')
      }
    } catch (error) {
      console.error('Failed to extract teamId:', error)
      return NextResponse.json(
        { error: 'Bad Request', message: 'Invalid request parameters' },
        { status: 400 }
      )
    }

    if (!teamId) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Team ID is required' },
        { status: 400 }
      )
    }

    // 3. Check if user has ANY of the required permissions
    try {
      const permissionService = container.resolve<IPermissionService>(
        DI_TOKENS.PermissionService
      )

      const permissionChecks = await Promise.all(
        options.permissions.map(permission =>
          permissionService.checkPermission(userId, teamId, permission)
        )
      )

      const hasAnyPermission = permissionChecks.some(result => result === true)

      if (!hasAnyPermission) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // 4. Call the original handler if permission check passes
      return handler(request, context)
    } catch (error) {
      console.error('Permission check failed:', error)
      return NextResponse.json(
        { error: 'Internal Server Error', message: 'Permission check failed' },
        { status: 500 }
      )
    }
  }
}
