'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface Campaign {
  id: string
  name: string
  objective: string
  status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  dailyBudget: number
  totalSpent: number
  impressions: number
  clicks: number
  conversions: number
  roas: number
  startDate: string
  endDate?: string
  createdAt: string
}

interface CampaignCreateInput {
  name: string
  objective: string
  targetAudience: {
    ageMin: number
    ageMax: number
    gender: 'ALL' | 'MALE' | 'FEMALE'
    locations: string[]
    interests?: string[]
  }
  dailyBudget: number
  startDate: string
  endDate?: string
}

interface CampaignUpdateInput {
  id: string
  name?: string
  status?: 'ACTIVE' | 'PAUSED'
  dailyBudget?: number
  endDate?: string
}

interface CampaignsResponse {
  campaigns: Campaign[]
  total: number
  page: number
  pageSize: number
}

const CAMPAIGNS_QUERY_KEY = ['campaigns'] as const

async function fetchCampaigns(params?: {
  page?: number
  pageSize?: number
  status?: string
}): Promise<CampaignsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params?.status) searchParams.set('status', params.status)

  const response = await fetch(`/api/campaigns?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch campaigns')
  }
  return response.json()
}

async function fetchCampaign(id: string): Promise<Campaign> {
  const response = await fetch(`/api/campaigns/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch campaign')
  }
  return response.json()
}

async function createCampaign(input: CampaignCreateInput): Promise<Campaign> {
  const response = await fetch('/api/campaigns', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create campaign')
  }
  return response.json()
}

async function updateCampaign(input: CampaignUpdateInput): Promise<Campaign> {
  const { id, ...data } = input
  const response = await fetch(`/api/campaigns/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to update campaign')
  }
  return response.json()
}

async function deleteCampaign(id: string): Promise<void> {
  const response = await fetch(`/api/campaigns/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete campaign')
  }
}

export function useCampaigns(params?: {
  page?: number
  pageSize?: number
  status?: string
  enabled?: boolean
}) {
  const { enabled = true, ...queryParams } = params ?? {}
  return useQuery({
    queryKey: [...CAMPAIGNS_QUERY_KEY, queryParams],
    queryFn: () => fetchCampaigns(queryParams),
    staleTime: 30 * 1000, // 30 seconds
    enabled,
  })
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: [...CAMPAIGNS_QUERY_KEY, id],
    queryFn: () => fetchCampaign(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

export function useCreateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY })
    },
  })
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateCampaign,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY })
      queryClient.setQueryData([...CAMPAIGNS_QUERY_KEY, data.id], data)
    },
  })
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPAIGNS_QUERY_KEY })
    },
  })
}
