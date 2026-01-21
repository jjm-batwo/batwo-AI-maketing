import { NextRequest, NextResponse } from 'next/server'
import {
  requireAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import { getUserRepository } from '@/lib/di/container'
import { GlobalRole } from '@domain/value-objects/GlobalRole'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { SubscriptionStatus } from '@domain/value-objects/SubscriptionStatus'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const userRepository = getUserRepository()
    const searchParams = request.nextUrl.searchParams

    // 쿼리 파라미터 파싱
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const search = searchParams.get('search') || undefined
    const globalRole = searchParams.get('globalRole') as GlobalRole | undefined
    const subscriptionPlan = searchParams.get('subscriptionPlan') as SubscriptionPlan | undefined
    const subscriptionStatus = searchParams.get('subscriptionStatus') as SubscriptionStatus | undefined
    const sortBy = searchParams.get('sortBy') as 'createdAt' | 'name' | 'email' | undefined
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined
    const createdAtFrom = searchParams.get('createdAtFrom')
    const createdAtTo = searchParams.get('createdAtTo')

    const result = await userRepository.findForAdmin({
      page,
      limit,
      search,
      globalRole,
      subscriptionPlan,
      subscriptionStatus,
      sortBy,
      sortOrder,
      createdAtFrom: createdAtFrom ? new Date(createdAtFrom) : undefined,
      createdAtTo: createdAtTo ? new Date(createdAtTo) : undefined,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Admin users list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
