import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import {
  requireSuperAdmin,
  handleAdminAuth,
} from '@/infrastructure/auth/adminMiddleware'
import { prisma } from '@/lib/prisma'
import { GlobalRole, canManageRole } from '@domain/value-objects/GlobalRole'

// 관리자 목록 조회 (SUPER_ADMIN 전용)
export async function GET() {
  const authResult = await requireSuperAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const admins = await prisma.user.findMany({
      where: {
        globalRole: {
          in: ['ADMIN', 'SUPER_ADMIN'],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
        createdAt: true,
        image: true,
      },
      orderBy: [
        { globalRole: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({
      admins: admins.map((admin) => ({
        ...admin,
        isSuperAdmin: admin.globalRole === 'SUPER_ADMIN',
      })),
      total: admins.length,
    })
  } catch (error) {
    console.error('Admin list error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin list' },
      { status: 500 }
    )
  }
}

// 관리자 역할 변경 (SUPER_ADMIN 전용)
export async function POST(request: NextRequest) {
  const authResult = await requireSuperAdmin()
  const authError = handleAdminAuth(authResult)
  if (authError) return authError

  try {
    const body = await request.json()
    const { userId, action } = body // action: 'promote' | 'demote' | 'remove'

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'userId and action are required' },
        { status: 400 }
      )
    }

    // 자기 자신은 변경 불가
    if (userId === authResult.userId) {
      return NextResponse.json(
        { error: 'Cannot modify your own role' },
        { status: 400 }
      )
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, globalRole: true, email: true },
    })

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const targetRole = targetUser.globalRole as GlobalRole

    // 권한 검증
    if (!canManageRole(authResult.globalRole, targetRole)) {
      return NextResponse.json(
        { error: 'Cannot modify this user\'s role' },
        { status: 403 }
      )
    }

    let newRole: GlobalRole

    switch (action) {
      case 'promote':
        // USER → ADMIN
        if (targetRole === GlobalRole.USER) {
          newRole = GlobalRole.ADMIN
        } else {
          return NextResponse.json(
            { error: 'User is already an admin' },
            { status: 400 }
          )
        }
        break

      case 'demote':
        // ADMIN → USER
        if (targetRole === GlobalRole.ADMIN) {
          newRole = GlobalRole.USER
        } else {
          return NextResponse.json(
            { error: 'Cannot demote this user' },
            { status: 400 }
          )
        }
        break

      case 'remove':
        // ADMIN → USER (관리자 권한 제거)
        if (targetRole === GlobalRole.ADMIN) {
          newRole = GlobalRole.USER
        } else {
          return NextResponse.json(
            { error: 'Cannot remove admin rights from this user' },
            { status: 400 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { globalRole: newRole },
      select: {
        id: true,
        name: true,
        email: true,
        globalRole: true,
      },
    })

    revalidateTag('admin-dashboard', 'default')

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `User role updated to ${newRole}`,
    })
  } catch (error) {
    console.error('Admin role update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    )
  }
}
