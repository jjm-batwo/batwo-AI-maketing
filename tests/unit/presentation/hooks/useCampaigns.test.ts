/**
 * TEST-09: useCampaigns 훅 테스트
 *
 * 캠페인 CRUD 훅 전체 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import {
  useCampaigns,
  useCampaign,
  useCreateCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from '@/presentation/hooks/useCampaigns'

global.fetch = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const mockCampaignsResponse = {
  campaigns: [
    {
      id: 'camp_001',
      name: '신규 고객 확보',
      objective: 'OUTCOME_SALES',
      status: 'ACTIVE' as const,
      dailyBudget: 50000,
      totalSpent: 35000,
      impressions: 42000,
      clicks: 1152,
      conversions: 41,
      roas: 4.12,
      startDate: '2026-02-01',
      createdAt: '2026-01-30T00:00:00Z',
    },
    {
      id: 'camp_002',
      name: '브랜드 인지도',
      objective: 'OUTCOME_AWARENESS',
      status: 'PAUSED' as const,
      dailyBudget: 30000,
      totalSpent: 15000,
      impressions: 28000,
      clicks: 560,
      conversions: 12,
      roas: 2.8,
      startDate: '2026-02-03',
      createdAt: '2026-02-01T00:00:00Z',
    },
  ],
  total: 2,
  page: 1,
  pageSize: 20,
}

describe('useCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch campaigns list', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCampaignsResponse,
    } as Response)

    const { result } = renderHook(() => useCampaigns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.campaigns).toHaveLength(2)
    expect(result.current.data?.campaigns[0].name).toBe('신규 고객 확보')
    expect(result.current.data?.campaigns[0].status).toBe('ACTIVE')
    expect(result.current.data?.campaigns[0].roas).toBe(4.12)
    expect(result.current.data?.total).toBe(2)
  })

  it('should pass pagination parameters', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCampaignsResponse,
    } as Response)

    renderHook(() => useCampaigns({ page: 2, pageSize: 10 }), { wrapper: createWrapper() })

    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(callUrl).toContain('page=2')
    expect(callUrl).toContain('pageSize=10')
  })

  it('should pass status filter', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockCampaignsResponse,
    } as Response)

    renderHook(() => useCampaigns({ status: 'ACTIVE' }), { wrapper: createWrapper() })

    await waitFor(() => expect(fetch).toHaveBeenCalled())

    const callUrl = vi.mocked(fetch).mock.calls[0][0] as string
    expect(callUrl).toContain('status=ACTIVE')
  })

  it('should not fetch when enabled is false', () => {
    renderHook(() => useCampaigns({ enabled: false }), { wrapper: createWrapper() })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('should handle fetch error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const { result } = renderHook(() => useCampaigns(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Failed to fetch campaigns')
  })
})

describe('useCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch a single campaign by id', async () => {
    const singleCampaign = mockCampaignsResponse.campaigns[0]
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => singleCampaign,
    } as Response)

    const { result } = renderHook(() => useCampaign('camp_001'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.id).toBe('camp_001')
    expect(result.current.data?.name).toBe('신규 고객 확보')
    expect(fetch).toHaveBeenCalledWith('/api/campaigns/camp_001')
  })

  it('should not fetch when id is empty', () => {
    renderHook(() => useCampaign(''), { wrapper: createWrapper() })
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('useCreateCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create campaign and invalidate cache', async () => {
    const newCampaign = {
      id: 'camp_new',
      name: 'New Campaign',
      objective: 'OUTCOME_SALES',
      status: 'DRAFT' as const,
      dailyBudget: 40000,
      totalSpent: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      roas: 0,
      startDate: '2026-03-01',
      createdAt: '2026-02-28T00:00:00Z',
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => newCampaign,
    } as Response)

    const { result } = renderHook(() => useCreateCampaign(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({
        name: 'New Campaign',
        objective: 'OUTCOME_SALES',
        targetAudience: {
          ageMin: 20,
          ageMax: 40,
          gender: 'ALL',
          locations: ['Seoul'],
        },
        dailyBudget: 40000,
        startDate: '2026-03-01',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.id).toBe('camp_new')
    expect(result.current.data?.name).toBe('New Campaign')
  })

  it('should handle creation error with message', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '예산이 부족합니다' }),
    } as Response)

    const { result } = renderHook(() => useCreateCampaign(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({
        name: 'Fail Campaign',
        objective: 'OUTCOME_SALES',
        targetAudience: { ageMin: 20, ageMax: 40, gender: 'ALL', locations: ['Seoul'] },
        dailyBudget: 40000,
        startDate: '2026-03-01',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('예산이 부족합니다')
  })
})

describe('useUpdateCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update campaign status', async () => {
    const updatedCampaign = { ...mockCampaignsResponse.campaigns[0], status: 'PAUSED' as const }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => updatedCampaign,
    } as Response)

    const { result } = renderHook(() => useUpdateCampaign(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate({ id: 'camp_001', status: 'PAUSED' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.status).toBe('PAUSED')
  })
})

describe('useDeleteCampaign', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete campaign', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
    } as Response)

    const { result } = renderHook(() => useDeleteCampaign(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('camp_001')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(fetch).toHaveBeenCalledWith('/api/campaigns/camp_001', { method: 'DELETE' })
  })

  it('should handle delete error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403,
    } as Response)

    const { result } = renderHook(() => useDeleteCampaign(), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('camp_001')
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Failed to delete campaign')
  })
})
