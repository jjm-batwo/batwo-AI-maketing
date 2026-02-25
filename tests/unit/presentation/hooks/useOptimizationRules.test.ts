import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// ============================================================================
// Mock Setup
// ============================================================================

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function createMockResponse(data: unknown, status = 200, ok = true) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

// ============================================================================
// Test Imports (after mocks)
// ============================================================================

import {
  useOptimizationRules,
  useCreateOptimizationRule,
  useUpdateOptimizationRule,
  useDeleteOptimizationRule,
  useToggleOptimizationRule,
  useOptimizationRulePresets,
} from '@presentation/hooks/useOptimizationRules'

// ============================================================================
// Fixtures
// ============================================================================

const mockRule = {
  id: 'rule-001',
  campaignId: 'camp-001',
  userId: 'user-001',
  name: 'CPA 임계값 규칙',
  ruleType: 'CPA_THRESHOLD' as const,
  conditions: [{ metric: 'cpa', operator: 'gt', value: 10000 }],
  actions: [{ type: 'PAUSE_AD', params: {} }],
  isEnabled: true,
  lastTriggeredAt: null,
  triggerCount: 0,
  cooldownMinutes: 60,
  createdAt: '2026-02-25T00:00:00.000Z',
  updatedAt: '2026-02-25T00:00:00.000Z',
}

const mockPreset = {
  id: 'preset-001',
  campaignId: 'camp-001',
  userId: 'user-001',
  name: 'ROAS 바닥 프리셋',
  ruleType: 'ROAS_FLOOR' as const,
  conditions: [{ metric: 'roas', operator: 'lt', value: 2.0 }],
  actions: [{ type: 'REDUCE_BUDGET', params: { percentage: 20 } }],
  isEnabled: false,
  lastTriggeredAt: null,
  triggerCount: 0,
  cooldownMinutes: 30,
  createdAt: '2026-02-25T00:00:00.000Z',
  updatedAt: '2026-02-25T00:00:00.000Z',
}

// ============================================================================
// Tests: useOptimizationRules
// ============================================================================

describe('useOptimizationRules', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_fetch_rules_on_mount_when_campaignId_provided', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ rules: [mockRule] })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useOptimizationRules('camp-001'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith('/api/optimization-rules?campaignId=camp-001')
    expect(result.current.data?.rules).toHaveLength(1)
    expect(result.current.data?.rules[0].name).toBe('CPA 임계값 규칙')
  })

  it('should_not_fetch_when_no_campaignId_provided', async () => {
    const wrapper = createWrapper()
    renderHook(() => useOptimizationRules(), { wrapper })

    // campaignId 없으면 쿼리가 비활성화됨
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should_return_empty_rules_list_when_api_returns_empty', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ rules: [] })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useOptimizationRules('camp-001'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.rules).toHaveLength(0)
  })

  it('should_handle_api_error_when_fetch_fails', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ error: '규칙 조회 실패' }, 500, false)
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useOptimizationRules('camp-001'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })

  it('should_show_loading_state_initially', async () => {
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(
      pendingPromise.then(() => createMockResponse({ rules: [mockRule] }))
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useOptimizationRules('camp-001'), { wrapper })

    expect(result.current.isLoading).toBe(true)

    resolvePromise!(undefined)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

// ============================================================================
// Tests: useCreateOptimizationRule
// ============================================================================

describe('useCreateOptimizationRule', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_call_POST_api_with_correct_payload_when_rule_created', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(mockRule, 201))

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate({
        campaignId: 'camp-001',
        name: 'CPA 임계값 규칙',
        ruleType: 'CPA_THRESHOLD',
        conditions: [{ metric: 'cpa', operator: 'gt', value: 10000 }],
        actions: [{ type: 'PAUSE_AD' }],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith('/api/optimization-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignId: 'camp-001',
        name: 'CPA 임계값 규칙',
        ruleType: 'CPA_THRESHOLD',
        conditions: [{ metric: 'cpa', operator: 'gt', value: 10000 }],
        actions: [{ type: 'PAUSE_AD' }],
      }),
    })
  })

  it('should_return_created_rule_after_successful_creation', async () => {
    mockFetch.mockResolvedValueOnce(createMockResponse(mockRule, 201))

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate({
        campaignId: 'camp-001',
        name: 'CPA 임계값 규칙',
        ruleType: 'CPA_THRESHOLD',
        conditions: [{ metric: 'cpa', operator: 'gt', value: 10000 }],
        actions: [{ type: 'PAUSE_AD' }],
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.id).toBe('rule-001')
    expect(result.current.data?.ruleType).toBe('CPA_THRESHOLD')
  })

  it('should_handle_error_when_create_api_returns_non_ok', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ message: '캠페인을 찾을 수 없습니다' }, 404, false)
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCreateOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate({
        campaignId: 'invalid-id',
        name: '규칙',
        ruleType: 'CPA_THRESHOLD',
        conditions: [],
        actions: [],
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

// ============================================================================
// Tests: useUpdateOptimizationRule
// ============================================================================

describe('useUpdateOptimizationRule', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_call_PATCH_api_with_rule_id_and_updated_fields', async () => {
    const updatedRule = { ...mockRule, name: '수정된 규칙명' }
    mockFetch.mockResolvedValueOnce(createMockResponse(updatedRule))

    const wrapper = createWrapper()
    const { result } = renderHook(() => useUpdateOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'rule-001', name: '수정된 규칙명' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith('/api/optimization-rules/rule-001', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '수정된 규칙명' }),
    })
  })

  it('should_return_updated_rule_after_successful_update', async () => {
    const updatedRule = { ...mockRule, cooldownMinutes: 120 }
    mockFetch.mockResolvedValueOnce(createMockResponse(updatedRule))

    const wrapper = createWrapper()
    const { result } = renderHook(() => useUpdateOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'rule-001', cooldownMinutes: 120 })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.cooldownMinutes).toBe(120)
  })

  it('should_handle_error_when_update_api_returns_non_ok', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ message: '규칙을 찾을 수 없습니다' }, 404, false)
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useUpdateOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'nonexistent-id', name: '수정 시도' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

