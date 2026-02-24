'use client'

import { useQuery } from '@tanstack/react-query'

interface SavingsReport {
  totalSavings: { amount: number; currency: string }
  totalOptimizations: number
  topSavingEvent: {
    campaignId: string
    campaignName: string
    ruleName: string
    estimatedSavings: { amount: number; currency: string }
  } | null
  recentOptimizations: {
    ruleId: string
    ruleName: string
    campaignId: string
    campaignName: string
    actionType: string
    estimatedSavings: { amount: number; currency: string }
    triggeredAt: string
  }[]
}

export function useSavings(options?: { enabled?: boolean }) {
  return useQuery<SavingsReport>({
    queryKey: ['optimization', 'savings'],
    queryFn: async () => {
      const res = await fetch('/api/optimization/savings')
      if (!res.ok) throw new Error('절감 금액 조회 실패')
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5분
    enabled: options?.enabled ?? true,
  })
}
