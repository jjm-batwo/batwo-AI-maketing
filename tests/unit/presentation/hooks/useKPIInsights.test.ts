import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useKPIInsights } from '@/presentation/hooks/useKPIInsights'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  Wrapper.displayName = 'QueryClientTestWrapper'
  return Wrapper
}

describe('useKPIInsights', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should_keep_empty_insights_reference_stable_when_query_disabled', () => {
    const wrapper = createWrapper()
    const { result, rerender } = renderHook(() => useKPIInsights({ enabled: false }), { wrapper })

    const firstInsightsRef = result.current.insights
    rerender()
    const secondInsightsRef = result.current.insights

    expect(mockFetch).not.toHaveBeenCalled()
    expect(firstInsightsRef).toBe(secondInsightsRef)
    expect(firstInsightsRef).toEqual([])
  })
})
