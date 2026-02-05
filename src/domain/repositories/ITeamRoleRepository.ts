/**
 * ITeamRoleRepository
 *
 * Repository interface for TeamRole persistence operations.
 * Follows the Repository pattern from Clean Architecture.
 */

import { TeamRoleEntity, TeamRoleName } from '../entities/TeamRole'

export interface ITeamRoleRepository {
  /**
   * Find a role by its unique identifier
   */
  findById(id: string): Promise<TeamRoleEntity | null>

  /**
   * Find a role by its name
   */
  findByName(name: TeamRoleName): Promise<TeamRoleEntity | null>

  /**
   * Find all roles for a specific team
   */
  findByTeamId(teamId: string): Promise<TeamRoleEntity[]>

  /**
   * Save a new role or update an existing one
   */
  save(role: TeamRoleEntity): Promise<TeamRoleEntity>

  /**
   * Delete a role by its identifier
   */
  delete(id: string): Promise<void>

  /**
   * Check if a role exists by name
   */
  existsByName(name: TeamRoleName): Promise<boolean>

  /**
   * Get all available roles
   */
  findAll(): Promise<TeamRoleEntity[]>
}
