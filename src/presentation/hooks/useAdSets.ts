'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface AdSet {
  id: string
  campaignId: string
  name: string
  status: string
  dailyBudget?: number
  startDate: string
  endDate?: string
}

interface CreateAdSetInput {
  campaignId: string
  name: string
  dailyBudget?: number
  billingEvent?: string
  optimizationGoal?: string
  bidStrategy?: string
  startDate: string
  endDate?: string
}

async function fetchAdSets(campaignId: string): Promise<{ adSets: AdSet[] }> {
  const response = await fetch(`/api/campaigns/${campaignId}/adsets`)
  if (!response.ok) throw new Error('광고 세트 조회에 실패했습니다')
  return response.json()
}

async function createAdSet(input: CreateAdSetInput): Promise<AdSet> {
  const { campaignId, ...body } = input
  const response = await fetch(`/api/campaigns/${campaignId}/adsets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || error.error || '광고 세트 생성에 실패했습니다')
  }
  return response.json()
}

export function useAdSets(campaignId: string) {
  return useQuery({
    queryKey: ['adsets', campaignId],
    queryFn: () => fetchAdSets(campaignId),
    enabled: !!campaignId,
    staleTime: 60 * 1000,
  })
}

export function useCreateAdSet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createAdSet,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adsets', variables.campaignId] })
    },
  })
}
