'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CampaignDTO } from '@application/dto/campaign/CampaignDTO'

interface UpdateCampaignInput {
  campaignId: string
  name?: string
  dailyBudget?: number
  currency?: string
  startDate?: string
  endDate?: string | null
  targetAudience?: {
    ageMin?: number
    ageMax?: number
    gender?: 'ALL' | 'MALE' | 'FEMALE'
    locations?: string[]
    interests?: string[]
  }
}

interface StatusChangeInput {
  campaignId: string
  action: 'pause' | 'resume'
}

async function updateCampaign(input: UpdateCampaignInput): Promise<CampaignDTO> {
  const response = await fetch(`/api/campaigns/${input.campaignId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.name,
      dailyBudget: input.dailyBudget,
      currency: input.currency,
      startDate: input.startDate,
      endDate: input.endDate,
      targetAudience: input.targetAudience,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update campaign')
  }

  return response.json()
}

async function changeCampaignStatus(input: StatusChangeInput): Promise<CampaignDTO> {
  const response = await fetch(`/api/campaigns/${input.campaignId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: input.action }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to change campaign status')
  }

  return response.json()
}

export function useCampaignMutations() {
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: updateCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] })
    },
  })

  const pauseMutation = useMutation({
    mutationFn: (campaignId: string) =>
      changeCampaignStatus({ campaignId, action: 'pause' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] })
    },
  })

  const resumeMutation = useMutation({
    mutationFn: (campaignId: string) =>
      changeCampaignStatus({ campaignId, action: 'resume' }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['campaign', data.id] })
    },
  })

  return {
    updateCampaign: updateMutation.mutate,
    updateCampaignAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    pauseCampaign: pauseMutation.mutate,
    pauseCampaignAsync: pauseMutation.mutateAsync,
    isPausing: pauseMutation.isPending,
    pauseError: pauseMutation.error,

    resumeCampaign: resumeMutation.mutate,
    resumeCampaignAsync: resumeMutation.mutateAsync,
    isResuming: resumeMutation.isPending,
    resumeError: resumeMutation.error,

    isLoading: updateMutation.isPending || pauseMutation.isPending || resumeMutation.isPending,
  }
}
