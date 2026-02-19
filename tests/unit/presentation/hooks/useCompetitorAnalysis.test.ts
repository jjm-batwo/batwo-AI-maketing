import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
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

import { useCompetitorSearch } from '@/presentation/hooks/useCompetitorAnalysis'

// ============================================================================
// Fixtures
// ============================================================================

const mockCompetitorData = {
  totalAds: 42,
  analysis: {
    competitors: [
      {
        pageName: '스킨케어 브랜드A',
        pageId: 'page_001',
        adCount: 5,
        dominantFormats: ['carousel', 'single_image_long_copy'],
        commonHooks: ['무료 혜택', '할인 프로모션'],
        averageAdLifespan: 14,
      },
    ],
    trends: {
      popularHooks: ['무료 혜택', '할인 프로모션'],
      commonOffers: ['무료 체험', '첫 구매 할인'],
      formatDistribution: [
        { format: 'carousel', percentage: 45 },
        { format: 'single_image_long_copy', percentage: 30 },
      ],
    },
    recommendations: ['경쟁사 대비 할인 프로모션 강화 추천'],
  },
}

// ============================================================================
// Tests
// ============================================================================

describe('useCompetitorSearch', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_not_fetch_when_keywords_is_empty', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCompetitorSearch(''), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should_fetch_competitor_data_when_keywords_provided', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockCompetitorData })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCompetitorSearch('스킨케어'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/ai/competitors?')
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('keywords=%EC%8A%A4%ED%82%A8%EC%BC%80%EC%96%B4')
    )
  })

  it('should_include_default_country_KR_in_request', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockCompetitorData })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCompetitorSearch('다이어트'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('countries=KR')
    )
  })

  it('should_include_industry_in_request_when_provided', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockCompetitorData })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(
      () => useCompetitorSearch('패션', 'KR', 'fashion'),
      { wrapper }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('industry=fashion')
    )
  })

  it('should_return_data_field_from_api_response', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ success: true, data: mockCompetitorData })
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCompetitorSearch('스킨케어'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockCompetitorData)
    expect(result.current.data?.totalAds).toBe(42)
    expect(result.current.data?.analysis.competitors).toHaveLength(1)
    expect(result.current.data?.analysis.trends.popularHooks).toContain('무료 혜택')
  })

  it('should_handle_api_error_and_set_error_state', async () => {
    mockFetch.mockResolvedValueOnce(
      createMockResponse({ error: '서버 오류' }, 500, false)
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCompetitorSearch('스킨케어'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })

  it('should_show_loading_state_while_fetching', async () => {
    let resolvePromise: (value: unknown) => void
    const pendingPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockFetch.mockReturnValueOnce(
      pendingPromise.then(() => createMockResponse({ success: true, data: mockCompetitorData }))
    )

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCompetitorSearch('스킨케어'), { wrapper })

    expect(result.current.isLoading).toBe(true)

    resolvePromise!(undefined)
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})
