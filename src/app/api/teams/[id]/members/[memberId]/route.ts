import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { getTeamRepository } from '@/lib/di/container'
import { TeamRole, TeamPermission, DEFAULT_ROLE_PERMISSIONS } from '@/domain/entities/Team'
import { updateTeamMemberSchema, validateBody } from '@/lib/validations'

type RouteParams = { params: Promise<{ id: string; memberId: string }> }

const VALID_ROLES: TeamRole[] = ['ADMIN', 'MEMBER', 'VIEWER']

function isValidRole(role: string): role is TeamRole {
  return VALID_ROLES.includes(role as TeamRole)
}

/**
 * GET /api/teams/[id]/members/[memberId]
 * Get member details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, memberId } = await params
    const teamRepository = getTeamRepository()
    const team = await teamRepository.findById(id)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user is a member
    const currentMember = team.getMember(session.user.id)
    if (!currentMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Find the target member
    const targetMember = team.members.find((m) => m.id === memberId)
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    return NextResponse.json({
      member: {
        id: targetMember.id,
        userId: targetMember.userId,
        email: targetMember.email,
        name: targetMember.name,
        role: targetMember.role,
        permissions: targetMember.permissions,
        invitedBy: targetMember.invitedBy,
        invitedAt: targetMember.invitedAt,
        joinedAt: targetMember.joinedAt,
        isActive: targetMember.isActive,
        isPending: targetMember.isPending,
      },
    })
  } catch (error) {
    console.error('Failed to get team member:', error)
    return NextResponse.json({ error: 'Failed to get team member' }, { status: 500 })
  }
}

/**
 * PATCH /api/teams/[id]/members/[memberId]
 * Update member role or permissions
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, memberId } = await params

    // Validate request body
    const validation = await validateBody(request, updateTeamMemberSchema)
    if (!validation.success) return validation.error

    const { role, permissions, action } = validation.data

    const teamRepository = getTeamRepository()
    const team = await teamRepository.findById(id)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user can manage team
    const currentMember = team.getMember(session.user.id)
    if (!currentMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Find the target member
    const targetMember = team.members.find((m) => m.id === memberId)
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Handle accept invitation action
    if (action === 'accept') {
      // User can only accept their own invitation
      if (targetMember.email !== session.user.email) {
        return NextResponse.json({ error: 'Cannot accept invitation for another user' }, { status: 403 })
      }

      if (targetMember.isActive) {
        return NextResponse.json({ error: 'Invitation already accepted' }, { status: 400 })
      }

      // Update userId to the actual user's ID and mark as joined
      const updatedMember = targetMember
        .updateName(session.user.name || targetMember.name || '')
        .acceptInvitation()

      // Create a new member with the correct userId
      const memberWithUserId = Object.assign(Object.create(Object.getPrototypeOf(updatedMember)), {
        ...updatedMember,
        props: {
          ...updatedMember.toJSON(),
          userId: session.user.id,
        },
      })

      await teamRepository.updateMember(memberWithUserId)

      return NextResponse.json({
        member: {
          id: memberWithUserId.id,
          email: memberWithUserId.email,
          name: memberWithUserId.name,
          role: memberWithUserId.role,
          permissions: memberWithUserId.permissions,
          isActive: true,
          joinedAt: new Date(),
        },
      })
    }

    // For role/permission updates, require team management permission
    if (!currentMember.canManageTeam()) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Cannot modify owner
    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot modify team owner' }, { status: 400 })
    }

    // Update role
    if (role !== undefined) {
      if (!isValidRole(role)) {
        return NextResponse.json(
          { error: `Role must be one of: ${VALID_ROLES.join(', ')}` },
          { status: 400 }
        )
      }

      try {
        const newPermissions = permissions || DEFAULT_ROLE_PERMISSIONS[role]
        const updatedMember = targetMember.updateRole(role, newPermissions)
        await teamRepository.updateMember(updatedMember)

        return NextResponse.json({
          member: {
            id: updatedMember.id,
            email: updatedMember.email,
            name: updatedMember.name,
            role: updatedMember.role,
            permissions: updatedMember.permissions,
            isActive: updatedMember.isActive,
          },
        })
      } catch (error) {
        if (error instanceof Error) {
          return NextResponse.json({ error: error.message }, { status: 400 })
        }
        throw error
      }
    }

    // Update only permissions
    if (permissions !== undefined) {
      const validPermissions = DEFAULT_ROLE_PERMISSIONS[targetMember.role]
      const invalidPerms = permissions.filter((p: string) => !validPermissions.includes(p as TeamPermission))
      if (invalidPerms.length > 0) {
        return NextResponse.json(
          { error: `Invalid permissions for role ${targetMember.role}: ${invalidPerms.join(', ')}` },
          { status: 400 }
        )
      }

      const updatedMember = targetMember.updatePermissions(permissions)
      await teamRepository.updateMember(updatedMember)

      return NextResponse.json({
        member: {
          id: updatedMember.id,
          email: updatedMember.email,
          name: updatedMember.name,
          role: updatedMember.role,
          permissions: updatedMember.permissions,
          isActive: updatedMember.isActive,
        },
      })
    }

    return NextResponse.json({ error: 'No update parameters provided' }, { status: 400 })
  } catch (error) {
    console.error('Failed to update team member:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

/**
 * DELETE /api/teams/[id]/members/[memberId]
 * Remove member from team
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, memberId } = await params
    const teamRepository = getTeamRepository()
    const team = await teamRepository.findById(id)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user is a member
    const currentMember = team.getMember(session.user.id)
    if (!currentMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Find the target member
    const targetMember = team.members.find((m) => m.id === memberId)
    if (!targetMember) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }

    // Cannot remove owner
    if (targetMember.role === 'OWNER') {
      return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 })
    }

    // User can leave the team themselves
    const isSelfRemoval = targetMember.userId === session.user.id || targetMember.email === session.user.email

    // Otherwise, require team management permission
    if (!isSelfRemoval && !currentMember.canManageTeam()) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    await teamRepository.removeMember(id, targetMember.userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove team member:', error)
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
  }
}
