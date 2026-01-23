import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { getTeamRepository } from '@/lib/di/container'
import { TeamRole, TeamPermission, DEFAULT_ROLE_PERMISSIONS } from '@/domain/entities/Team'

type RouteParams = { params: Promise<{ id: string }> }

const VALID_ROLES: TeamRole[] = ['ADMIN', 'MEMBER', 'VIEWER']

function isValidRole(role: string): role is TeamRole {
  return VALID_ROLES.includes(role as TeamRole)
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * GET /api/teams/[id]/members
 * List team members
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
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

    // Format members for response
    const membersData = team.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      email: member.email,
      name: member.name,
      role: member.role,
      permissions: member.permissions,
      invitedBy: member.invitedBy,
      invitedAt: member.invitedAt,
      joinedAt: member.joinedAt,
      isActive: member.isActive,
      isPending: member.isPending,
    }))

    return NextResponse.json({
      members: membersData,
      totalCount: team.memberCount,
      pendingCount: team.pendingInvitations.length,
    })
  } catch (error) {
    console.error('Failed to list team members:', error)
    return NextResponse.json({ error: 'Failed to list team members' }, { status: 500 })
  }
}

/**
 * POST /api/teams/[id]/members
 * Invite a new member to the team
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { email, name, role, permissions } = body

    // Validation
    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    if (!role || !isValidRole(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${VALID_ROLES.join(', ')}` },
        { status: 400 }
      )
    }

    const teamRepository = getTeamRepository()
    const team = await teamRepository.findById(id)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user can invite members
    if (!team.canUserInviteMembers(session.user.id)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Check if team is full
    if (team.isFull) {
      return NextResponse.json(
        { error: `Team has reached maximum capacity (${team.maxMembers} members)` },
        { status: 400 }
      )
    }

    // Check if user is already a member
    const existingMember = team.getMemberByEmail(email)
    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member or has a pending invitation' },
        { status: 400 }
      )
    }

    try {
      // Validate permissions if provided
      let memberPermissions: TeamPermission[] | undefined
      if (permissions && Array.isArray(permissions)) {
        const validPermissions = DEFAULT_ROLE_PERMISSIONS[role]
        const invalidPerms = permissions.filter((p: string) => !validPermissions.includes(p as TeamPermission))
        if (invalidPerms.length > 0) {
          return NextResponse.json(
            { error: `Invalid permissions for role ${role}: ${invalidPerms.join(', ')}` },
            { status: 400 }
          )
        }
        memberPermissions = permissions as TeamPermission[]
      }

      // Invite member (generate a temporary userId - will be updated when user accepts)
      const { member: newMember } = team.inviteMember({
        userId: `pending_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        email: email.toLowerCase(),
        name: name?.trim(),
        role: role as TeamRole,
        invitedBy: session.user.id,
        permissions: memberPermissions,
      })

      // Save the new member
      await teamRepository.addMember(newMember)

      return NextResponse.json({
        member: {
          id: newMember.id,
          email: newMember.email,
          name: newMember.name,
          role: newMember.role,
          permissions: newMember.permissions,
          invitedAt: newMember.invitedAt,
          isPending: newMember.isPending,
        },
      }, { status: 201 })
    } catch (error) {
      if (error instanceof Error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }
  } catch (error) {
    console.error('Failed to invite team member:', error)
    return NextResponse.json({ error: 'Failed to invite team member' }, { status: 500 })
  }
}
