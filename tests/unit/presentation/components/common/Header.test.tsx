/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '@/presentation/components/common/Layout/Header'
import { NextIntlClientProvider } from 'next-intl'

// Mock next-intl translations
const mockTranslations = {
  'common.openMenu': '메뉴 열기',
  'header.campaign': '캠페인',
  'header.aiCopy': 'AI 카피',
  'header.today': '오늘',
}

vi.mock('next-intl', () => ({
  NextIntlClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useTranslations: () => (key: string) => mockTranslations[key as keyof typeof mockTranslations] || key,
}))

// Mock UI store
const mockToggleMobileMenu = vi.fn()
vi.mock('@presentation/stores/uiStore', () => ({
  useUIStore: () => ({
    toggleMobileMenu: mockToggleMobileMenu,
  }),
}))

// Mock child components
vi.mock('@/presentation/components/quota/QuotaStatusBadge', () => ({
  QuotaStatusBadge: ({ label, used, limit, period }: any) => (
    <div data-testid="quota-badge">
      {label}: {used}/{limit} {period}
    </div>
  ),
}))

vi.mock('@/presentation/components/alerts/NotificationCenter', () => ({
  NotificationCenter: () => <div data-testid="notification-center">Notifications</div>,
}))

vi.mock('@/presentation/components/common/LanguageToggle', () => ({
  LanguageToggle: () => <div data-testid="language-toggle">Language</div>,
}))

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="ko" messages={mockTranslations}>
      {children}
    </NextIntlClientProvider>
  )
}

describe('Header', () => {
  const mockQuotaStatus = {
    campaignCreate: { used: 3, limit: 5 },
    aiCopyGen: { used: 15, limit: 20 },
    aiAnalysis: { used: 2, limit: 5 },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render header element', () => {
      render(<Header />, { wrapper: Wrapper })
      const header = screen.getByRole('banner')
      expect(header).toBeInTheDocument()
    })

    it('should render mobile menu button', () => {
      render(<Header />, { wrapper: Wrapper })
      const menuButton = screen.getByLabelText('메뉴 열기')
      expect(menuButton).toBeInTheDocument()
    })

    it('should render notification center', () => {
      render(<Header />, { wrapper: Wrapper })
      expect(screen.getByTestId('notification-center')).toBeInTheDocument()
    })

    it('should render language toggle', () => {
      render(<Header />, { wrapper: Wrapper })
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument()
    })
  })

  describe('quota status display', () => {
    it('should render quota badges when quotaStatus is provided', () => {
      render(<Header quotaStatus={mockQuotaStatus} />, { wrapper: Wrapper })
      const quotaBadges = screen.getAllByTestId('quota-badge')
      expect(quotaBadges.length).toBe(2) // Campaign and AI Copy badges
    })

    it('should display campaign quota correctly', () => {
      render(<Header quotaStatus={mockQuotaStatus} />, { wrapper: Wrapper })
      expect(screen.getByText(/캠페인: 3\/5/)).toBeInTheDocument()
    })

    it('should display AI copy quota correctly', () => {
      render(<Header quotaStatus={mockQuotaStatus} />, { wrapper: Wrapper })
      expect(screen.getByText(/AI 카피: 15\/20/)).toBeInTheDocument()
    })

    it('should not render quota badges when quotaStatus is undefined', () => {
      render(<Header />, { wrapper: Wrapper })
      expect(screen.queryByTestId('quota-badge')).not.toBeInTheDocument()
    })
  })

  describe('mobile menu interaction', () => {
    it('should call toggleMobileMenu when menu button is clicked', () => {
      render(<Header />, { wrapper: Wrapper })
      const menuButton = screen.getByLabelText('메뉴 열기')

      fireEvent.click(menuButton)

      expect(mockToggleMobileMenu).toHaveBeenCalledTimes(1)
    })

    it('should have proper mobile menu button styling', () => {
      render(<Header />, { wrapper: Wrapper })
      const menuButton = screen.getByLabelText('메뉴 열기')
      expect(menuButton).toHaveClass('md:hidden')
    })
  })

  describe('styling and layout', () => {
    it('should have sticky positioning', () => {
      render(<Header />, { wrapper: Wrapper })
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('sticky', 'top-0')
    })

    it('should have bg-white background', () => {
      render(<Header />, { wrapper: Wrapper })
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('bg-white')
    })

    it('should have proper height', () => {
      render(<Header />, { wrapper: Wrapper })
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('h-20')
    })

    it('should have proper z-index', () => {
      render(<Header />, { wrapper: Wrapper })
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('z-40')
    })
  })

  describe('responsive design', () => {
    it('should show mobile menu button only on mobile', () => {
      render(<Header />, { wrapper: Wrapper })
      const menuButton = screen.getByLabelText('메뉴 열기')
      expect(menuButton).toHaveClass('md:hidden')
    })

    it('should have responsive padding', () => {
      render(<Header />, { wrapper: Wrapper })
      const header = screen.getByRole('banner')
      expect(header).toHaveClass('px-6', 'md:px-8')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA label on mobile menu button', () => {
      render(<Header />, { wrapper: Wrapper })
      expect(screen.getByLabelText('메뉴 열기')).toBeInTheDocument()
    })

    it('should use semantic header element', () => {
      render(<Header />, { wrapper: Wrapper })
      expect(screen.getByRole('banner')).toBeInTheDocument()
    })
  })

  describe('component integration', () => {
    it('should render all sub-components', () => {
      render(<Header quotaStatus={mockQuotaStatus} />, { wrapper: Wrapper })

      expect(screen.getAllByTestId('quota-badge')[0]).toBeInTheDocument()
      expect(screen.getByTestId('notification-center')).toBeInTheDocument()
      expect(screen.getByTestId('language-toggle')).toBeInTheDocument()
    })

    it('should have proper component ordering (left and right sections)', () => {
      const { container } = render(<Header quotaStatus={mockQuotaStatus} />, { wrapper: Wrapper })

      const header = container.querySelector('header')
      expect(header?.children.length).toBe(2) // Left and right sections
    })
  })

  describe('edge cases', () => {
    it('should handle empty quota status', () => {
      const emptyQuota = {
        campaignCreate: { used: 0, limit: 0 },
        aiCopyGen: { used: 0, limit: 0 },
        aiAnalysis: { used: 0, limit: 0 },
      }

      render(<Header quotaStatus={emptyQuota} />, { wrapper: Wrapper })
      expect(screen.getByText(/캠페인: 0\/0/)).toBeInTheDocument()
    })
  })
})
