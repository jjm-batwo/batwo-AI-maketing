'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================================================
// Types
// ============================================================================

interface DomainScore {
  domain: string
  score: number
  weight: number
  evidence: string[]
  recommendations: DomainRecommendation[]
}

interface DomainRecommendation {
  domain: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  recommendation: string
  impact: string
  evidence: string[]
  actionable: boolean
}

interface CompositeScore {
  overall: number
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'
  domainScores: DomainScore[]
  topRecommendations: DomainRecommendation[]
  analyzedDomains: number
  totalDomains: number
  summary: string
}

interface ScienceScoreInput {
  content?: {
    headline?: string
    primaryText?: string
    description?: string
    callToAction?: string
    brand?: string
  }
  context?: {
    industry?: string
    targetAudience?: string
    objective?: 'awareness' | 'consideration' | 'conversion'
    tone?: 'professional' | 'casual' | 'playful' | 'urgent'
    keywords?: string[]
  }
  metrics?: {
    ctr?: number
    cvr?: number
    roas?: number
    cpa?: number
    frequency?: number
  }
  creative?: {
    format?: 'image' | 'video' | 'carousel'
    dominantColors?: string[]
    hasVideo?: boolean
    videoDuration?: number
  }
}

interface ScienceCopyInput {
  productName: string
  productDescription: string
  targetAudience: string
  tone: 'professional' | 'casual' | 'playful' | 'urgent'
  objective: 'awareness' | 'consideration' | 'conversion'
  keywords?: string[]
  variantCount?: number
}

interface ScienceOptimizeInput {
  campaignName: string
  objective: string
  industry?: string
  currentMetrics: {
    ctr: number
    cvr: number
    roas: number
    cpa: number
    impressions?: number
    clicks?: number
    spend?: number
  }
  targetAudience?: {
    ageRange?: string
    gender?: string
    interests?: string[]
    location?: string
  }
  budget?: {
    daily: number
    total?: number
  }
}

interface ScienceScoreResponse {
  score: CompositeScore
}

interface ScienceCopyResponse {
  variants: Array<{
    headline: string
    primaryText: string
    description: string
    callToAction: string
    scienceScore: CompositeScore
    reasoning: string
  }>
  scienceScore: CompositeScore
  knowledgeContext: {
    domainsApplied: string[]
    totalPapers: number
    relevantPapers: number
    confidence: number
  }
  remainingQuota: number
}

interface ScienceOptimizeResponse {
  suggestions: Array<{
    category: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    suggestion: string
    expectedImpact: string
    evidence: string[]
    implementation: string
    scienceBacked: boolean
  }>
  scienceScore: CompositeScore
  knowledgeContext: {
    domainsApplied: string[]
    totalPapers: number
    relevantPapers: number
    confidence: number
  }
  remainingQuota: number
}

interface ScienceAnalyzeResponse {
  compositeScore: CompositeScore
  knowledgeContext: string
  researchFindings?: {
    findings: string[]
    sources: Array<{ title: string; url: string; date: string }>
    relevanceScore: number
    cached: boolean
  }
  remainingQuota: number
}

// ============================================================================
// Query Keys
// ============================================================================

const SCIENCE_SCORE_QUERY_KEY = ['science-score'] as const
const QUOTA_QUERY_KEY = ['quota'] as const

// ============================================================================
// Fetch Functions
// ============================================================================

async function fetchScienceScore(input: ScienceScoreInput): Promise<ScienceScoreResponse> {
  const response = await fetch('/api/ai/science-score', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch science score' }))
    throw new Error(error.message || 'Failed to fetch science score')
  }

  return response.json()
}

async function fetchScienceCopy(input: ScienceCopyInput): Promise<ScienceCopyResponse> {
  const response = await fetch('/api/ai/science-copy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to generate science-backed copy' }))
    throw new Error(error.message || 'Failed to generate science-backed copy')
  }

  return response.json()
}

async function fetchScienceOptimize(input: ScienceOptimizeInput): Promise<ScienceOptimizeResponse> {
  const response = await fetch('/api/ai/science-optimize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to generate optimization suggestions' }))
    throw new Error(error.message || 'Failed to generate optimization suggestions')
  }

  return response.json()
}

async function fetchScienceAnalyze(input: ScienceScoreInput & { includeResearch?: boolean }): Promise<ScienceAnalyzeResponse> {
  const response = await fetch('/api/ai/science-analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to perform science analysis' }))
    throw new Error(error.message || 'Failed to perform science analysis')
  }

  return response.json()
}

// ============================================================================
// Hooks
// ============================================================================

interface UseMarketingIntelligenceOptions {
  scoreInput?: ScienceScoreInput
}

export function useMarketingIntelligence(options: UseMarketingIntelligenceOptions = {}) {
  const queryClient = useQueryClient()

  const scoreQuery = useQuery({
    queryKey: [...SCIENCE_SCORE_QUERY_KEY, options.scoreInput],
    queryFn: () => fetchScienceScore(options.scoreInput!),
    enabled: Boolean(options.scoreInput?.content),
    staleTime: 300_000, // 5 minutes
  })

  const copyMutation = useMutation({
    mutationFn: fetchScienceCopy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTA_QUERY_KEY })
    },
  })

  const optimizeMutation = useMutation({
    mutationFn: fetchScienceOptimize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTA_QUERY_KEY })
    },
  })

  return {
    score: scoreQuery,
    generateCopy: copyMutation,
    optimize: optimizeMutation,
  }
}

export function useScienceScore(input?: ScienceScoreInput) {
  return useQuery({
    queryKey: [...SCIENCE_SCORE_QUERY_KEY, input],
    queryFn: () => fetchScienceScore(input!),
    enabled: Boolean(input?.content),
    staleTime: 300_000, // 5 minutes
  })
}

export function useScienceCopy() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fetchScienceCopy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTA_QUERY_KEY })
    },
  })
}

export function useScienceOptimize() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fetchScienceOptimize,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTA_QUERY_KEY })
    },
  })
}

export function useScienceAnalyze() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: fetchScienceAnalyze,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUOTA_QUERY_KEY })
    },
  })
}
