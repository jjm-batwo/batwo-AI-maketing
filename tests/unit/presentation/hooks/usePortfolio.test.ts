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

import { usePortfolioAnalysis, usePortfolioSimulation } from '@/presentation/hooks/usePortfolio'

// ============================================================================
// Fixtures
// ============================================================================

const mockAllocation = {
  campaignId: 'camp_001',
  campaignName: '스킨케어 캠페인',
  objective: 'SALES',
  currentBudget: 100000,
  recommendedBudget: 150000,
  changePercent: 50,
  metrics: { roas: 3.2, cpa: 5000, marginalROAS: 2.8 },
  reasoning: '높은 ROAS로 인해 예산 증액 추천',
}

const mockPortfolioData = {
  totalBudget: 500000,
  allocations: [mockAllocation],
  expectedImpact: {
    currentTotalROAS: 2.5,
    projectedTotalROAS: 3.1,
    improvement: 0.6,
  },
  efficiencyScore: 72,
  diversificationScore: 65,
  recommendations: ['상위 성과 캠페인에 예산 집중', '저성과 캠페인 일시 중단 검토'],
}

const mockSimulationData = {
  totalBudget: 700000,
  allocations: [mockAllocation],
  expectedImpact: {
    currentTotalROAS: 2.5,
    projectedTotalROAS: 3.4,
    improvement: 0.9,
  },
  comparison: {
    currentBudget: 500000,
    newBudget: 700000,
    budgetChange: 200000,
    budgetChangePercent: 40,
  },
}

// ============================================================================
// Tests: usePortfolioAnalysis
// ============================================================================

describe('usePortfolioAnalysis', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_fetch_portfolio_data_on_mount', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockPortfolioData })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePortfolioAnalysis(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith('/api/ai/portfolio')
    expect(result.current.data).toEqual(mockPortfolioData)
  })

  it('should_return_portfolio_metrics_correctly', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockPortfolioData })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePortfolioAnalysis(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.totalBudget).toBe(500000)
    expect(result.current.data?.efficiencyScore).toBe(72)
    expect(result.current.data?.diversificationScore).toBe(65)
    expect(result.current.data?.allocations).toHaveLength(1)
    expect(result.current.data?.recommendations).toHaveLength(2)
  })

  it('should_return_expected_impact_values', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockPortfolioData })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePortfolioAnalysis(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.expectedImpact.currentTotalROAS).toBe(2.5)
    expect(result.current.data?.expectedImpact.projectedTotalROAS).toBe(3.1)
    expect(result.current.data?.expectedImpact.improvement).toBe(0.6)
  })

  it('should_show_loading_state_initially', async () => {
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(
      pendingPromise.then(() => createMockResponse({ success: true, data: mockPortfolioData }))
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePortfolioAnalysis(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    resolvePromise!(undefined)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('should_handle_api_error', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ error: '포트폴리오 분석 실패' }, 500, false)
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePortfolioAnalysis(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

// ============================================================================
// Tests: usePortfolioSimulation
// ============================================================================

describe('usePortfolioSimulation', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_call_POST_portfolio_api_with_totalBudget', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockSimulationData })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePortfolioSimulation(), { wrapper })

    await act(async () => {
      result.current.mutate(700000)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/ai/portfolio',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalBudget: 700000 }),
      })
    )
  })

  it('should_return_simulation_result_with_comparison', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockSimulationData })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePortfolioSimulation(), { wrapper })

    await act(async () => {
      result.current.mutate(700000)
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.totalBudget).toBe(700000)
    expect(result.current.data?.comparison.budgetChange).toBe(200000)
    expect(result.current.data?.comparison.budgetChangePercent).toBe(40)
  })

  it('should_handle_mutation_error', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ error: '시뮬레이션 실패' }, 500, false)
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => usePortfolioSimulation(), { wrapper })

    await act(async () => {
      result.current.mutate(700000)
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})
