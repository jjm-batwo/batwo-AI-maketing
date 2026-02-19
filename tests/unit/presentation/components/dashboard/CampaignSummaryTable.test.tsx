import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CampaignSummaryTable } from '@/presentation/components/dashboard/CampaignSummaryTable'
import { NextIntlClientProvider } from 'next-intl'

// Mock next-intl translations
const mockTranslations = {
  'campaignSummary.title': '캠페인 요약',
  'campaignSummary.viewAll': '전체보기',
  'campaignSummary.columns.name': '이름',
  'campaignSummary.columns.status': '상태',
  'campaignSummary.columns.spend': '지출',
  'campaignSummary.columns.roas': 'ROAS',
  'campaignSummary.columns.ctr': 'CTR',
  'campaigns.status.active': '진행 중',
  'campaigns.status.paused': '일시정지',
  'campaigns.status.completed': '완료',
  'campaigns.status.draft': '초안',
  'currency.krw': '₩',
  'currency.suffix': '원',
}

vi.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useTranslations: () => (key: string) => mockTranslations[key as keyof typeof mockTranslations] || key,
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="ko" messages={mockTranslations}>
      {children}
    </NextIntlClientProvider>
  )
}

describe('CampaignSummaryTable', () => {
  const mockCampaigns = [
    {
      id: 'campaign-1',
      name: '여름 프로모션',
      status: 'ACTIVE' as const,
      spend: 1500000,
      roas: 3.5,
      ctr: 2.8,
    },
    {
      id: 'campaign-2',
      name: '신제품 론칭',
      status: 'PAUSED' as const,
      spend: 800000,
      roas: 2.1,
      ctr: 1.5,
    },
    {
      id: 'campaign-3',
      name: '재입고 알림',
      status: 'COMPLETED' as const,
      spend: 500000,
      roas: 4.2,
      ctr: 3.1,
    },
  ]

  describe('rendering', () => {
    it('should render table title', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByText('캠페인 요약')).toBeInTheDocument()
    })

    it('should render "View All" link', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const viewAllLink = screen.getByText('전체보기')
      expect(viewAllLink).toBeInTheDocument()
      expect(viewAllLink.closest('a')).toHaveAttribute('href', '/campaigns')
    })

    it('should render table headers', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByText('이름')).toBeInTheDocument()
      expect(screen.getByText('상태')).toBeInTheDocument()
      expect(screen.getByText('지출')).toBeInTheDocument()
      expect(screen.getByText('ROAS')).toBeInTheDocument()
      expect(screen.getByText('CTR')).toBeInTheDocument()
    })

    it('should render all campaigns', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByText('여름 프로모션')).toBeInTheDocument()
      expect(screen.getByText('신제품 론칭')).toBeInTheDocument()
      expect(screen.getByText('재입고 알림')).toBeInTheDocument()
    })
  })

  describe('campaign data display', () => {
    it('should display campaign name as link', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const nameLink = screen.getByText('여름 프로모션').closest('a')
      expect(nameLink).toHaveAttribute('href', '/campaigns/campaign-1')
    })

    it('should display status text correctly', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })

      expect(screen.getByText('진행 중')).toBeInTheDocument()
      expect(screen.getByText('일시정지')).toBeInTheDocument()
      expect(screen.getByText('완료')).toBeInTheDocument()
    })

    it('should display ACTIVE status with green dot', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })

      const activeText = screen.getByText('진행 중')
      const dotSpan = activeText.previousSibling as HTMLElement
      expect(dotSpan).toHaveClass('bg-green-500')
    })

    it('should display PAUSED status with yellow dot', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })

      const pausedText = screen.getByText('일시정지')
      const dotSpan = pausedText.previousSibling as HTMLElement
      expect(dotSpan).toHaveClass('bg-yellow-500')
    })

    it('should display COMPLETED status with gray dot', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })

      const completedText = screen.getByText('완료')
      const dotSpan = completedText.previousSibling as HTMLElement
      expect(dotSpan).toHaveClass('bg-muted-foreground')
    })

    it('should format spend with currency', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByText(/1,500,000원/)).toBeInTheDocument()
      expect(screen.getByText(/800,000원/)).toBeInTheDocument()
    })

    it('should display ROAS with two decimal places', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByText('3.50x')).toBeInTheDocument()
      expect(screen.getByText('2.10x')).toBeInTheDocument()
      expect(screen.getByText('4.20x')).toBeInTheDocument()
    })

    it('should display CTR with two decimal places and percentage', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByText('2.80%')).toBeInTheDocument()
      expect(screen.getByText('1.50%')).toBeInTheDocument()
      expect(screen.getByText('3.10%')).toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      render(<CampaignSummaryTable isLoading />, { wrapper: Wrapper })
      const skeletons = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      )
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not show campaign data when loading', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} isLoading />, { wrapper: Wrapper })
      expect(screen.queryByText('여름 프로모션')).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should handle empty campaigns array', () => {
      render(<CampaignSummaryTable campaigns={[]} />, { wrapper: Wrapper })
      expect(screen.getByText('캠페인 요약')).toBeInTheDocument()
      // Should still show table headers
      expect(screen.getByText('이름')).toBeInTheDocument()
    })
  })

  describe('responsive design', () => {
    it('should have overflow-x-auto for mobile', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const scrollContainer = screen.getByRole('table').closest('div')
      expect(scrollContainer).toHaveClass('overflow-x-auto')
    })

    it('should have whitespace-nowrap on table headers', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const headers = screen.getAllByRole('columnheader')
      headers.forEach(header => {
        expect(header).toHaveClass('whitespace-nowrap')
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper table structure', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByRole('table')).toBeInTheDocument()
      expect(screen.getAllByRole('row').length).toBeGreaterThan(0)
    })

    it('should have accessible links with hover states', () => {
      render(<CampaignSummaryTable campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const nameLink = screen.getByText('여름 프로모션').closest('a')
      expect(nameLink).toHaveClass('hover:underline')
    })
  })

  describe('status configurations', () => {
    it('should handle DRAFT status with blue dot', () => {
      const draftCampaign = [{
        ...mockCampaigns[0],
        id: 'draft-1',
        status: 'DRAFT' as const,
      }]
      render(<CampaignSummaryTable campaigns={draftCampaign} />, { wrapper: Wrapper })
      const draftText = screen.getByText('초안')
      expect(draftText).toBeInTheDocument()
      const dotSpan = draftText.previousSibling as HTMLElement
      expect(dotSpan).toHaveClass('bg-blue-500')
    })
  })
})
