import {
  Team as PrismaTeam,
  TeamMember as PrismaTeamMember,
  TeamRole as PrismaTeamRole,
} from '@/generated/prisma'
import {
  Team,
  TeamMember,
  TeamMemberProps,
  TeamRole,
  TeamPermission,
} from '@/domain/entities/Team'

type PrismaTeamWithMembers = PrismaTeam & {
  members: PrismaTeamMember[]
}

export class TeamMapper {
  /**
   * Map Prisma TeamRole to Domain TeamRole
   */
  static mapRoleToDomain(prismaRole: PrismaTeamRole): TeamRole {
    const roleMap: Record<PrismaTeamRole, TeamRole> = {
      OWNER: 'OWNER',
      ADMIN: 'ADMIN',
      MEMBER: 'MEMBER',
      VIEWER: 'VIEWER',
    }
    return roleMap[prismaRole]
  }

  /**
   * Map Domain TeamRole to Prisma TeamRole
   */
  static mapRoleToPrisma(domainRole: TeamRole): PrismaTeamRole {
    const roleMap: Record<TeamRole, PrismaTeamRole> = {
      OWNER: 'OWNER',
      ADMIN: 'ADMIN',
      MEMBER: 'MEMBER',
      VIEWER: 'VIEWER',
    }
    return roleMap[domainRole]
  }

  /**
   * Map Prisma TeamMember to Domain TeamMember
   */
  static mapMemberToDomain(prismaMember: PrismaTeamMember): TeamMember {
    const props: TeamMemberProps = {
      id: prismaMember.id,
      teamId: prismaMember.teamId,
      userId: prismaMember.userId,
      email: prismaMember.email,
      name: prismaMember.name || undefined,
      role: this.mapRoleToDomain(prismaMember.role),
      permissions: prismaMember.permissions as TeamPermission[],
      invitedBy: prismaMember.invitedBy || undefined,
      invitedAt: prismaMember.invitedAt,
      joinedAt: prismaMember.joinedAt || undefined,
      createdAt: prismaMember.createdAt,
      updatedAt: prismaMember.updatedAt,
    }
    return TeamMember.reconstruct(props)
  }

  /**
   * Map Domain TeamMember to Prisma create/update data
   */
  static mapMemberToPrismaCreate(member: TeamMember): Omit<
    PrismaTeamMember,
    'team' | 'createdAt' | 'updatedAt'
  > {
    return {
      id: member.id,
      teamId: member.teamId,
      userId: member.userId,
      email: member.email,
      name: member.name || null,
      role: this.mapRoleToPrisma(member.role),
      permissions: member.permissions,
      invitedBy: member.invitedBy || null,
      invitedAt: member.invitedAt,
      joinedAt: member.joinedAt || null,
    }
  }

  /**
   * Map Prisma Team with members to Domain Team
   */
  static toDomain(prismaTeam: PrismaTeamWithMembers): Team {
    const members = prismaTeam.members.map((m) => this.mapMemberToDomain(m))

    return Team.reconstruct({
      id: prismaTeam.id,
      name: prismaTeam.name,
      description: prismaTeam.description || undefined,
      ownerId: prismaTeam.ownerId,
      members,
      maxMembers: prismaTeam.maxMembers,
      createdAt: prismaTeam.createdAt,
      updatedAt: prismaTeam.updatedAt,
    })
  }

  /**
   * Map Domain Team to Prisma create data
   */
  static toPrismaCreate(team: Team): {
    team: Omit<PrismaTeam, 'members' | 'createdAt' | 'updatedAt'>
    members: Array<Omit<PrismaTeamMember, 'team' | 'createdAt' | 'updatedAt'>>
  } {
    return {
      team: {
        id: team.id,
        name: team.name,
        description: team.description || null,
        ownerId: team.ownerId,
        maxMembers: team.maxMembers,
      },
      members: team.members.map((m) => this.mapMemberToPrismaCreate(m)),
    }
  }

  /**
   * Map Domain Team to Prisma update data (excludes members - they're handled separately)
   */
  static toPrismaUpdate(
    team: Team
  ): Omit<PrismaTeam, 'members' | 'createdAt' | 'id'> {
    return {
      name: team.name,
      description: team.description || null,
      ownerId: team.ownerId,
      maxMembers: team.maxMembers,
      updatedAt: team.updatedAt,
    }
  }
}
