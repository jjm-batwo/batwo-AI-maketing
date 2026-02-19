import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import {
  requireAdmin,
  requireSuperAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import { getUserRepository } from '@/lib/di/container'
import { GlobalRole, canManageRole } from '@domain/value-objects/GlobalRole'
import { updateUserSchema, validateBody } from '@/lib/validations'

interface Params {
  id: string
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const { id } = await context.params
    const userRepository = getUserRepository()
    const user = await userRepository.findByIdWithFullDetails(id)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Admin user detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const authResult = await requireAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const { id } = await context.params

    // Validate request body
    const validation = await validateBody(request, updateUserSchema)
    if (!validation.success) return validation.error

    const { name, globalRole } = validation.data
    const userRepository = getUserRepository()

    // 사용자 존재 확인
    const existingUser = await userRepository.findById(id)
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 역할 변경인 경우 권한 검증
    if (globalRole && globalRole !== existingUser.globalRole) {
      // 관리자 역할 관리 권한 검증
      if (!canManageRole(authResult.globalRole, existingUser.globalRole)) {
        return NextResponse.json(
          { error: 'You do not have permission to modify this user\'s role' },
          { status: 403 }
        )
      }

      // ADMIN으로 변경하려면 SUPER_ADMIN 권한 필요
      if (globalRole === GlobalRole.ADMIN || globalRole === GlobalRole.SUPER_ADMIN) {
        const superAdminResult = await requireSuperAdmin()
        if (!superAdminResult.authorized) {
          return NextResponse.json(
            { error: 'Only Super Admin can promote users to Admin role' },
            { status: 403 }
          )
        }
      }
    }

    // 업데이트 가능한 필드만 추출
    const updateData: Partial<typeof existingUser> = {}
    if (name !== undefined) updateData.name = name
    if (globalRole !== undefined) updateData.globalRole = globalRole

    const updatedUser = await userRepository.update(id, updateData)

    revalidateTag('admin-dashboard', 'default')

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}
