import { Team, TeamMember, TeamRole } from '../entities/Team'

export interface TeamFilters {
  ownerId?: string
  memberUserId?: string
}

export interface ITeamRepository {
  /**
   * Save a new team or update existing one
   */
  save(team: Team): Promise<Team>

  /**
   * Find team by ID with all members
   */
  findById(id: string): Promise<Team | null>

  /**
   * Find teams owned by a user
   */
  findByOwnerId(ownerId: string): Promise<Team[]>

  /**
   * Find teams where user is a member (including owner)
   */
  findByMemberUserId(userId: string): Promise<Team[]>

  /**
   * Find teams matching filters
   */
  findByFilters(filters: TeamFilters): Promise<Team[]>

  /**
   * Update team information (name, description, etc.)
   */
  update(team: Team): Promise<Team>

  /**
   * Delete team and all its members
   */
  delete(id: string): Promise<void>

  /**
   * Add a member to a team
   */
  addMember(member: TeamMember): Promise<TeamMember>

  /**
   * Update a team member (role, permissions, etc.)
   */
  updateMember(member: TeamMember): Promise<TeamMember>

  /**
   * Remove a member from a team
   */
  removeMember(teamId: string, userId: string): Promise<void>

  /**
   * Find team member by user ID
   */
  findMemberByUserId(teamId: string, userId: string): Promise<TeamMember | null>

  /**
   * Find team member by email (for invitation)
   */
  findMemberByEmail(teamId: string, email: string): Promise<TeamMember | null>

  /**
   * Get all pending invitations for a user by email
   */
  findPendingInvitationsByEmail(email: string): Promise<TeamMember[]>

  /**
   * Get team members by role
   */
  findMembersByRole(teamId: string, role: TeamRole): Promise<TeamMember[]>
}
