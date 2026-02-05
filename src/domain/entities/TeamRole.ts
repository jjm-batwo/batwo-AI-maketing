/**
 * TeamRole Entity
 *
 * Represents a role within a team with associated permissions.
 * Follows RBAC (Role-Based Access Control) pattern.
 */

import { Permission } from '../value-objects/Permission'

export type TeamRoleName = 'owner' | 'admin' | 'editor' | 'viewer'

export interface TeamRoleProps {
  name: TeamRoleName
  permissions: Permission[]
}

interface TeamRoleData extends TeamRoleProps {
  id: string
  createdAt: Date
}

export class TeamRoleEntity {
  private constructor(
    private readonly _id: string,
    private readonly _name: TeamRoleName,
    private readonly _permissions: Permission[],
    private readonly _createdAt: Date
  ) {
    Object.freeze(this)
  }

  static create(props: TeamRoleProps): TeamRoleEntity {
    return new TeamRoleEntity(
      crypto.randomUUID(),
      props.name,
      props.permissions,
      new Date()
    )
  }

  static restore(data: TeamRoleData): TeamRoleEntity {
    return new TeamRoleEntity(
      data.id,
      data.name,
      data.permissions,
      data.createdAt
    )
  }

  // Factory methods for standard roles
  static createOwner(): TeamRoleEntity {
    const permissions = [
      // Team permissions
      Permission.create('team', 'read'),
      Permission.create('team', 'update'),
      Permission.create('team', 'delete'),
      Permission.create('team', 'manage'),

      // Member permissions
      Permission.create('member', 'read'),
      Permission.create('member', 'create'),
      Permission.create('member', 'update'),
      Permission.create('member', 'delete'),
      Permission.create('member', 'manage'),

      // Campaign permissions
      Permission.create('campaign', 'read'),
      Permission.create('campaign', 'create'),
      Permission.create('campaign', 'update'),
      Permission.create('campaign', 'delete'),
      Permission.create('campaign', 'manage'),

      // Report permissions
      Permission.create('report', 'read'),
      Permission.create('report', 'create'),
      Permission.create('report', 'update'),
      Permission.create('report', 'delete'),
      Permission.create('report', 'manage'),

      // Settings permissions
      Permission.create('settings', 'read'),
      Permission.create('settings', 'update'),
      Permission.create('settings', 'manage'),

      // Dashboard permissions
      Permission.create('dashboard', 'read'),
      Permission.create('dashboard', 'manage'),
    ]

    return new TeamRoleEntity(
      crypto.randomUUID(),
      'owner',
      permissions,
      new Date()
    )
  }

  static createAdmin(): TeamRoleEntity {
    const permissions = [
      // Team permissions (no delete)
      Permission.create('team', 'read'),
      Permission.create('team', 'update'),

      // Member permissions (full)
      Permission.create('member', 'read'),
      Permission.create('member', 'create'),
      Permission.create('member', 'update'),
      Permission.create('member', 'delete'),
      Permission.create('member', 'manage'),

      // Campaign permissions (full)
      Permission.create('campaign', 'read'),
      Permission.create('campaign', 'create'),
      Permission.create('campaign', 'update'),
      Permission.create('campaign', 'delete'),

      // Report permissions (full)
      Permission.create('report', 'read'),
      Permission.create('report', 'create'),
      Permission.create('report', 'update'),
      Permission.create('report', 'delete'),

      // Settings permissions (full)
      Permission.create('settings', 'read'),
      Permission.create('settings', 'update'),

      // Dashboard permissions
      Permission.create('dashboard', 'read'),
    ]

    return new TeamRoleEntity(
      crypto.randomUUID(),
      'admin',
      permissions,
      new Date()
    )
  }

  static createEditor(): TeamRoleEntity {
    const permissions = [
      // Campaign permissions (full CRUD)
      Permission.create('campaign', 'read'),
      Permission.create('campaign', 'create'),
      Permission.create('campaign', 'update'),
      Permission.create('campaign', 'delete'),

      // Report permissions (full CRUD)
      Permission.create('report', 'read'),
      Permission.create('report', 'create'),
      Permission.create('report', 'update'),
      Permission.create('report', 'delete'),

      // Dashboard permissions (read-only)
      Permission.create('dashboard', 'read'),
    ]

    return new TeamRoleEntity(
      crypto.randomUUID(),
      'editor',
      permissions,
      new Date()
    )
  }

  static createViewer(): TeamRoleEntity {
    const permissions = [
      // Read-only permissions
      Permission.create('dashboard', 'read'),
      Permission.create('campaign', 'read'),
      Permission.create('report', 'read'),
    ]

    return new TeamRoleEntity(
      crypto.randomUUID(),
      'viewer',
      permissions,
      new Date()
    )
  }

  // Getters
  get id(): string {
    return this._id
  }

  get name(): TeamRoleName {
    return this._name
  }

  get permissions(): Permission[] {
    // Return a copy to maintain immutability
    return [...this._permissions]
  }

  get createdAt(): Date {
    return new Date(this._createdAt)
  }

  // Permission checks
  hasPermission(permission: Permission): boolean {
    return this._permissions.some(p => p.equals(permission))
  }

  /**
   * Determines if this role can manage (assign/change) the target role
   *
   * Rules based on permission matrix:
   * - Owner can manage: Admin, Editor, Viewer (not Owner)
   * - Admin can manage: Editor, Viewer (not Owner, not Admin)
   * - Editor can manage: none
   * - Viewer can manage: none
   */
  canManageRole(targetRole: TeamRoleEntity): boolean {
    // Cannot manage yourself
    if (this._name === targetRole._name) {
      return false
    }

    // Only Owner and Admin have member:manage permission
    // Editor and Viewer cannot manage anyone
    if (this._name === 'editor' || this._name === 'viewer') {
      return false
    }

    // Owner can manage Admin, Editor, Viewer (not Owner)
    if (this._name === 'owner') {
      return targetRole._name !== 'owner'
    }

    // Admin can manage Editor and Viewer (not Owner, not Admin)
    if (this._name === 'admin') {
      return targetRole._name === 'editor' || targetRole._name === 'viewer'
    }

    return false
  }

  // Serialization
  toJSON(): TeamRoleData {
    return {
      id: this._id,
      name: this._name,
      permissions: this._permissions.map(p => p),
      createdAt: this._createdAt,
    }
  }
}
