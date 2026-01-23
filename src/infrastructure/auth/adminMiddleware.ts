import { auth } from './auth'
import { NextResponse } from 'next/server'
import {
  GlobalRole,
  isAdmin,
  isSuperAdmin,
} from '@domain/value-objects/GlobalRole'

export interface AdminAuthResult {
  authorized: boolean
  userId: string
  globalRole: GlobalRole
  error?: string
}

/**
 * Admin API 라우트용 인증 헬퍼
 * API route에서 관리자 권한을 검증합니다.
 *
 * @example
 * ```typescript
 * export async function GET(request: Request) {
 *   const authResult = await requireAdmin()
 *   if (!authResult.authorized) {
 *     return NextResponse.json({ error: authResult.error }, { status: 403 })
 *   }
 *   // authResult.userId와 authResult.globalRole 사용
 * }
 * ```
 */
export async function requireAdmin(): Promise<AdminAuthResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      authorized: false,
      userId: '',
      globalRole: GlobalRole.USER,
      error: 'Unauthorized: Not logged in',
    }
  }

  const globalRole = (session.user.globalRole as GlobalRole) || GlobalRole.USER

  if (!isAdmin(globalRole)) {
    return {
      authorized: false,
      userId: session.user.id,
      globalRole,
      error: 'Forbidden: Admin access required',
    }
  }

  return {
    authorized: true,
    userId: session.user.id,
    globalRole,
  }
}

/**
 * Super Admin 전용 API 라우트용 인증 헬퍼
 * 최고 관리자 권한만 허용합니다.
 */
export async function requireSuperAdmin(): Promise<AdminAuthResult> {
  const session = await auth()

  if (!session?.user?.id) {
    return {
      authorized: false,
      userId: '',
      globalRole: GlobalRole.USER,
      error: 'Unauthorized: Not logged in',
    }
  }

  const globalRole = (session.user.globalRole as GlobalRole) || GlobalRole.USER

  if (!isSuperAdmin(globalRole)) {
    return {
      authorized: false,
      userId: session.user.id,
      globalRole,
      error: 'Forbidden: Super Admin access required',
    }
  }

  return {
    authorized: true,
    userId: session.user.id,
    globalRole,
  }
}

/**
 * API 응답 헬퍼: 권한 없음
 */
export function unauthorizedResponse(error: string = 'Unauthorized') {
  return NextResponse.json({ error }, { status: 401 })
}

/**
 * API 응답 헬퍼: 접근 금지
 */
export function forbiddenResponse(error: string = 'Forbidden') {
  return NextResponse.json({ error }, { status: 403 })
}

/**
 * Admin 인증 결과를 처리하고 에러 응답을 반환하는 헬퍼
 * 권한이 있으면 null 반환, 없으면 에러 Response 반환
 */
export function handleAdminAuth(authResult: AdminAuthResult): NextResponse | null {
  if (!authResult.authorized) {
    if (authResult.error?.includes('Not logged in')) {
      return unauthorizedResponse(authResult.error)
    }
    return forbiddenResponse(authResult.error)
  }
  return null
}
