/**
 * IPermissionRepository
 *
 * PermissionService가 팀 멤버 정보를 조회하기 위한 Repository 인터페이스.
 * 기존 PrismaClient 직접 의존을 제거하고, 도메인 레이어 원칙에 맞게 분리.
 */

export interface TeamMemberRecord {
  teamId: string
  userId: string
  role: string
}

export interface IPermissionRepository {
  /**
   * 특정 팀의 멤버 정보를 조회
   */
  findTeamMember(teamId: string, userId: string): Promise<TeamMemberRecord | null>
}
