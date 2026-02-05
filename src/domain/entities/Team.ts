/**
 * Team Domain Entity
 *
 * Represents a team that can collaborate on campaigns and share resources.
 * Teams have owners (the creator) and members with different roles.
 */

export type TeamRoleType = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

// Backward compatibility alias - deprecated, use TeamRoleType
/** @deprecated Use TeamRoleType instead */
export type TeamRole = TeamRoleType

export type TeamPermission =
  | 'campaign:read'
  | 'campaign:write'
  | 'campaign:delete'
  | 'report:read'
  | 'report:write'
  | 'analytics:read'
  | 'team:invite'
  | 'team:manage'
  | 'settings:read'
  | 'settings:write'
  | 'billing:read'
  | 'billing:manage'

/**
 * Default permissions for each role
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<TeamRoleType, TeamPermission[]> = {
  OWNER: [
    'campaign:read',
    'campaign:write',
    'campaign:delete',
    'report:read',
    'report:write',
    'analytics:read',
    'team:invite',
    'team:manage',
    'settings:read',
    'settings:write',
    'billing:read',
    'billing:manage',
  ],
  ADMIN: [
    'campaign:read',
    'campaign:write',
    'campaign:delete',
    'report:read',
    'report:write',
    'analytics:read',
    'team:invite',
    'team:manage',
    'settings:read',
    'settings:write',
  ],
  MEMBER: [
    'campaign:read',
    'campaign:write',
    'report:read',
    'report:write',
    'analytics:read',
  ],
  VIEWER: ['campaign:read', 'report:read', 'analytics:read'],
}

export interface TeamMemberProps {
  id: string
  teamId: string
  userId: string
  email: string
  name?: string
  role: TeamRoleType
  permissions: TeamPermission[]
  invitedBy?: string
  invitedAt: Date
  joinedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateTeamMemberProps {
  teamId: string
  userId: string
  email: string
  name?: string
  role: TeamRoleType
  permissions?: TeamPermission[]
  invitedBy?: string
}

export class TeamMember {
  private constructor(private readonly props: TeamMemberProps) {}

  static create(props: CreateTeamMemberProps): TeamMember {
    const now = new Date()
    const permissions = props.permissions || DEFAULT_ROLE_PERMISSIONS[props.role]

    return new TeamMember({
      id: crypto.randomUUID(),
      teamId: props.teamId,
      userId: props.userId,
      email: props.email,
      name: props.name,
      role: props.role,
      permissions,
      invitedBy: props.invitedBy,
      invitedAt: now,
      joinedAt: undefined,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstruct(props: TeamMemberProps): TeamMember {
    return new TeamMember(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get teamId(): string {
    return this.props.teamId
  }

  get userId(): string {
    return this.props.userId
  }

  get email(): string {
    return this.props.email
  }

  get name(): string | undefined {
    return this.props.name
  }

  get role(): TeamRole {
    return this.props.role
  }

  get permissions(): TeamPermission[] {
    return [...this.props.permissions]
  }

  get invitedBy(): string | undefined {
    return this.props.invitedBy
  }

  get invitedAt(): Date {
    return this.props.invitedAt
  }

  get joinedAt(): Date | undefined {
    return this.props.joinedAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get isActive(): boolean {
    return this.props.joinedAt !== undefined
  }

  get isPending(): boolean {
    return this.props.joinedAt === undefined
  }

  // Permission checks
  hasPermission(permission: TeamPermission): boolean {
    return this.props.permissions.includes(permission)
  }

  hasAnyPermission(permissions: TeamPermission[]): boolean {
    return permissions.some((p) => this.props.permissions.includes(p))
  }

  hasAllPermissions(permissions: TeamPermission[]): boolean {
    return permissions.every((p) => this.props.permissions.includes(p))
  }

  canManageTeam(): boolean {
    return this.hasPermission('team:manage')
  }

  canInviteMembers(): boolean {
    return this.hasPermission('team:invite')
  }

  canManageCampaigns(): boolean {
    return this.hasPermission('campaign:write')
  }

  canDeleteCampaigns(): boolean {
    return this.hasPermission('campaign:delete')
  }

  canManageBilling(): boolean {
    return this.hasPermission('billing:manage')
  }

  // Mutation methods (return new instance)
  updateRole(role: TeamRoleType, customPermissions?: TeamPermission[]): TeamMember {
    const permissions = customPermissions || DEFAULT_ROLE_PERMISSIONS[role]
    return new TeamMember({
      ...this.props,
      role,
      permissions,
      updatedAt: new Date(),
    })
  }

  updatePermissions(permissions: TeamPermission[]): TeamMember {
    return new TeamMember({
      ...this.props,
      permissions,
      updatedAt: new Date(),
    })
  }

  addPermission(permission: TeamPermission): TeamMember {
    if (this.props.permissions.includes(permission)) {
      return this
    }
    return new TeamMember({
      ...this.props,
      permissions: [...this.props.permissions, permission],
      updatedAt: new Date(),
    })
  }

  removePermission(permission: TeamPermission): TeamMember {
    if (!this.props.permissions.includes(permission)) {
      return this
    }
    return new TeamMember({
      ...this.props,
      permissions: this.props.permissions.filter((p) => p !== permission),
      updatedAt: new Date(),
    })
  }

  acceptInvitation(): TeamMember {
    if (this.props.joinedAt) {
      return this
    }
    return new TeamMember({
      ...this.props,
      joinedAt: new Date(),
      updatedAt: new Date(),
    })
  }

  updateName(name: string): TeamMember {
    return new TeamMember({
      ...this.props,
      name,
      updatedAt: new Date(),
    })
  }

  // Serialization
  toJSON(): TeamMemberProps {
    return { ...this.props }
  }
}

export interface TeamProps {
  id: string
  name: string
  description?: string
  ownerId: string
  members: TeamMember[]
  maxMembers: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateTeamProps {
  name: string
  description?: string
  ownerId: string
  ownerEmail: string
  ownerName?: string
  maxMembers?: number
}

export class Team {
  private constructor(private readonly props: TeamProps) {}

  static create(props: CreateTeamProps): Team {
    const now = new Date()
    const teamId = crypto.randomUUID()

    // Create owner as the first member
    const owner = TeamMember.create({
      teamId,
      userId: props.ownerId,
      email: props.ownerEmail,
      name: props.ownerName,
      role: 'OWNER',
    }).acceptInvitation()

    return new Team({
      id: teamId,
      name: props.name,
      description: props.description,
      ownerId: props.ownerId,
      members: [owner],
      maxMembers: props.maxMembers || 10,
      createdAt: now,
      updatedAt: now,
    })
  }

  static reconstruct(props: TeamProps): Team {
    return new Team(props)
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get name(): string {
    return this.props.name
  }

  get description(): string | undefined {
    return this.props.description
  }

  get ownerId(): string {
    return this.props.ownerId
  }

  get members(): TeamMember[] {
    return [...this.props.members]
  }

  get maxMembers(): number {
    return this.props.maxMembers
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  // Member queries
  get activeMembers(): TeamMember[] {
    return this.props.members.filter((m) => m.isActive)
  }

  get pendingInvitations(): TeamMember[] {
    return this.props.members.filter((m) => m.isPending)
  }

  get memberCount(): number {
    return this.activeMembers.length
  }

  get isFull(): boolean {
    return this.memberCount >= this.props.maxMembers
  }

  getMember(userId: string): TeamMember | undefined {
    return this.props.members.find((m) => m.userId === userId)
  }

  getMemberByEmail(email: string): TeamMember | undefined {
    return this.props.members.find((m) => m.email === email)
  }

  getOwner(): TeamMember {
    const owner = this.props.members.find((m) => m.role === 'OWNER')
    if (!owner) {
      throw new Error('Team must have an owner')
    }
    return owner
  }

  getAdmins(): TeamMember[] {
    return this.props.members.filter((m) => m.role === 'ADMIN')
  }

  isMember(userId: string): boolean {
    return this.props.members.some((m) => m.userId === userId && m.isActive)
  }

  isOwner(userId: string): boolean {
    return this.props.ownerId === userId
  }

  // Permission checks
  canUserManageTeam(userId: string): boolean {
    const member = this.getMember(userId)
    return member?.canManageTeam() || false
  }

  canUserInviteMembers(userId: string): boolean {
    const member = this.getMember(userId)
    return member?.canInviteMembers() || false
  }

  getUserPermissions(userId: string): TeamPermission[] {
    const member = this.getMember(userId)
    return member?.permissions || []
  }

  // Mutation methods (return new instance)
  updateName(name: string): Team {
    return new Team({
      ...this.props,
      name,
      updatedAt: new Date(),
    })
  }

  updateDescription(description: string): Team {
    return new Team({
      ...this.props,
      description,
      updatedAt: new Date(),
    })
  }

  inviteMember(props: {
    userId: string
    email: string
    name?: string
    role: TeamRoleType
    invitedBy: string
    permissions?: TeamPermission[]
  }): { team: Team; member: TeamMember } {
    // Check if already a member
    if (this.getMemberByEmail(props.email)) {
      throw new Error('User is already a member or has pending invitation')
    }

    // Check if team is full
    if (this.isFull) {
      throw new Error(`Team has reached maximum capacity (${this.maxMembers} members)`)
    }

    // Cannot invite as OWNER
    if (props.role === 'OWNER') {
      throw new Error('Cannot invite as owner')
    }

    const newMember = TeamMember.create({
      teamId: this.props.id,
      userId: props.userId,
      email: props.email,
      name: props.name,
      role: props.role,
      permissions: props.permissions,
      invitedBy: props.invitedBy,
    })

    const team = new Team({
      ...this.props,
      members: [...this.props.members, newMember],
      updatedAt: new Date(),
    })

    return { team, member: newMember }
  }

  removeMember(userId: string): Team {
    // Cannot remove owner
    if (this.isOwner(userId)) {
      throw new Error('Cannot remove team owner')
    }

    const member = this.getMember(userId)
    if (!member) {
      throw new Error('Member not found')
    }

    return new Team({
      ...this.props,
      members: this.props.members.filter((m) => m.userId !== userId),
      updatedAt: new Date(),
    })
  }

  updateMemberRole(userId: string, role: TeamRoleType, permissions?: TeamPermission[]): Team {
    // Cannot change owner's role
    if (this.isOwner(userId)) {
      throw new Error('Cannot change owner role')
    }

    // Cannot promote to owner
    if (role === 'OWNER') {
      throw new Error('Cannot promote to owner')
    }

    const memberIndex = this.props.members.findIndex((m) => m.userId === userId)
    if (memberIndex === -1) {
      throw new Error('Member not found')
    }

    const updatedMember = this.props.members[memberIndex].updateRole(role, permissions)
    const updatedMembers = [...this.props.members]
    updatedMembers[memberIndex] = updatedMember

    return new Team({
      ...this.props,
      members: updatedMembers,
      updatedAt: new Date(),
    })
  }

  acceptInvitation(userId: string): Team {
    const memberIndex = this.props.members.findIndex((m) => m.userId === userId)
    if (memberIndex === -1) {
      throw new Error('Invitation not found')
    }

    if (this.props.members[memberIndex].isActive) {
      throw new Error('Member is already active')
    }

    const updatedMember = this.props.members[memberIndex].acceptInvitation()
    const updatedMembers = [...this.props.members]
    updatedMembers[memberIndex] = updatedMember

    return new Team({
      ...this.props,
      members: updatedMembers,
      updatedAt: new Date(),
    })
  }

  transferOwnership(newOwnerId: string): Team {
    const newOwner = this.getMember(newOwnerId)
    if (!newOwner) {
      throw new Error('New owner must be a team member')
    }

    if (!newOwner.isActive) {
      throw new Error('New owner must be an active member')
    }

    // Demote current owner to admin
    const currentOwnerIndex = this.props.members.findIndex((m) => m.userId === this.props.ownerId)
    const newOwnerIndex = this.props.members.findIndex((m) => m.userId === newOwnerId)

    const updatedMembers = [...this.props.members]
    updatedMembers[currentOwnerIndex] = updatedMembers[currentOwnerIndex].updateRole('ADMIN')
    updatedMembers[newOwnerIndex] = updatedMembers[newOwnerIndex].updateRole('OWNER')

    return new Team({
      ...this.props,
      ownerId: newOwnerId,
      members: updatedMembers,
      updatedAt: new Date(),
    })
  }

  // Serialization
  toJSON(): Omit<TeamProps, 'members'> & { members: TeamMemberProps[] } {
    return {
      id: this.props.id,
      name: this.props.name,
      description: this.props.description,
      ownerId: this.props.ownerId,
      members: this.props.members.map((m) => m.toJSON()),
      maxMembers: this.props.maxMembers,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
    }
  }
}
