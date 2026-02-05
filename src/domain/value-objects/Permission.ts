/**
 * Permission Value Object
 *
 * Represents a fine-grained permission in the RBAC system.
 * Format: "resource:action" (e.g., "campaign:create", "member:manage")
 */

export type Resource =
  | 'team'
  | 'member'
  | 'campaign'
  | 'report'
  | 'settings'
  | 'dashboard'

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'

const VALID_RESOURCES: Resource[] = ['team', 'member', 'campaign', 'report', 'settings', 'dashboard']
const VALID_ACTIONS: Action[] = ['create', 'read', 'update', 'delete', 'manage']

export class Permission {
  private constructor(
    private readonly _resource: Resource,
    private readonly _action: Action
  ) {
    Object.freeze(this)
  }

  static create(resource: Resource, action: Action): Permission {
    return new Permission(resource, action)
  }

  static fromString(str: string): Permission {
    const parts = str.split(':')

    if (parts.length !== 2) {
      throw new Error('Invalid permission format. Expected "resource:action"')
    }

    const [resource, action] = parts

    if (!VALID_RESOURCES.includes(resource as Resource)) {
      throw new Error(`Invalid resource: ${resource}`)
    }

    if (!VALID_ACTIONS.includes(action as Action)) {
      throw new Error(`Invalid action: ${action}`)
    }

    return new Permission(resource as Resource, action as Action)
  }

  get resource(): Resource {
    return this._resource
  }

  get action(): Action {
    return this._action
  }

  toString(): string {
    return `${this._resource}:${this._action}`
  }

  equals(other: Permission): boolean {
    return this._resource === other._resource && this._action === other._action
  }

  toJSON(): { resource: Resource; action: Action } {
    return {
      resource: this._resource,
      action: this._action,
    }
  }
}
