/**
 * TEST-09: useQuota 훅 테스트
 *
 * 할당량 조회 및 초과 검사 훅 검증
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

import { useQuota, useQuotaCheck, useCampaignQuota, useAiCopyGenQuota, useAiAnalysisQuota } from '@/presentation/hooks/useQuota'

global.fetch = vi.fn()

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

const mockQuotaResponse = {
  usage: {
    campaigns: { used: 3, limit: 5, remaining: 2, period: 'week' as const },
    aiCopyGen: { used: 15, limit: 20, remaining: 5, period: 'day' as const },
    aiAnalysis: { used: 1, limit: 5, remaining: 4, period: 'week' as const },
  },
  plan: 'STARTER',
  trial: { isInTrial: false, daysRemaining: 0 },
  resetDates: {
    weekly: new Date(Date.now() + 3 * 86400000).toISOString(),
    daily: new Date(Date.now() + 12 * 3600000).toISOString(),
  },
  limits: {
    campaigns: 5,
    aiCopyGen: 20,
    aiAnalysis: 5,
  },
}

describe('useQuota', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should fetch quota data', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaResponse,
    } as Response)

    const { result } = renderHook(() => useQuota(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.usage.campaigns.used).toBe(3)
    expect(result.current.data?.usage.campaigns.limit).toBe(5)
    expect(result.current.data?.plan).toBe('STARTER')
    expect(result.current.data?.trial.isInTrial).toBe(false)
  })

  it('should handle quota fetch error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, status: 500 } as Response)

    const { result } = renderHook(() => useQuota(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Failed to fetch quota')
  })
})

describe('useQuotaCheck', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should check campaigns quota is not exceeded', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaResponse,
    } as Response)

    const { result } = renderHook(() => useQuotaCheck('campaigns'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.remaining).toBe(2))

    expect(result.current.isExceeded).toBe(false)
    expect(result.current.percentage).toBe(60) // 3/5 = 60%
    expect(result.current.plan).toBe('STARTER')
  })

  it('should detect exceeded quota', async () => {
    const exceededResponse = {
      ...mockQuotaResponse,
      usage: {
        ...mockQuotaResponse.usage,
        campaigns: { used: 5, limit: 5, remaining: 0, period: 'week' as const },
      },
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => exceededResponse,
    } as Response)

    const { result } = renderHook(() => useQuotaCheck('campaigns'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isExceeded).toBe(true))

    expect(result.current.remaining).toBe(0)
    expect(result.current.percentage).toBe(100)
  })
})

describe('useCampaignQuota', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should return campaign quota info', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaResponse,
    } as Response)

    const { result } = renderHook(() => useCampaignQuota(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.quota).not.toBeUndefined())

    expect(result.current.quota?.used).toBe(3)
    expect(result.current.quota?.limit).toBe(5)
    expect(result.current.isExceeded).toBe(false)
  })
})

describe('useAiCopyGenQuota', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should return AI copy generation quota info', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaResponse,
    } as Response)

    const { result } = renderHook(() => useAiCopyGenQuota(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.quota).not.toBeUndefined())

    expect(result.current.quota?.used).toBe(15)
    expect(result.current.quota?.limit).toBe(20)
    expect(result.current.percentage).toBe(75) // 15/20 = 75%
  })
})

describe('useAiAnalysisQuota', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('should return AI analysis quota info', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockQuotaResponse,
    } as Response)

    const { result } = renderHook(() => useAiAnalysisQuota(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.quota).not.toBeUndefined())

    expect(result.current.quota?.used).toBe(1)
    expect(result.current.quota?.limit).toBe(5)
    expect(result.current.percentage).toBe(20) // 1/5 = 20%
    expect(result.current.isExceeded).toBe(false)
  })
})
