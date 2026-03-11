/**
 * TEST-09: useReports 훅 테스트
 *
 * 리포트 CRUD 및 다운로드/공유 훅 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import {
  useReports,
  useReport,
  useGenerateReport,
  useShareReport,
} from '@/presentation/hooks/useReports'

global.fetch = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const mockReportsResponse = {
  reports: [
    {
      id: 'report_001',
      type: 'WEEKLY' as const,
      status: 'GENERATED' as const,
      dateRange: { startDate: '2026-02-01', endDate: '2026-02-07' },
      generatedAt: '2026-02-08T00:00:00Z',
      campaignCount: 3,
    },
    {
      id: 'report_002',
      type: 'MONTHLY' as const,
      status: 'SENT' as const,
      dateRange: { startDate: '2026-01-01', endDate: '2026-01-31' },
      generatedAt: '2026-02-01T00:00:00Z',
      campaignCount: 5,
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
}

const mockReportDetail = {
  id: 'report_001',
  type: 'WEEKLY' as const,
  status: 'GENERATED' as const,
  dateRange: { startDate: '2026-02-01', endDate: '2026-02-07' },
  summaryMetrics: {
    totalImpressions: 125340,
    totalClicks: 3456,
    totalConversions: 123,
    totalSpend: 89500,
    totalRevenue: 404540,
    averageRoas: 4.52,
    averageCtr: 2.76,
    averageCpa: 727.64,
  },
  aiInsights: [
    { type: 'POSITIVE' as const, message: 'ROAS가 평균 대비 52% 높습니다', confidence: 0.92 },
    { type: 'SUGGESTION' as const, message: '기존 예산을 20% 증액하세요', confidence: 0.85 },
  ],
  sections: [{ title: '요약', content: '이번 주 캠페인 성과 요약' }],
  campaigns: [
    { id: 'camp_001', name: '신규 고객 확보', metrics: { spend: 50000, impressions: 70000, clicks: 2000, conversions: 80, roas: 4.8 } },
  ],
  generatedAt: '2026-02-08T00:00:00Z',
}

describe('useReports', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should fetch reports list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportsResponse,
    } as Response)

    const { result } = renderHook(() => useReports(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.reports).toHaveLength(2)
    expect(result.current.data?.reports[0].type).toBe('WEEKLY')
    expect(result.current.data?.reports[0].campaignCount).toBe(3)
    expect(result.current.data?.total).toBe(2)
  })

  it('should filter by report type', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportsResponse,
    } as Response)

    renderHook(() => useReports({ type: 'WEEKLY' }), { wrapper: createWrapper() })

    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(callUrl).toContain('type=WEEKLY')
  })

  it('should handle error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)

    const { result } = renderHook(() => useReports(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Failed to fetch reports')
  })
})

describe('useReport', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should fetch a single report detail', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockReportDetail,
    } as Response)

    const { result } = renderHook(() => useReport('report_001'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.id).toBe('report_001')
    expect(result.current.data?.aiInsights).toHaveLength(2)
    expect(result.current.data?.aiInsights[0].confidence).toBe(0.92)
    expect(result.current.data?.summaryMetrics.averageRoas).toBe(4.52)
  })

  it('should not fetch when id is empty', () => {
    renderHook(() => useReport(''), { wrapper: createWrapper() })
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('useGenerateReport', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should generate a new report', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'report_new',
        type: 'CUSTOM',
        status: 'PENDING',
        dateRange: { startDate: '2026-02-01', endDate: '2026-02-14' },
        campaignCount: 2,
      }),
    } as Response)

    const { result } = renderHook(() => useGenerateReport(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        type: 'CUSTOM',
        startDate: '2026-02-01',
        endDate: '2026-02-14',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('PENDING')
  })

  it('should handle generation error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '할당량을 초과했습니다' }),
    } as Response)

    const { result } = renderHook(() => useGenerateReport(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        type: 'WEEKLY',
        startDate: '2026-02-01',
        endDate: '2026-02-07',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('할당량을 초과했습니다')
  })
})

describe('useShareReport', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should share report via email', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response)

    const { result } = renderHook(() => useShareReport(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ id: 'report_001', email: 'share@example.com' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetch).toHaveBeenCalledWith('/api/reports/report_001/share', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'share@example.com' }),
    }))
  })
})
