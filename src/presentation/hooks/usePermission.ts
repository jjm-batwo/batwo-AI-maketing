/**
 * usePermission Hook
 *
 * Client-side hook for checking user permissions in a team.
 * Uses React Query for caching and automatic refetching.
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

interface UsePermissionOptions {
  teamId?: string
  permission: string
}

interface UsePermissionResult {
  hasPermission: boolean
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

export function usePermission({ teamId, permission }: UsePermissionOptions): UsePermissionResult {
  const { data: session } = useSession()

  const query = useQuery({
    queryKey: ['permission', teamId, permission],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID required')

      const res = await fetch(`/api/permissions/check?teamId=${teamId}&permission=${permission}`)

      if (!res.ok) {
        if (res.status === 401) throw new Error('Not authenticated')
        if (res.status === 403) throw new Error('Permission denied')
        throw new Error('Failed to check permission')
      }

      return res.json() as Promise<{ hasPermission: boolean }>
    },
    enabled: !!session?.user && !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
  })

  return {
    hasPermission: query.data?.hasPermission ?? false,
    isLoading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}

/**
 * Hook to get all user permissions in a team
 */
export function usePermissions(teamId?: string) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['permissions', teamId],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID required')

      const res = await fetch(`/api/permissions?teamId=${teamId}`)

      if (!res.ok) {
        throw new Error('Failed to fetch permissions')
      }

      return res.json() as Promise<{
        permissions: string[]
        role: string | null
      }>
    },
    enabled: !!session?.user && !!teamId,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to get user's role in a team
 */
export function useUserRole(teamId?: string) {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['userRole', teamId],
    queryFn: async () => {
      if (!teamId) throw new Error('Team ID required')

      const res = await fetch(`/api/permissions/role?teamId=${teamId}`)

      if (!res.ok) {
        throw new Error('Failed to fetch role')
      }

      return res.json() as Promise<{ role: string | null }>
    },
    enabled: !!session?.user && !!teamId,
    staleTime: 5 * 60 * 1000,
  })
}
