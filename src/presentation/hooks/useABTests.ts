'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ABTestVariant {
  id: string
  name: string
  description?: string
  trafficPercent: number
  impressions: number
  clicks: number
  conversions: number
  spend: number
  revenue: number
  isControl: boolean
  ctr?: number
  conversionRate: number
}

export interface StatisticalResult {
  winner: { id: string; name: string } | null
  isSignificant: boolean
  confidence: number
  uplift: number
  pValue: number
}

export interface ABTest {
  id: string
  campaignId: string
  name: string
  description?: string
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED'
  variants: ABTestVariant[]
  startDate: string
  endDate: string | null
  confidenceLevel: number
  minimumSampleSize: number
  statisticalResult: StatisticalResult
  createdAt: string
  updatedAt: string
}

export interface ABTestsResponse {
  abTests: ABTest[]
  count: number
}

export interface CreateABTestInput {
  campaignId: string
  name: string
  description?: string
  variants: {
    name: string
    description?: string
    trafficPercent: number
    isControl: boolean
  }[]
  startDate?: string
  confidenceLevel?: number
  minimumSampleSize?: number
}

const AB_TESTS_QUERY_KEY = ['ab-tests'] as const

async function fetchABTests(campaignId?: string): Promise<ABTestsResponse> {
  const url = campaignId
    ? `/api/ab-tests?campaignId=${campaignId}`
    : '/api/ab-tests'
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('A/B 테스트 목록을 불러오는데 실패했습니다')
  }
  return response.json()
}

async function fetchABTest(id: string): Promise<{ abTest: ABTest }> {
  const response = await fetch(`/api/ab-tests/${id}`)
  if (!response.ok) {
    throw new Error('A/B 테스트를 불러오는데 실패했습니다')
  }
  return response.json()
}

async function createABTest(input: CreateABTestInput): Promise<{ abTest: ABTest }> {
  const response = await fetch('/api/ab-tests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'A/B 테스트 생성에 실패했습니다')
  }
  return response.json()
}

async function updateABTestAction(
  id: string,
  action: 'start' | 'pause' | 'complete'
): Promise<{ abTest: ABTest }> {
  const response = await fetch(`/api/ab-tests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'A/B 테스트 업데이트에 실패했습니다')
  }
  return response.json()
}

async function deleteABTest(id: string): Promise<void> {
  const response = await fetch(`/api/ab-tests/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'A/B 테스트 삭제에 실패했습니다')
  }
}

/**
 * A/B 테스트 목록 조회 훅
 */
export function useABTests(campaignId?: string) {
  return useQuery({
    queryKey: campaignId ? [...AB_TESTS_QUERY_KEY, campaignId] : AB_TESTS_QUERY_KEY,
    queryFn: () => fetchABTests(campaignId),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * 단일 A/B 테스트 조회 훅
 */
export function useABTest(id: string) {
  return useQuery({
    queryKey: [...AB_TESTS_QUERY_KEY, id],
    queryFn: () => fetchABTest(id),
    staleTime: 5 * 60 * 1000,
    enabled: !!id,
  })
}

/**
 * A/B 테스트 생성 훅
 */
export function useCreateABTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createABTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AB_TESTS_QUERY_KEY })
    },
  })
}

/**
 * A/B 테스트 상태 변경 훅
 */
export function useUpdateABTestAction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'start' | 'pause' | 'complete' }) =>
      updateABTestAction(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AB_TESTS_QUERY_KEY })
    },
  })
}

/**
 * A/B 테스트 삭제 훅
 */
export function useDeleteABTest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteABTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AB_TESTS_QUERY_KEY })
    },
  })
}
