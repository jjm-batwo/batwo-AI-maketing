'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { BudgetStatus } from '@/presentation/components/campaign/BudgetAlertBadge'

interface BudgetStatusResponse {
  status: BudgetStatus
  spendPercent: number
  shouldAlert: boolean
  thresholdPercent?: number
  isEnabled?: boolean
}

interface BudgetAlertSettings {
  campaignId: string
  thresholdPercent: number
  isEnabled: boolean
}

interface CreateAlertInput {
  campaignId: string
  thresholdPercent: number
}

interface UpdateAlertInput {
  campaignId: string
  thresholdPercent?: number
  isEnabled?: boolean
}

/**
 * 캠페인의 예산 상태 조회 훅
 */
export function useBudgetStatus(campaignId: string, dailyBudget: number) {
  return useQuery({
    queryKey: ['budgetStatus', campaignId],
    queryFn: async (): Promise<BudgetStatusResponse> => {
      const response = await fetch(
        `/api/campaigns/${campaignId}/budget-status?dailyBudget=${dailyBudget}`
      )
      if (!response.ok) {
        throw new Error('예산 상태를 불러오는데 실패했습니다')
      }
      return response.json()
    },
    enabled: !!campaignId && dailyBudget > 0,
    refetchInterval: 60000, // 1분마다 갱신
  })
}

/**
 * 캠페인의 예산 알림 설정 조회 훅
 */
export function useBudgetAlert(campaignId: string) {
  return useQuery({
    queryKey: ['budgetAlert', campaignId],
    queryFn: async (): Promise<BudgetAlertSettings | null> => {
      const response = await fetch(`/api/campaigns/${campaignId}/budget-alert`)
      if (response.status === 404) {
        return null
      }
      if (!response.ok) {
        throw new Error('예산 알림 설정을 불러오는데 실패했습니다')
      }
      return response.json()
    },
    enabled: !!campaignId,
  })
}

/**
 * 예산 알림 관리 훅 (생성, 업데이트, 삭제)
 */
export function useBudgetAlertMutations() {
  const queryClient = useQueryClient()

  const createAlert = useMutation({
    mutationFn: async (input: CreateAlertInput) => {
      const response = await fetch(`/api/campaigns/${input.campaignId}/budget-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thresholdPercent: input.thresholdPercent,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '예산 알림 생성에 실패했습니다')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgetAlert', variables.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['budgetStatus', variables.campaignId] })
    },
  })

  const updateAlert = useMutation({
    mutationFn: async (input: UpdateAlertInput) => {
      const response = await fetch(`/api/campaigns/${input.campaignId}/budget-alert`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thresholdPercent: input.thresholdPercent,
          isEnabled: input.isEnabled,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '예산 알림 수정에 실패했습니다')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgetAlert', variables.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['budgetStatus', variables.campaignId] })
    },
  })

  const deleteAlert = useMutation({
    mutationFn: async (campaignId: string) => {
      const response = await fetch(`/api/campaigns/${campaignId}/budget-alert`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '예산 알림 삭제에 실패했습니다')
      }
    },
    onSuccess: (_, campaignId) => {
      queryClient.invalidateQueries({ queryKey: ['budgetAlert', campaignId] })
      queryClient.invalidateQueries({ queryKey: ['budgetStatus', campaignId] })
    },
  })

  const toggleAlert = useMutation({
    mutationFn: async ({ campaignId, isEnabled }: { campaignId: string; isEnabled: boolean }) => {
      const response = await fetch(`/api/campaigns/${campaignId}/budget-alert`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '예산 알림 토글에 실패했습니다')
      }
      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budgetAlert', variables.campaignId] })
      queryClient.invalidateQueries({ queryKey: ['budgetStatus', variables.campaignId] })
    },
  })

  return {
    createAlert: createAlert.mutate,
    createAlertAsync: createAlert.mutateAsync,
    isCreating: createAlert.isPending,
    createError: createAlert.error,

    updateAlert: updateAlert.mutate,
    updateAlertAsync: updateAlert.mutateAsync,
    isUpdating: updateAlert.isPending,
    updateError: updateAlert.error,

    deleteAlert: deleteAlert.mutate,
    deleteAlertAsync: deleteAlert.mutateAsync,
    isDeleting: deleteAlert.isPending,
    deleteError: deleteAlert.error,

    toggleAlert: toggleAlert.mutate,
    toggleAlertAsync: toggleAlert.mutateAsync,
    isToggling: toggleAlert.isPending,
    toggleError: toggleAlert.error,

    isLoading: createAlert.isPending || updateAlert.isPending || deleteAlert.isPending || toggleAlert.isPending,
  }
}
