'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TeamRole, TeamPermission } from '@/domain/entities/Team'

// Types
interface Team {
  id: string
  name: string
  description: string | null
  ownerId: string
  isOwner: boolean
  memberCount: number
  maxMembers: number
  role: TeamRole
  permissions: TeamPermission[]
  createdAt: string
  updatedAt: string
}

interface TeamMember {
  id: string
  userId: string
  email: string
  name: string | null
  role: TeamRole
  permissions: TeamPermission[]
  invitedBy: string | null
  invitedAt: string
  joinedAt: string | null
  isActive: boolean
  isPending: boolean
}

interface TeamDetails {
  team: Omit<Team, 'isOwner' | 'role' | 'permissions'>
  members: TeamMember[]
  currentUserRole: TeamRole
  currentUserPermissions: TeamPermission[]
}

interface CreateTeamInput {
  name: string
  description?: string
  maxMembers?: number
}

interface UpdateTeamInput {
  name?: string
  description?: string
}

interface InviteMemberInput {
  email: string
  name?: string
  role: TeamRole
  permissions?: TeamPermission[]
}

interface UpdateMemberInput {
  role?: TeamRole
  permissions?: TeamPermission[]
  action?: 'accept'
}

// API functions
async function fetchTeams(): Promise<Team[]> {
  const response = await fetch('/api/teams')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch teams')
  }
  const data = await response.json()
  return data.teams
}

async function fetchTeamDetails(teamId: string): Promise<TeamDetails> {
  const response = await fetch(`/api/teams/${teamId}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch team')
  }
  return response.json()
}

async function fetchTeamMembers(teamId: string): Promise<TeamMember[]> {
  const response = await fetch(`/api/teams/${teamId}/members`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch team members')
  }
  const data = await response.json()
  return data.members
}

async function createTeam(input: CreateTeamInput): Promise<Team> {
  const response = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create team')
  }
  const data = await response.json()
  return data.team
}

async function updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team> {
  const response = await fetch(`/api/teams/${teamId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update team')
  }
  const data = await response.json()
  return data.team
}

async function deleteTeam(teamId: string): Promise<void> {
  const response = await fetch(`/api/teams/${teamId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete team')
  }
}

async function inviteMember(teamId: string, input: InviteMemberInput): Promise<TeamMember> {
  const response = await fetch(`/api/teams/${teamId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to invite member')
  }
  const data = await response.json()
  return data.member
}

async function updateMember(
  teamId: string,
  memberId: string,
  input: UpdateMemberInput
): Promise<TeamMember> {
  const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update member')
  }
  const data = await response.json()
  return data.member
}

async function removeMember(teamId: string, memberId: string): Promise<void> {
  const response = await fetch(`/api/teams/${teamId}/members/${memberId}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to remove member')
  }
}

// Hooks
export function useTeams() {
  return useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })
}

export function useTeam(teamId: string | null) {
  return useQuery({
    queryKey: ['team', teamId],
    queryFn: () => fetchTeamDetails(teamId!),
    enabled: !!teamId,
  })
}

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: ['team-members', teamId],
    queryFn: () => fetchTeamMembers(teamId!),
    enabled: !!teamId,
  })
}

export function useCreateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useUpdateTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, ...input }: UpdateTeamInput & { teamId: string }) =>
      updateTeam(teamId, input),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    },
  })
}

export function useDeleteTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

export function useInviteMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, ...input }: InviteMemberInput & { teamId: string }) =>
      inviteMember(teamId, input),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
    },
  })
}

export function useUpdateMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      teamId,
      memberId,
      ...input
    }: UpdateMemberInput & { teamId: string; memberId: string }) =>
      updateMember(teamId, memberId, input),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
    },
  })
}

export function useRemoveMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      removeMember(teamId, memberId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      queryClient.invalidateQueries({ queryKey: ['team-members', teamId] })
    },
  })
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      updateMember(teamId, memberId, { action: 'accept' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
  })
}

// Export types
export type {
  Team,
  TeamMember,
  TeamDetails,
  CreateTeamInput,
  UpdateTeamInput,
  InviteMemberInput,
  UpdateMemberInput,
}
