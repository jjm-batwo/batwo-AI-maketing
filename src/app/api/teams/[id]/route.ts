import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { getTeamRepository } from '@/lib/di/container'
import { updateTeamSchema, validateBody } from '@/lib/validations'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * GET /api/teams/[id]
 * Get team details with members
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
      invitedAt: member.invitedAt,
      joinedAt: member.joinedAt,
      isActive: member.isActive,
      isPending: member.isPending,
    }))

    return NextResponse.json({
      team: {
        id: team.id,
        name: team.name,
        description: team.description,
        ownerId: team.ownerId,
        memberCount: team.memberCount,
        maxMembers: team.maxMembers,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      },
      members: membersData,
      currentUserRole: currentMember.role,
      currentUserPermissions: currentMember.permissions,
    })
  } catch (error) {
    console.error('Failed to get team:', error)
    return NextResponse.json({ error: 'Failed to get team' }, { status: 500 })
  }
}

/**
 * PATCH /api/teams/[id]
 * Update team details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Validate request body
    const validation = await validateBody(request, updateTeamSchema)
    if (!validation.success) return validation.error

    const { name, description } = validation.data

    const teamRepository = getTeamRepository()
    const team = await teamRepository.findById(id)

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if user can manage team
    if (!team.canUserManageTeam(session.user.id)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update team
    let updatedTeam = team
    if (name !== undefined) {
      updatedTeam = updatedTeam.updateName(name.trim())
    }
    if (description !== undefined) {
      updatedTeam = updatedTeam.updateDescription(description.trim())
    }

    const savedTeam = await teamRepository.update(updatedTeam)

    return NextResponse.json({
      team: {
        id: savedTeam.id,
        name: savedTeam.name,
        description: savedTeam.description,
        ownerId: savedTeam.ownerId,
        memberCount: savedTeam.memberCount,
        maxMembers: savedTeam.maxMembers,
        createdAt: savedTeam.createdAt,
        updatedAt: savedTeam.updatedAt,
      },
    })
  } catch (error) {
    console.error('Failed to update team:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

/**
 * DELETE /api/teams/[id]
 * Delete team (owner only)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Only owner can delete team
    if (!team.isOwner(session.user.id)) {
      return NextResponse.json({ error: 'Only team owner can delete the team' }, { status: 403 })
    }

    await teamRepository.delete(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}
