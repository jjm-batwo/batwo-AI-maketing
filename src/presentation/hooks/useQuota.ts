'use client'

import { useQuery } from '@tanstack/react-query'
import type { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import type { QuotaLimits } from '@application/dto/quota/QuotaStatusDTO'

interface QuotaItem {
  used: number
  limit: number
  remaining: number
  period: 'day' | 'week'
}

interface QuotaUsage {
  campaigns: QuotaItem
  aiCopyGen: QuotaItem
  aiAnalysis: QuotaItem
}

interface TrialStatus {
  isInTrial: boolean
  daysRemaining: number
}

interface QuotaResponse {
  usage: QuotaUsage
  plan: SubscriptionPlan
  trial: TrialStatus
  resetDates: {
    weekly: string
    daily: string
  }
  limits: QuotaLimits
}

const QUOTA_QUERY_KEY = ['quota'] as const

async function fetchQuota(): Promise<QuotaResponse> {
  const response = await fetch('/api/quota')
  if (!response.ok) {
    throw new Error('Failed to fetch quota')
  }
  return response.json()
}

export function useQuota() {
  return useQuery({
    queryKey: QUOTA_QUERY_KEY,
    queryFn: fetchQuota,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  })
}

export function useQuotaCheck(type: keyof QuotaUsage) {
  const { data, ...rest } = useQuota()

  const quota = data?.usage[type]
  const isExceeded = quota ? quota.used >= quota.limit : false
  const remaining = quota ? quota.remaining : 0
  const percentage = quota ? Math.round((quota.used / quota.limit) * 100) : 0

  return {
    quota,
    isExceeded,
    remaining,
    percentage,
    plan: data?.plan,
    trial: data?.trial,
    ...rest,
  }
}

export function useCampaignQuota() {
  return useQuotaCheck('campaigns')
}

export function useAiCopyGenQuota() {
  return useQuotaCheck('aiCopyGen')
}

export function useAiAnalysisQuota() {
  return useQuotaCheck('aiAnalysis')
}
