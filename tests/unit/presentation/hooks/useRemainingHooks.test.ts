/**
 * TEST-09: useTeams, useAdSets, useAds, useSync, useAICopy, useOptimization,
 * useAlerts, useMetaConnection, useBudgetAlert, useCreatives, useSavings, useCountUp
 *
 * 나머지 주요 Hook 테스트 (12개 훅 × ~3 테스트 = ~36 케이스)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'

global.fetch = vi.fn()

// Mock zustand store
vi.mock('@/presentation/stores/uiStore', () => ({
  useUIStore: vi.fn(() => vi.fn()),
}))

// Mock domain import
vi.mock('@/domain/entities/Team', () => ({
  TeamRole: {},
  TeamPermission: {},
}))

// Mock component import (BudgetAlertBadge)
vi.mock('@/presentation/components/campaign/BudgetAlertBadge', () => ({
  BudgetStatus: {},
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

// ============================================================================
// useTeams
// ============================================================================
describe('useTeams', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should fetch teams list', async () => {
    const { useTeams } = await import('@/presentation/hooks/useTeams')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        teams: [
          { id: 'team_001', name: 'Marketing Team', memberCount: 3, role: 'OWNER' },
          { id: 'team_002', name: 'Dev Team', memberCount: 5, role: 'MEMBER' },
        ],
      }),
    } as Response)

    const { result } = renderHook(() => useTeams(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data?.[0].name).toBe('Marketing Team')
    expect(result.current.data?.[0].memberCount).toBe(3)
  })

  it('should handle team fetch error with specific message', async () => {
    const { useTeams } = await import('@/presentation/hooks/useTeams')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: '인증에 실패했습니다' }),
    } as Response)

    const { result } = renderHook(() => useTeams(), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('인증에 실패했습니다')
  })
})

// ============================================================================
// useTeam (Single)
// ============================================================================
describe('useTeam', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should fetch team details', async () => {
    const { useTeam } = await import('@/presentation/hooks/useTeams')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        team: { id: 'team_001', name: 'Marketing Team', memberCount: 3 },
        members: [{ id: 'm1', email: 'test@example.com', role: 'OWNER' }],
        currentUserRole: 'OWNER',
        currentUserPermissions: ['*'],
      }),
    } as Response)

    const { result } = renderHook(() => useTeam('team_001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.team.name).toBe('Marketing Team')
    expect(result.current.data?.currentUserRole).toBe('OWNER')
  })

  it('should not fetch when teamId is null', async () => {
    const { useTeam } = await import('@/presentation/hooks/useTeams')
    renderHook(() => useTeam(null), { wrapper: createWrapper() })
    expect(fetch).not.toHaveBeenCalled()
  })
})

// ============================================================================
// useAdSets
// ============================================================================
describe('useAdSets', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should fetch ad sets for a campaign', async () => {
    const { useAdSets } = await import('@/presentation/hooks/useAdSets')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        adSets: [
          { id: 'adset_001', campaignId: 'camp_001', name: 'Test AdSet', status: 'ACTIVE', dailyBudget: 20000 },
        ],
      }),
    } as Response)

    const { result } = renderHook(() => useAdSets('camp_001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.adSets).toHaveLength(1)
    expect(result.current.data?.adSets[0].name).toBe('Test AdSet')
    expect(result.current.data?.adSets[0].dailyBudget).toBe(20000)
  })

  it('should not fetch when campaignId is empty', async () => {
    const { useAdSets } = await import('@/presentation/hooks/useAdSets')
    renderHook(() => useAdSets(''), { wrapper: createWrapper() })
    expect(fetch).not.toHaveBeenCalled()
  })
})

// ============================================================================
// useAds
// ============================================================================
describe('useAds', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should fetch ads for an ad set', async () => {
    const { useAds } = await import('@/presentation/hooks/useAds')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ads: [
          { id: 'ad_001', name: 'Test Ad', status: 'ACTIVE' },
          { id: 'ad_002', name: 'Test Ad 2', status: 'PAUSED' },
        ],
      }),
    } as Response)

    const { result } = renderHook(() => useAds('adset_001'), { wrapper: createWrapper() })
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.ads).toHaveLength(2)
    expect(result.current.data?.ads[0].status).toBe('ACTIVE')
    expect(result.current.data?.ads[1].name).toBe('Test Ad 2')
  })

  it('should not fetch when adSetId is empty', async () => {
    const { useAds } = await import('@/presentation/hooks/useAds')
    renderHook(() => useAds(''), { wrapper: createWrapper() })
    expect(fetch).not.toHaveBeenCalled()
  })
})

// ============================================================================
// useSync
// ============================================================================
describe('useSync', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should trigger sync mutation', async () => {
    const { useSync } = await import('@/presentation/hooks/useSync')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        campaigns: { created: 2, updated: 3, archived: 0, total: 5 },
        insights: { synced: 10, failed: 0, total: 10 },
        message: '동기화 완료: 5개 캠페인, 10개 인사이트',
      }),
    } as Response)

    const { result } = renderHook(() => useSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.campaigns.total).toBe(5)
    expect(result.current.data?.insights.synced).toBe(10)
  })

  it('should handle sync error', async () => {
    const { useSync } = await import('@/presentation/hooks/useSync')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Token expired' }),
    } as Response)

    const { result } = renderHook(() => useSync(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate()
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Token expired')
  })
})

// ============================================================================
// useAICopy
// ============================================================================
describe('useAICopy', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should generate ad copy', async () => {
    const { useAICopy } = await import('@/presentation/hooks/useAICopy')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        variants: [
          { headline: '지금 시작하세요!', primaryText: '최고의 솔루션', description: '합리적인 가격', callToAction: '자세히 보기', targetAudience: '20-40대' },
        ],
        remainingQuota: 15,
      }),
    } as Response)

    const { result } = renderHook(() => useAICopy(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.generateCopy({
        productName: 'Batwo',
        productDescription: 'AI Marketing SaaS',
        targetAudience: '20-40대',
        tone: 'professional',
        objective: 'conversion',
      })
    })

    await waitFor(() => expect(result.current.variants).toHaveLength(1))
    expect(result.current.variants[0].headline).toBe('지금 시작하세요!')
    expect(result.current.remainingQuota).toBe(15)
  })

  it('should handle generation error with message', async () => {
    const { useAICopy } = await import('@/presentation/hooks/useAICopy')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '일일 할당량 초과' }),
    } as Response)

    const { result } = renderHook(() => useAICopy(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.generateCopy({
        productName: 'Batwo',
        productDescription: 'AI',
        targetAudience: '20-40대',
        tone: 'casual',
        objective: 'awareness',
      })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('일일 할당량 초과')
  })
})

// ============================================================================
// useOptimization
// ============================================================================
describe('useOptimization', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should fetch optimization suggestions when enabled', async () => {
    const { useOptimization } = await import('@/presentation/hooks/useOptimization')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        campaignId: 'camp_001',
        campaignName: '신규 고객 확보',
        suggestions: [
          { category: 'budget', priority: 'high', suggestion: '예산 20% 증액', expectedImpact: '+15% ROAS', rationale: '현재 ROAS가 시장 평균 대비 높음' },
        ],
        metrics: { roas: 4.5, cpa: 700, ctr: 2.8, impressions: 50000, clicks: 1400, conversions: 70, spend: 49000 },
        remainingQuota: 4,
        generatedAt: '2026-02-10T00:00:00Z',
      }),
    } as Response)

    const { result } = renderHook(() => useOptimization('camp_001', true), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.suggestions).toHaveLength(1)
    expect(result.current.suggestions[0].category).toBe('budget')
    expect(result.current.suggestions[0].priority).toBe('high')
    expect(result.current.metrics?.roas).toBe(4.5)
    expect(result.current.remainingQuota).toBe(4)
  })

  it('should not fetch when enabled is false', async () => {
    const { useOptimization } = await import('@/presentation/hooks/useOptimization')
    renderHook(() => useOptimization('camp_001', false), { wrapper: createWrapper() })
    expect(fetch).not.toHaveBeenCalled()
  })
})

// ============================================================================
// useMetaConnection
// ============================================================================
describe('useMetaConnection', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should detect connected state', async () => {
    const { useMetaConnection } = await import('@/presentation/hooks/useMetaConnection')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accounts: [
          { id: 'acc_001', metaAccountId: 'act_123', businessName: 'Test Business', createdAt: '2026-01-01T00:00:00Z', tokenExpiry: null },
        ],
      }),
    } as Response)

    const { result } = renderHook(() => useMetaConnection(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isConnected).toBe(true)
    expect(result.current.accounts).toHaveLength(1)
    expect(result.current.accounts[0].businessName).toBe('Test Business')
    expect(result.current.error).toBeNull()
  })

  it('should detect disconnected state', async () => {
    const { useMetaConnection } = await import('@/presentation/hooks/useMetaConnection')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accounts: [] }),
    } as Response)

    const { result } = renderHook(() => useMetaConnection(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isConnected).toBe(false)
    expect(result.current.accounts).toHaveLength(0)
  })

  it('should handle connection error', async () => {
    const { useMetaConnection } = await import('@/presentation/hooks/useMetaConnection')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response)

    const { result } = renderHook(() => useMetaConnection(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.isConnected).toBe(false)
    expect(result.current.error).not.toBeNull()
    expect(result.current.error?.message).toBe('Failed to fetch Meta connection status')
  })
})

// ============================================================================
// useSavings
// ============================================================================
describe('useSavings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should fetch savings report', async () => {
    const { useSavings } = await import('@/presentation/hooks/useSavings')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        totalSavings: { amount: 250000, currency: 'KRW' },
        totalOptimizations: 15,
        topSavingEvent: { campaignId: 'camp_001', campaignName: '신규 캠페인', ruleName: '예산 최적화', estimatedSavings: { amount: 80000, currency: 'KRW' } },
        recentOptimizations: [],
      }),
    } as Response)

    const { result } = renderHook(() => useSavings(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.data?.totalSavings.amount).toBe(250000)
    expect(result.current.data?.totalOptimizations).toBe(15)
    expect(result.current.data?.topSavingEvent?.campaignName).toBe('신규 캠페인')
  })

  it('should not fetch when disabled', async () => {
    const { useSavings } = await import('@/presentation/hooks/useSavings')
    renderHook(() => useSavings({ enabled: false }), { wrapper: createWrapper() })
    expect(fetch).not.toHaveBeenCalled()
  })
})

// ============================================================================
// useCountUp
// ============================================================================
describe('useCountUp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('should start at 0 and not animate until started', async () => {
    const { useCountUp } = await import('@/presentation/hooks/useCountUp')
    const { result } = renderHook(() => useCountUp(100, 1000))

    expect(result.current.count).toBe(0)
  })

  it('should start counting when startOnMount is true', async () => {
    vi.useRealTimers()
    const { useCountUp } = await import('@/presentation/hooks/useCountUp')
    const { result } = renderHook(() => useCountUp(100, 500, true))

    // 즉시 시작 시 count는 0에서 시작하여 점점 증가
    await waitFor(() => expect(result.current.count).toBeGreaterThan(0), { timeout: 1000 })
  })

  it('should return start function', async () => {
    const { useCountUp } = await import('@/presentation/hooks/useCountUp')
    const { result } = renderHook(() => useCountUp(100, 1000))

    expect(typeof result.current.start).toBe('function')
  })
})

// ============================================================================
// useCreateCreative
// ============================================================================
describe('useCreateCreative', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should create creative', async () => {
    const { useCreateCreative } = await import('@/presentation/hooks/useCreatives')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'creative_001',
        name: 'New Creative',
        format: 'IMAGE',
        primaryText: 'Test text',
        headline: 'Test headline',
      }),
    } as Response)

    const { result } = renderHook(() => useCreateCreative(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({
        name: 'New Creative',
        format: 'IMAGE',
        primaryText: 'Test text',
        headline: 'Test headline',
      })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.id).toBe('creative_001')
    expect(result.current.data?.name).toBe('New Creative')
  })

  it('should handle creative creation error', async () => {
    const { useCreateCreative } = await import('@/presentation/hooks/useCreatives')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: '크리에이티브 수 제한 초과' }),
    } as Response)

    const { result } = renderHook(() => useCreateCreative(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ name: 'Fail', format: 'IMAGE' })
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('크리에이티브 수 제한 초과')
  })
})
