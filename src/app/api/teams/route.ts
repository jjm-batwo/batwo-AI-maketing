import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/infrastructure/auth/auth'
import { getTeamRepository } from '@/lib/di/container'
import { Team, TeamRole, DEFAULT_ROLE_PERMISSIONS, TeamPermission } from '@/domain/entities/Team'

/**
 * GET /api/teams
 * List teams for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teamRepository = getTeamRepository()
    const teams = await teamRepository.findByMemberUserId(session.user.id)

    const teamsWithRole = teams.map((team) => {
      const member = team.getMember(session.user.id)
      return {
        id: team.id,
        name: team.name,
        description: team.description,
        ownerId: team.ownerId,
        isOwner: team.isOwner(session.user.id),
        memberCount: team.memberCount,
        maxMembers: team.maxMembers,
        role: member?.role,
        permissions: member?.permissions || [],
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      }
    })

    return NextResponse.json({ teams: teamsWithRole })
  } catch (error) {
    console.error('Failed to list teams:', error)
    return NextResponse.json({ error: 'Failed to list teams' }, { status: 500 })
  }
}

/**
 * POST /api/teams
 * Create a new team
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, maxMembers } = body

    // Validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Team name is required' }, { status: 400 })
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Team name must be 100 characters or less' }, { status: 400 })
    }

    if (description && description.length > 500) {
      return NextResponse.json({ error: 'Description must be 500 characters or less' }, { status: 400 })
    }

    const teamRepository = getTeamRepository()

    // Check team limit (e.g., max 5 teams per user)
    const existingTeams = await teamRepository.findByOwnerId(session.user.id)
    if (existingTeams.length >= 5) {
      return NextResponse.json(
        { error: 'Maximum team limit reached (5 teams per user)' },
        { status: 400 }
      )
    }

    // Create team
    const team = Team.create({
      name: name.trim(),
      description: description?.trim(),
      ownerId: session.user.id,
      ownerEmail: session.user.email,
      ownerName: session.user.name || undefined,
      maxMembers: maxMembers || 10,
    })

    const savedTeam = await teamRepository.save(team)
    const owner = savedTeam.getOwner()

    return NextResponse.json({
      team: {
        id: savedTeam.id,
        name: savedTeam.name,
        description: savedTeam.description,
        ownerId: savedTeam.ownerId,
        memberCount: savedTeam.memberCount,
        maxMembers: savedTeam.maxMembers,
        role: owner.role,
        permissions: owner.permissions,
        createdAt: savedTeam.createdAt,
        updatedAt: savedTeam.updatedAt,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Failed to create team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}
