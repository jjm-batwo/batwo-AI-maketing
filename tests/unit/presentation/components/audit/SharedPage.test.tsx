import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import AuditSharedPage from '@/app/audit/shared/[token]/page'

// next/navigation mock
vi.mock('next/navigation', () => ({
  useParams: () => ({ token: 'test-token' }),
}))

// 하위 컴포넌트 mock
vi.mock('@/presentation/components/audit/AuditReportCard', () => ({
  AuditReportCard: () => <div data-testid="report-card">ReportCard</div>,
}))
vi.mock('@/presentation/components/audit/AuditCategoryBreakdown', () => ({
  AuditCategoryBreakdown: () => <div data-testid="category-breakdown">Breakdown</div>,
}))
vi.mock('@/presentation/components/audit/AuditConversionCTA', () => ({
  AuditConversionCTA: () => <div data-testid="conversion-cta">CTA</div>,
}))

const MOCK_SHARE_DATA = {
  report: {
    overall: 75,
    grade: 'B',
    categories: [],
    estimatedWaste: { amount: 100000, currency: 'KRW' },
    estimatedImprovement: { amount: 50000, currency: 'KRW' },
    totalCampaigns: 5,
    activeCampaigns: 3,
    analyzedAt: '2026-02-27T10:00:00Z',
  },
  createdAt: '2026-02-27T10:00:00Z',
  expiresAt: '2026-03-06T10:00:00Z',
}

const originalFetch = global.fetch

describe('AuditSharedPage - 바이럴 CTA', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('"나도 무료 진단 받기" CTA를 렌더링한다', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_SHARE_DATA),
    })

    render(<AuditSharedPage />)

    await waitFor(() => {
      expect(screen.getByText('나도 무료 진단 받기')).toBeInTheDocument()
    })
  })

  it('CTA 링크의 href가 "/"이다', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_SHARE_DATA),
    })

    render(<AuditSharedPage />)

    await waitFor(() => {
      const ctaLink = screen.getByText('나도 무료 진단 받기')
      expect(ctaLink.closest('a')).toHaveAttribute('href', '/')
    })
  })

  it('안내 문구를 표시한다', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(MOCK_SHARE_DATA),
    })

    render(<AuditSharedPage />)

    await waitFor(() => {
      expect(screen.getByText('내 광고 계정도 무료로 진단해보세요')).toBeInTheDocument()
    })
  })
})
