'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// ============================================================================
// 타입 정의
// ============================================================================

export interface OptimizationRuleResponseDTO {
  id: string
  campaignId: string
  userId: string
  name: string
  ruleType: 'CPA_THRESHOLD' | 'ROAS_FLOOR' | 'BUDGET_PACE' | 'CREATIVE_FATIGUE'
  conditions: { metric: string; operator: string; value: number }[]
  actions: { type: string; params: Record<string, unknown> }[]
  isEnabled: boolean
  lastTriggeredAt: string | null
  triggerCount: number
  cooldownMinutes: number
  createdAt: string
  updatedAt: string
}

export interface CreateOptimizationRuleInput {
  campaignId: string
  name: string
  ruleType: 'CPA_THRESHOLD' | 'ROAS_FLOOR' | 'BUDGET_PACE' | 'CREATIVE_FATIGUE'
  conditions: { metric: string; operator: string; value: number }[]
  actions: { type: string; params?: { percentage?: number; notifyChannel?: string } }[]
  isEnabled?: boolean
  cooldownMinutes?: number
}

export interface UpdateOptimizationRuleInput {
  id: string
  name?: string
  conditions?: { metric: string; operator: string; value: number }[]
  actions?: { type: string; params?: { percentage?: number; notifyChannel?: string } }[]
  isEnabled?: boolean
  cooldownMinutes?: number
}

interface OptimizationRulesResponse {
  rules: OptimizationRuleResponseDTO[]
}

interface OptimizationRulePresetsResponse {
  presets: OptimizationRuleResponseDTO[]
}

// ============================================================================
// 쿼리 키
// ============================================================================

const OPTIMIZATION_RULES_QUERY_KEY = ['optimization-rules'] as const

// ============================================================================
// Fetch 함수
// ============================================================================

async function fetchOptimizationRules(
  campaignId: string
): Promise<OptimizationRulesResponse> {
  const response = await fetch(`/api/optimization-rules?campaignId=${campaignId}`)
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '최적화 규칙 조회 실패')
  }
  return response.json()
}

async function createOptimizationRule(
  input: CreateOptimizationRuleInput
): Promise<OptimizationRuleResponseDTO> {
  const response = await fetch('/api/optimization-rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '최적화 규칙 생성 실패')
  }
  return response.json()
}

async function updateOptimizationRule(
  input: UpdateOptimizationRuleInput
): Promise<OptimizationRuleResponseDTO> {
  const { id, ...data } = input
  const response = await fetch(`/api/optimization-rules/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '최적화 규칙 수정 실패')
  }
  return response.json()
}

async function deleteOptimizationRule(id: string): Promise<void> {
  const response = await fetch(`/api/optimization-rules/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '최적화 규칙 삭제 실패')
  }
}

async function toggleOptimizationRule(input: {
  id: string
  isEnabled: boolean
}): Promise<OptimizationRuleResponseDTO> {
  const { id, isEnabled } = input
  const response = await fetch(`/api/optimization-rules/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isEnabled }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '최적화 규칙 토글 실패')
  }
  return response.json()
}

async function fetchOptimizationRulePresets(
  campaignId: string
): Promise<OptimizationRulePresetsResponse> {
  const response = await fetch(
    `/api/optimization-rules/presets?campaignId=${campaignId}`
  )
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || '최적화 규칙 프리셋 조회 실패')
  }
  return response.json()
}

// ============================================================================
// 훅 정의
// ============================================================================

/** 캠페인의 최적화 규칙 목록 조회 */
export function useOptimizationRules(campaignId?: string) {
  return useQuery({
    queryKey: [...OPTIMIZATION_RULES_QUERY_KEY, campaignId],
    queryFn: () => fetchOptimizationRules(campaignId!),
    enabled: !!campaignId,
    staleTime: 120 * 1000, // 2분
  })
}

/** 최적화 규칙 생성 */
export function useCreateOptimizationRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createOptimizationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPTIMIZATION_RULES_QUERY_KEY })
    },
  })
}

/** 최적화 규칙 수정 */
export function useUpdateOptimizationRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateOptimizationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPTIMIZATION_RULES_QUERY_KEY })
    },
  })
}

/** 최적화 규칙 삭제 */
export function useDeleteOptimizationRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteOptimizationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPTIMIZATION_RULES_QUERY_KEY })
    },
  })
}

/** 최적화 규칙 활성화/비활성화 토글 */
export function useToggleOptimizationRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: toggleOptimizationRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: OPTIMIZATION_RULES_QUERY_KEY })
    },
  })
}

/** 캠페인의 최적화 규칙 프리셋 조회 */
export function useOptimizationRulePresets(campaignId: string) {
  return useQuery({
    queryKey: [...OPTIMIZATION_RULES_QUERY_KEY, 'presets', campaignId],
    queryFn: () => fetchOptimizationRulePresets(campaignId),
    enabled: !!campaignId,
    staleTime: 300 * 1000, // 5분 (프리셋은 거의 변하지 않음)
  })
}
