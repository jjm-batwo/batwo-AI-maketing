import { PrismaClient, TeamRole as PrismaTeamRole, Prisma } from '@/generated/prisma'
import { ITeamRepository, TeamFilters } from '@/domain/repositories/ITeamRepository'
import { Team, TeamMember, TeamRole } from '@/domain/entities/Team'
import { TeamMapper } from '../mappers/TeamMapper'

export class PrismaTeamRepository implements ITeamRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(team: Team): Promise<Team> {
    const { team: teamData, members } = TeamMapper.toPrismaCreate(team)

    const createdTeam = await this.prisma.team.create({
      data: {
        ...teamData,
        members: {
          createMany: {
            data: members,
          },
        },
      },
      include: {
        members: true,
      },
    })

    return TeamMapper.toDomain(createdTeam)
  }

  async findById(id: string): Promise<Team | null> {
    const team = await this.prisma.team.findUnique({
      where: { id },
      include: { members: true },
    })

    if (!team) return null
    return TeamMapper.toDomain(team)
  }

  async findByOwnerId(ownerId: string): Promise<Team[]> {
    const teams = await this.prisma.team.findMany({
      where: { ownerId },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    })

    return teams.map(TeamMapper.toDomain)
  }

  async findByMemberUserId(userId: string): Promise<Team[]> {
    const teams = await this.prisma.team.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    })

    return teams.map(TeamMapper.toDomain)
  }

  async findByFilters(filters: TeamFilters): Promise<Team[]> {
    const where: Prisma.TeamWhereInput = {}

    if (filters.ownerId) {
      where.ownerId = filters.ownerId
    }

    if (filters.memberUserId) {
      where.members = {
        some: { userId: filters.memberUserId },
      }
    }

    const teams = await this.prisma.team.findMany({
      where,
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    })

    return teams.map(TeamMapper.toDomain)
  }

  async update(team: Team): Promise<Team> {
    const updateData = TeamMapper.toPrismaUpdate(team)

    const updated = await this.prisma.team.update({
      where: { id: team.id },
      data: updateData,
      include: { members: true },
    })

    return TeamMapper.toDomain(updated)
  }

  async delete(id: string): Promise<void> {
    await this.prisma.team.delete({
      where: { id },
    })
  }

  async addMember(member: TeamMember): Promise<TeamMember> {
    const memberData = TeamMapper.mapMemberToPrismaCreate(member)

    const created = await this.prisma.teamMember.create({
      data: memberData,
    })

    return TeamMapper.mapMemberToDomain(created)
  }

  async updateMember(member: TeamMember): Promise<TeamMember> {
    const updated = await this.prisma.teamMember.update({
      where: { id: member.id },
      data: {
        name: member.name || null,
        role: TeamMapper.mapRoleToPrisma(member.role),
        permissions: member.permissions,
        joinedAt: member.joinedAt || null,
      },
    })

    return TeamMapper.mapMemberToDomain(updated)
  }

  async removeMember(teamId: string, userId: string): Promise<void> {
    await this.prisma.teamMember.delete({
      where: {
        teamId_userId: { teamId, userId },
      },
    })
  }

  async findMemberByUserId(teamId: string, userId: string): Promise<TeamMember | null> {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId },
      },
    })

    if (!member) return null
    return TeamMapper.mapMemberToDomain(member)
  }

  async findMemberByEmail(teamId: string, email: string): Promise<TeamMember | null> {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_email: { teamId, email },
      },
    })

    if (!member) return null
    return TeamMapper.mapMemberToDomain(member)
  }

  async findPendingInvitationsByEmail(email: string): Promise<TeamMember[]> {
    const members = await this.prisma.teamMember.findMany({
      where: {
        email,
        joinedAt: null,
      },
      orderBy: { invitedAt: 'desc' },
    })

    return members.map(TeamMapper.mapMemberToDomain)
  }

  async findMembersByRole(teamId: string, role: TeamRole): Promise<TeamMember[]> {
    const prismaRole: PrismaTeamRole = TeamMapper.mapRoleToPrisma(role)

    const members = await this.prisma.teamMember.findMany({
      where: {
        teamId,
        role: prismaRole,
      },
    })

    return members.map(TeamMapper.mapMemberToDomain)
  }
}
