/**
 * Route Wrapper - 라우트 핸들러 보일러플레이트 추출
 *
 * try-catch + 인증 체크 + HTTP 상태 코드 반환 패턴 공통화
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { InvalidCampaignError } from '@domain/errors/InvalidCampaignError'
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@application/errors'

type AuthenticatedUser = {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
}

type RouteContext = {
  params: Promise<Record<string, string>>
}

/**
 * 인증된 사용자가 필요한 라우트 핸들러를 감싸는 wrapper.
 *
 * @example
 * export const GET = withAuth(async (request, user, { params }) => {
 *   const { id } = await params
 *   const result = await someUseCase.execute(id, user.id)
 *   return NextResponse.json(result)
 * })
 */
export function withAuth(
  handler: (
    request: NextRequest,
    user: AuthenticatedUser,
    context: RouteContext
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: RouteContext) => {
    const user = await getAuthenticatedUser()
    if (!user) return unauthorizedResponse()

    return withErrorHandling(() => handler(request, user, context))
  }
}

/**
 * 인증 없이 에러 핸들링만 적용하는 wrapper.
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const result = await somePublicQuery()
 *   return NextResponse.json(result)
 * })
 */
export function withErrorHandler(
  handler: (request: NextRequest, context: RouteContext) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: RouteContext) => {
    return withErrorHandling(() => handler(request, context))
  }
}

/**
 * 공통 에러 핸들링 로직.
 * 도메인/애플리케이션 에러를 적절한 HTTP 상태 코드로 변환.
 */
async function withErrorHandling(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn()
  } catch (error) {
    // Domain errors
    if (error instanceof InvalidCampaignError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    // Application errors (Result pattern)
    if (error instanceof ValidationError) {
      return NextResponse.json({ message: error.message }, { status: 400 })
    }

    if (error instanceof NotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 })
    }

    if (error instanceof ForbiddenError) {
      return NextResponse.json({ message: error.message }, { status: 403 })
    }

    // Unexpected errors
    console.error('Unhandled route error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
