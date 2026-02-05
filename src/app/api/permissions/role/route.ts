/**
 * User Role API Endpoint
 *
 * GET /api/permissions/role?teamId=xxx
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { container } from '@/lib/di/container'
import { DI_TOKENS } from '@/lib/di/types'
import type { IPermissionService } from '@/application/ports/IPermissionService'

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const teamId = req.nextUrl.searchParams.get('teamId')

  if (!teamId) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'teamId is required' },
      { status: 400 }
    )
  }

  const permissionService = container.resolve<IPermissionService>(
    DI_TOKENS.PermissionService
  )

  const role = await permissionService.getUserRole(session.user.id, teamId)

  return NextResponse.json({ role })
}
