/**
 * TEST-09: useDashboardKPI 훅 테스트
 *
 * 대시보드 KPI 데이터 조회, 파라미터 전달, 에러 핸들링 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

// Hook import
import { useDashboardKPI, useDashboardSummary, useDashboardChartData } from '@/presentation/hooks/useDashboardKPI'

// Mock fetch
global.fetch = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const mockKPIResponse = {
  summary: {
    totalSpend: 89500,
    totalRevenue: 404540,
    totalImpressions: 125340,
    totalReach: 98000,
    totalClicks: 3456,
    totalLinkClicks: 2890,
    totalConversions: 123,
    averageRoas: 4.52,
    averageCtr: 2.76,
    averageCpa: 727.64,
    cvr: 3.56,
    activeCampaigns: 5,
    changes: {
      spend: -5.2,
      revenue: 12.3,
      roas: 18.5,
      ctr: 3.1,
      conversions: 8.7,
      impressions: -2.1,
      reach: 1.5,
      clicks: 4.2,
      linkClicks: 5.1,
    },
  },
  chartData: [
    { date: '2026-02-01', spend: 12000, revenue: 54000, roas: 4.5, impressions: 18000, reach: 14000, clicks: 490, linkClicks: 410, conversions: 18 },
    { date: '2026-02-02', spend: 13500, revenue: 61000, roas: 4.52, impressions: 17500, reach: 13800, clicks: 510, linkClicks: 430, conversions: 20 },
  ],
  period: {
    startDate: '2026-02-01',
    endDate: '2026-02-07',
  },
}

describe('useDashboardKPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch KPI data successfully', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIResponse,
    } as Response)

    const { result } = renderHook(() => useDashboardKPI(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockKPIResponse)
    expect(result.current.data?.summary.totalSpend).toBe(89500)
    expect(result.current.data?.summary.averageRoas).toBe(4.52)
    expect(result.current.data?.chartData).toHaveLength(2)
    expect(result.current.data?.period.startDate).toBe('2026-02-01')
  })

  it('should pass period parameter to URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIResponse,
    } as Response)

    renderHook(() => useDashboardKPI({ period: '30d' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(callUrl).toContain('period=30d')
  })

  it('should pass objective parameter when not ALL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIResponse,
    } as Response)

    renderHook(() => useDashboardKPI({ objective: 'SALES' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(callUrl).toContain('objective=SALES')
  })

  it('should NOT pass objective=ALL as parameter', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIResponse,
    } as Response)

    renderHook(() => useDashboardKPI({ objective: 'ALL' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(callUrl).not.toContain('objective=ALL')
  })

  it('should handle fetch error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const { result } = renderHook(() => useDashboardKPI(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.error?.message).toBe('Failed to fetch dashboard KPI')
  })

  it('should not fetch when enabled is false', () => {
    renderHook(() => useDashboardKPI({ enabled: false }), {
      wrapper: createWrapper(),
    })

    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('useDashboardSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return only summary data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIResponse,
    } as Response)

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockKPIResponse.summary)
    expect(result.current.data?.totalSpend).toBe(89500)
    expect(result.current.data?.activeCampaigns).toBe(5)
  })
})

describe('useDashboardChartData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return chart data and period', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIResponse,
    } as Response)

    const { result } = renderHook(() => useDashboardChartData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockKPIResponse.chartData)
    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].date).toBe('2026-02-01')
    expect(result.current.period).toEqual(mockKPIResponse.period)
  })

  it('should default to 7d period', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockKPIResponse,
    } as Response)

    renderHook(() => useDashboardChartData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled()
    })

    const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(callUrl).toContain('period=7d')
  })
})
