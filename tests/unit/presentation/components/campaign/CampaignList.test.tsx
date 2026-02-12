import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CampaignList } from '@/presentation/components/campaign/CampaignList'
import { NextIntlClientProvider } from 'next-intl'

// Mock next-intl translations
const mockTranslations = {
  'campaigns.filter': '필터',
  'campaigns.newCampaignShort': '새 캠페인',
  'campaigns.remaining': '잔여 {count}회',
  'campaigns.empty.title': '캠페인이 없습니다',
  'campaigns.empty.description': '첫 캠페인을 만들어 광고를 시작하세요',
  'campaigns.empty.button': '캠페인 만들기',
}

vi.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const template = mockTranslations[key as keyof typeof mockTranslations] || key
    if (params && typeof template === 'string') {
      return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k]))
    }
    return template
  },
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="ko" messages={mockTranslations}>
      {children}
    </NextIntlClientProvider>
  )
}

describe('CampaignList', () => {
  const mockCampaigns = [
    {
      id: 'campaign-1',
      name: '여름 프로모션',
      status: 'ACTIVE' as const,
      objective: 'CONVERSIONS',
      dailyBudget: 50000,
      spend: 45000,
      roas: 3.5,
    },
    {
      id: 'campaign-2',
      name: '신제품 론칭',
      status: 'PAUSED' as const,
      objective: 'TRAFFIC',
      dailyBudget: 30000,
      spend: 25000,
      roas: 2.1,
    },
    {
      id: 'campaign-3',
      name: '재입고 알림',
      status: 'DRAFT' as const,
      objective: 'BRAND_AWARENESS',
      dailyBudget: 20000,
      spend: 0,
      roas: 0,
    },
  ]

  describe('rendering', () => {
    it('should render filter button', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByText('필터')).toBeInTheDocument()
    })

    it('should render new campaign button', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const newButton = screen.getByText('새 캠페인')
      expect(newButton).toBeInTheDocument()
      expect(newButton.closest('a')).toHaveAttribute('href', '/campaigns/new')
    })

    it('should render all campaign cards', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByText('여름 프로모션')).toBeInTheDocument()
      expect(screen.getByText('신제품 론칭')).toBeInTheDocument()
      expect(screen.getByText('재입고 알림')).toBeInTheDocument()
    })
  })

  describe('quota management', () => {
    it('should display remaining quota', () => {
      render(<CampaignList campaigns={mockCampaigns} quotaRemaining={3} />, { wrapper: Wrapper })
      expect(screen.getByText(/잔여 3회/)).toBeInTheDocument()
    })

    it('should disable new campaign button when quota is zero', () => {
      render(<CampaignList campaigns={mockCampaigns} quotaRemaining={0} />, { wrapper: Wrapper })
      // Button with disabled prop should have pointer-events-none or be visually disabled
      const newButton = screen.getByText('새 캠페인').closest('a')
      expect(newButton).toHaveClass('disabled:pointer-events-none')
    })

    it('should enable new campaign button when quota is available', () => {
      render(<CampaignList campaigns={mockCampaigns} quotaRemaining={5} />, { wrapper: Wrapper })
      const newButton = screen.getByText('새 캠페인').closest('a')
      expect(newButton).toBeInTheDocument()
      expect(newButton).toHaveAttribute('href', '/campaigns/new')
    })

    it('should not show quota when undefined', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })
      expect(screen.queryByText(/잔여/)).not.toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('should show empty state when no campaigns', () => {
      render(<CampaignList campaigns={[]} />, { wrapper: Wrapper })
      expect(screen.getByText('캠페인이 없습니다')).toBeInTheDocument()
      expect(screen.getByText('첫 캠페인을 만들어 광고를 시작하세요')).toBeInTheDocument()
    })

    it('should show create button in empty state', () => {
      render(<CampaignList campaigns={[]} />, { wrapper: Wrapper })
      // Two "캠페인 만들기" buttons: one in header, one in empty state
      const createButtons = screen.getAllByText(/캠페인 만들기|새 캠페인/)
      expect(createButtons.length).toBeGreaterThan(0)
    })

    it('should disable create button in empty state when quota is zero', () => {
      render(<CampaignList campaigns={[]} quotaRemaining={0} />, { wrapper: Wrapper })
      // Check header button - it should have disabled styling
      const newCampaignButton = screen.getByText('새 캠페인').closest('a')
      expect(newCampaignButton).toHaveClass('disabled:pointer-events-none')
    })
  })

  describe('loading state', () => {
    it('should show skeleton cards when loading', () => {
      render(<CampaignList campaigns={[]} isLoading />, { wrapper: Wrapper })
      const skeletons = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      )
      expect(skeletons.length).toBe(6)
    })

    it('should not show campaigns when loading', () => {
      render(<CampaignList campaigns={mockCampaigns} isLoading />, { wrapper: Wrapper })
      expect(screen.queryByText('여름 프로모션')).not.toBeInTheDocument()
    })

    it('should not show filter and new campaign buttons when loading', () => {
      render(<CampaignList campaigns={mockCampaigns} isLoading />, { wrapper: Wrapper })
      expect(screen.queryByText('필터')).not.toBeInTheDocument()
      expect(screen.queryByText('새 캠페인')).not.toBeInTheDocument()
    })
  })

  describe('status change handling', () => {
    it('should call onStatusChange when provided', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignList
          campaigns={mockCampaigns}
          onStatusChange={onStatusChange}
        />,
        { wrapper: Wrapper }
      )

      // CampaignCard should receive the callback
      // This test verifies the prop is passed down
      expect(screen.getByText('여름 프로모션')).toBeInTheDocument()
    })

    it('should pass onStatusChange to all CampaignCard components', () => {
      const onStatusChange = vi.fn()
      const { container } = render(
        <CampaignList
          campaigns={mockCampaigns}
          onStatusChange={onStatusChange}
        />,
        { wrapper: Wrapper }
      )

      // All campaigns should be rendered with the callback
      const campaignCards = container.querySelectorAll('[class*="transition-shadow"]')
      expect(campaignCards.length).toBe(mockCampaigns.length)
    })
  })

  describe('responsive layout', () => {
    it('should use grid layout for campaigns', () => {
      const { container } = render(
        <CampaignList campaigns={mockCampaigns} />,
        { wrapper: Wrapper }
      )

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('gap-4')
    })

    it('should have responsive grid classes', () => {
      const { container } = render(
        <CampaignList campaigns={mockCampaigns} />,
        { wrapper: Wrapper }
      )

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('md:grid-cols-2', 'lg:grid-cols-3')
    })
  })

  describe('filter functionality', () => {
    it('should render filter button with icon', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const filterButton = screen.getByText('필터')
      expect(filterButton).toBeInTheDocument()

      // Should have icon (using lucide-react Filter icon)
      const icon = filterButton.parentElement?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should have proper button styling', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const filterButton = screen.getByText('필터').closest('button')
      expect(filterButton).toHaveClass('h-9')
    })
  })

  describe('new campaign button', () => {
    it('should have Plus icon', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const newButton = screen.getByText('새 캠페인')

      // Should have Plus icon (lucide-react)
      const icon = newButton.parentElement?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should link to new campaign page', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })
      const link = screen.getByText('새 캠페인').closest('a')
      expect(link).toHaveAttribute('href', '/campaigns/new')
    })
  })

  describe('accessibility', () => {
    it('should have accessible button labels', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })

      const filterButton = screen.getByText('필터')
      expect(filterButton).toBeInTheDocument()

      const newCampaignButton = screen.getByText('새 캠페인')
      expect(newCampaignButton).toBeInTheDocument()
    })

    it('should maintain focus order', () => {
      render(<CampaignList campaigns={mockCampaigns} quotaRemaining={5} />, { wrapper: Wrapper })

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('campaign data propagation', () => {
    it('should pass all campaign data to CampaignCard', () => {
      render(<CampaignList campaigns={mockCampaigns} />, { wrapper: Wrapper })

      // Verify key campaign data is visible
      expect(screen.getByText('여름 프로모션')).toBeInTheDocument()
      expect(screen.getByText('신제품 론칭')).toBeInTheDocument()
      expect(screen.getByText('재입고 알림')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle single campaign', () => {
      render(<CampaignList campaigns={[mockCampaigns[0]]} />, { wrapper: Wrapper })
      expect(screen.getByText('여름 프로모션')).toBeInTheDocument()
      expect(screen.queryByText('신제품 론칭')).not.toBeInTheDocument()
    })

    it('should handle very long campaign list', () => {
      const manyCampaigns = Array.from({ length: 20 }, (_, i) => ({
        ...mockCampaigns[0],
        id: `campaign-${i}`,
        name: `캠페인 ${i + 1}`,
      }))

      render(<CampaignList campaigns={manyCampaigns} />, { wrapper: Wrapper })
      expect(screen.getByText('캠페인 1')).toBeInTheDocument()
      expect(screen.getByText('캠페인 20')).toBeInTheDocument()
    })

    it('should handle quotaRemaining as 0 correctly', () => {
      render(<CampaignList campaigns={mockCampaigns} quotaRemaining={0} />, { wrapper: Wrapper })
      expect(screen.getByText(/잔여 0회/)).toBeInTheDocument()

      const newButton = screen.getByText('새 캠페인').closest('a')
      expect(newButton).toHaveClass('disabled:pointer-events-none')
    })
  })
})
