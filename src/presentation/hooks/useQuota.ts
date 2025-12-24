'use client'

import { useQuery } from '@tanstack/react-query'

interface QuotaUsage {
  campaigns: {
    used: number
    limit: number
    period: 'monthly'
  }
  aiReports: {
    used: number
    limit: number
    period: 'monthly'
  }
  apiCalls: {
    used: number
    limit: number
    period: 'daily'
  }
  adSpend: {
    used: number
    limit: number
    period: 'monthly'
  }
}

interface QuotaResponse {
  usage: QuotaUsage
  plan: 'FREE' | 'BASIC' | 'PRO' | 'ENTERPRISE'
  resetDates: {
    monthly: string
    daily: string
  }
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
  const remaining = quota ? quota.limit - quota.used : 0
  const percentage = quota ? Math.round((quota.used / quota.limit) * 100) : 0

  return {
    quota,
    isExceeded,
    remaining,
    percentage,
    plan: data?.plan,
    ...rest,
  }
}

export function useCampaignQuota() {
  return useQuotaCheck('campaigns')
}

export function useAiReportQuota() {
  return useQuotaCheck('aiReports')
}

export function useApiCallQuota() {
  return useQuotaCheck('apiCalls')
}

export function useAdSpendQuota() {
  return useQuotaCheck('adSpend')
}
