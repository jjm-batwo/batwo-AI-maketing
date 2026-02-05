/**
 * IPermissionService Port
 *
 * Application service interface for permission checking.
 */

export interface IPermissionService {
  /**
   * Check if a user has a specific permission in a team
   */
  checkPermission(userId: string, teamId: string, permission: string): Promise<boolean>

  /**
   * Get all permissions for a user in a team
   */
  getUserPermissions(userId: string, teamId: string): Promise<string[]>

  /**
   * Get the user's role in a team
   */
  getUserRole(userId: string, teamId: string): Promise<string | null>
}
