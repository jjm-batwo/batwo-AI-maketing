'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

interface SyncResult {
  success: boolean
  campaigns: {
    created: number
    updated: number
    archived: number
    total: number
  }
  insights: {
    synced: number
    failed: number
    total: number
  }
  message: string
}

/**
 * Campaign Sync Service
 *
 * Presentation layer service that encapsulates the API call.
 * This follows clean architecture by:
 * - Keeping API details out of the hook
 * - Providing a testable abstraction
 * - Centralizing error handling
 */
class CampaignSyncService {
  async syncWithMeta(): Promise<SyncResult> {
    const response = await fetch('/api/campaigns/sync', {
      method: 'POST',
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Sync failed')
    }

    return response.json()
  }
}

// Singleton instance
const campaignSyncService = new CampaignSyncService()

/**
 * useSync Hook
 *
 * React hook for syncing campaigns and insights from Meta.
 * Uses the service layer to maintain separation of concerns.
 *
 * @returns TanStack Query mutation object with sync functionality
 */
export function useSync() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => campaignSyncService.syncWithMeta(),
    onSuccess: (data) => {
      // Invalidate all related queries to force refetch with fresh data
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'kpi'] })
      queryClient.invalidateQueries({ queryKey: ['kpi-insights'] })

      console.log('[useSync] 동기화 완료:', data.message)
    },
    onError: (error) => {
      console.error('[useSync] 동기화 실패:', error.message)
    },
  })
}
