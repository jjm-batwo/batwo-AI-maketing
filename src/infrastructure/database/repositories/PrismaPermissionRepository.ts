/**
 * PrismaPermissionRepository
 *
 * IPermissionRepository의 Prisma 구현체.
 */

import { PrismaClient } from '@/generated/prisma'
import type { IPermissionRepository, TeamMemberRecord } from '@domain/repositories/IPermissionRepository'

export class PrismaPermissionRepository implements IPermissionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findTeamMember(teamId: string, userId: string): Promise<TeamMemberRecord | null> {
    const teamMember = await this.prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId, userId } },
    })

    if (!teamMember) return null

    return {
      teamId: teamMember.teamId,
      userId: teamMember.userId,
      role: teamMember.role,
    }
  }
}