// ============================================================================
// Tests: useDeleteOptimizationRule
// ============================================================================

describe('useDeleteOptimizationRule', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_call_DELETE_api_with_rule_id', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204, json: () => Promise.resolve(null) })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useDeleteOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate('rule-001')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith('/api/optimization-rules/rule-001', {
      method: 'DELETE',
    })
  })

  it('should_handle_error_when_delete_api_returns_non_ok', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ message: '규칙을 찾을 수 없습니다' }, 404, false)
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useDeleteOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate('nonexistent-id')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

// ============================================================================
// Tests: useToggleOptimizationRule
// ============================================================================

describe('useToggleOptimizationRule', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_call_PATCH_api_with_isEnabled_true_when_enabling_rule', async () => {
    const enabledRule = { ...mockRule, isEnabled: true }
    mockFetch.mockResolvedValueOnce(createMockResponse(enabledRule))

    const wrapper = createWrapper()
    const { result } = renderHook(() => useToggleOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'rule-001', isEnabled: true })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith('/api/optimization-rules/rule-001', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isEnabled: true }),
    })
  })

  it('should_call_PATCH_api_with_isEnabled_false_when_disabling_rule', async () => {
    const disabledRule = { ...mockRule, isEnabled: false }
    mockFetch.mockResolvedValueOnce(createMockResponse(disabledRule))

    const wrapper = createWrapper()
    const { result } = renderHook(() => useToggleOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'rule-001', isEnabled: false })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.isEnabled).toBe(false)
  })

  it('should_handle_error_when_toggle_api_returns_non_ok', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ message: '규칙을 찾을 수 없습니다' }, 404, false)
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useToggleOptimizationRule(), { wrapper })

    await act(async () => {
      result.current.mutate({ id: 'nonexistent-id', isEnabled: true })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

// ============================================================================
// Tests: useOptimizationRulePresets
// ============================================================================

describe('useOptimizationRulePresets', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_fetch_presets_with_campaignId_query_param', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ presets: [mockPreset] })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useOptimizationRulePresets('camp-001'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/optimization-rules/presets?campaignId=camp-001'
    )
    expect(result.current.data?.presets).toHaveLength(1)
    expect(result.current.data?.presets[0].ruleType).toBe('ROAS_FLOOR')
  })

  it('should_return_multiple_presets_when_api_returns_multiple', async () => {
    const anotherPreset = { ...mockPreset, id: 'preset-002', ruleType: 'BUDGET_PACE' as const }
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ presets: [mockPreset, anotherPreset] })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useOptimizationRulePresets('camp-001'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.presets).toHaveLength(2)
  })

  it('should_handle_api_error_when_presets_fetch_fails', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ error: '프리셋 조회 실패' }, 500, false)
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useOptimizationRulePresets('camp-001'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})
