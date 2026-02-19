'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface CampaignAllocation {
  campaignId: string
  campaignName: string
  objective: string
  currentBudget: number
  recommendedBudget: number
  changePercent: number
  metrics: {
    roas: number
    cpa: number
    marginalROAS: number
  }
  reasoning: string
}

export interface PortfolioExpectedImpact {
  currentTotalROAS: number
  projectedTotalROAS: number
  improvement: number
}

export interface PortfolioAnalysis {
  totalBudget: number
  allocations: CampaignAllocation[]
  expectedImpact: PortfolioExpectedImpact
  efficiencyScore: number
  diversificationScore: number
  recommendations: string[]
}

export interface SimulationComparison {
  currentBudget: number
  newBudget: number
  budgetChange: number
  budgetChangePercent: number
}

export interface SimulationResult {
  totalBudget: number
  allocations: CampaignAllocation[]
  expectedImpact: PortfolioExpectedImpact
  comparison: SimulationComparison
}

const PORTFOLIO_QUERY_KEY = ['portfolio', 'analysis'] as const

async function fetchPortfolioAnalysis(): Promise<PortfolioAnalysis> {
  const response = await fetch('/api/ai/portfolio')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch portfolio analysis')
  }
  const json = await response.json()
  return json.data
}

async function simulatePortfolio(totalBudget: number): Promise<SimulationResult> {
  const response = await fetch('/api/ai/portfolio', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ totalBudget }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to simulate portfolio')
  }
  const json = await response.json()
  return json.data
}

export function usePortfolioAnalysis() {
  return useQuery({
    queryKey: PORTFOLIO_QUERY_KEY,
    queryFn: fetchPortfolioAnalysis,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function usePortfolioSimulation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: simulatePortfolio,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_QUERY_KEY })
    },
  })
}
