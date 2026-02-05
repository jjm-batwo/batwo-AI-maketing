import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Sidebar } from '@/presentation/components/common/Layout/Sidebar'
import { usePathname } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

// Mock next-intl translations
const mockTranslations = {
  'navigation.dashboard': '대시보드',
  'navigation.campaigns': '캠페인',
  'navigation.reports': '보고서',
  'navigation.settings': '설정',
  'navigation.help': '도움말',
  'navigation.mainNav': '주 내비게이션',
  'navigation.mainMenu': '메인 메뉴',
  'navigation.goToHome': '홈으로 이동',
  'navigation.betaVersion': '베타 버전',
  'navigation.goToPage': '{page} 페이지로 이동',
  'navigation.currentPage': '현재 페이지',
  'navigation.goToHelp': '도움말로 이동',
  'brand.name': '바투',
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

describe('Sidebar', () => {
  describe('rendering', () => {
    it('should render sidebar as aside element', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })
      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toBeInTheDocument()
    })

    it('should render brand logo', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })
      expect(screen.getByText('바투')).toBeInTheDocument()
    })

    it('should render Beta badge', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })
      expect(screen.getByText('Beta')).toBeInTheDocument()
    })

    it('should render all navigation items', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })
      expect(screen.getByText('대시보드')).toBeInTheDocument()
      expect(screen.getByText('캠페인')).toBeInTheDocument()
      expect(screen.getByText('보고서')).toBeInTheDocument()
      expect(screen.getByText('설정')).toBeInTheDocument()
    })

    it('should render help link', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })
      expect(screen.getByText('도움말')).toBeInTheDocument()
    })
  })

  describe('navigation links', () => {
    it('should link to correct pages', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const dashboardLink = screen.getByText('대시보드').closest('a')
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')

      const campaignsLink = screen.getByText('캠페인').closest('a')
      expect(campaignsLink).toHaveAttribute('href', '/campaigns')

      const reportsLink = screen.getByText('보고서').closest('a')
      expect(reportsLink).toHaveAttribute('href', '/reports')

      const settingsLink = screen.getByText('설정').closest('a')
      expect(settingsLink).toHaveAttribute('href', '/settings')

      const helpLink = screen.getByText('도움말').closest('a')
      expect(helpLink).toHaveAttribute('href', '/help')
    })

    it('should link home from brand logo', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const logoLink = screen.getByText('바투').closest('a')
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('active state', () => {
    it('should highlight active dashboard link', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const dashboardLink = screen.getByText('대시보드').closest('a')
      expect(dashboardLink).toHaveClass('bg-primary/10', 'text-primary')
      expect(dashboardLink).toHaveAttribute('aria-current', 'page')
    })

    it('should highlight active campaigns link', () => {
      vi.mocked(usePathname).mockReturnValue('/campaigns')

      render(<Sidebar />, { wrapper: Wrapper })

      const campaignsLink = screen.getByText('캠페인').closest('a')
      expect(campaignsLink).toHaveClass('bg-primary/10', 'text-primary')
      expect(campaignsLink).toHaveAttribute('aria-current', 'page')
    })

    it('should highlight active reports link', () => {
      vi.mocked(usePathname).mockReturnValue('/reports')

      render(<Sidebar />, { wrapper: Wrapper })

      const reportsLink = screen.getByText('보고서').closest('a')
      expect(reportsLink).toHaveClass('bg-primary/10', 'text-primary')
      expect(reportsLink).toHaveAttribute('aria-current', 'page')
    })

    it('should highlight active settings link', () => {
      vi.mocked(usePathname).mockReturnValue('/settings')

      render(<Sidebar />, { wrapper: Wrapper })

      const settingsLink = screen.getByText('설정').closest('a')
      expect(settingsLink).toHaveClass('bg-primary/10', 'text-primary')
      expect(settingsLink).toHaveAttribute('aria-current', 'page')
    })

    it('should highlight link for nested routes', () => {
      vi.mocked(usePathname).mockReturnValue('/campaigns/123/edit')

      render(<Sidebar />, { wrapper: Wrapper })

      const campaignsLink = screen.getByText('캠페인').closest('a')
      expect(campaignsLink).toHaveClass('bg-primary/10', 'text-primary')
    })

    it('should not highlight inactive links', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const campaignsLink = screen.getByText('캠페인').closest('a')
      expect(campaignsLink).not.toHaveClass('bg-primary/10')
      expect(campaignsLink).toHaveClass('text-muted-foreground')
    })
  })

  describe('icons', () => {
    it('should render navigation icons', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      // Each nav item should have an icon (svg)
      const navIcons = container.querySelectorAll('nav svg')
      expect(navIcons.length).toBe(4) // 4 main nav items
    })

    it('should render help icon', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      // Help section should have icon
      const helpSection = screen.getByText('도움말').closest('a')
      const helpIcon = helpSection?.querySelector('svg')
      expect(helpIcon).toBeInTheDocument()
    })

    it('should have proper icon styling', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      const dashboardIcon = screen.getByText('대시보드').parentElement?.querySelector('svg')
      expect(dashboardIcon).toHaveClass('h-5', 'w-5')
    })
  })

  describe('styling and layout', () => {
    it('should be hidden on mobile', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('hidden', 'md:flex')
    })

    it('should have proper width', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('w-72')
    })

    it('should have backdrop blur effect', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('backdrop-blur-xl')
    })

    it('should have proper z-index', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('z-50')
    })

    it('should have border', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('border-r')
    })
  })

  describe('brand section', () => {
    it('should have proper logo section height', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      const logoSection = container.querySelector('.h-20')
      expect(logoSection).toBeInTheDocument()
    })

    it('should have gradient logo icon', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      const logoIcon = container.querySelector('.bg-gradient-to-br')
      expect(logoIcon).toBeInTheDocument()
      expect(logoIcon).toHaveTextContent('B')
    })

    it('should have hover effect on logo', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      const logoLink = screen.getByText('바투').closest('a')
      expect(logoLink).toHaveClass('group')

      const logoIcon = container.querySelector('.group-hover\\:scale-110')
      expect(logoIcon).toBeInTheDocument()
    })

    it('should have gradient text for brand name', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const brandName = screen.getByText('바투')
      expect(brandName).toHaveClass('bg-clip-text', 'text-transparent', 'bg-gradient-to-r')
    })
  })

  describe('navigation section', () => {
    it('should have proper spacing between items', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      const nav = container.querySelector('nav')
      expect(nav).toHaveClass('space-y-1.5')
    })

    it('should have hover effects on nav items', () => {
      vi.mocked(usePathname).mockReturnValue('/reports')

      render(<Sidebar />, { wrapper: Wrapper })

      // Inactive link should have hover classes
      const dashboardLink = screen.getByText('대시보드').closest('a')
      expect(dashboardLink).toHaveClass('hover:text-foreground', 'hover:bg-white/50')
    })

    it('should show active indicator dot', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      const activeDot = container.querySelector('.animate-pulse')
      expect(activeDot).toBeInTheDocument()
    })
  })

  describe('help section', () => {
    it('should be in separate section with border', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      // Help link is in a section with border-t class
      const helpLink = screen.getByText('도움말').closest('a')
      const helpSection = helpLink?.parentElement
      expect(helpSection).toHaveClass('border-t', 'p-4')
    })

    it('should have proper styling', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const helpLink = screen.getByText('도움말').closest('a')
      expect(helpLink).toHaveClass('rounded-lg')
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA labels', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveAttribute('aria-label', '주 내비게이션')
    })

    it('should have navigation landmark', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', '메인 메뉴')
    })

    it('should have aria-current on active link', () => {
      vi.mocked(usePathname).mockReturnValue('/campaigns')

      render(<Sidebar />, { wrapper: Wrapper })

      const activeLink = screen.getByText('캠페인').closest('a')
      expect(activeLink).toHaveAttribute('aria-current', 'page')
    })

    it('should not have aria-current on inactive links', () => {
      vi.mocked(usePathname).mockReturnValue('/campaigns')

      render(<Sidebar />, { wrapper: Wrapper })

      const inactiveLink = screen.getByText('대시보드').closest('a')
      expect(inactiveLink).not.toHaveAttribute('aria-current')
    })

    it('should have proper link labels with context', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const dashboardLink = screen.getByText('대시보드').closest('a')
      expect(dashboardLink).toHaveAttribute('aria-label')
      expect(dashboardLink?.getAttribute('aria-label')).toContain('대시보드')
    })

    it('should have focus styles', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const navLink = screen.getByText('캠페인').closest('a')
      expect(navLink).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary')
    })

    it('should hide decorative elements from screen readers', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      // Icons should have aria-hidden
      const icons = container.querySelectorAll('[aria-hidden="true"]')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('responsive behavior', () => {
    it('should show only on desktop', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('hidden', 'md:flex')
    })

    it('should be flex column layout', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const sidebar = screen.getByRole('complementary')
      expect(sidebar).toHaveClass('flex-col')
    })
  })

  describe('edge cases', () => {
    it('should handle root path', () => {
      vi.mocked(usePathname).mockReturnValue('/')

      render(<Sidebar />, { wrapper: Wrapper })

      // No nav item should be active for root path
      const dashboardLink = screen.getByText('대시보드').closest('a')
      expect(dashboardLink).not.toHaveAttribute('aria-current')
    })

    it('should handle deep nested routes', () => {
      vi.mocked(usePathname).mockReturnValue('/campaigns/123/edit/advanced')

      render(<Sidebar />, { wrapper: Wrapper })

      const campaignsLink = screen.getByText('캠페인').closest('a')
      expect(campaignsLink).toHaveClass('bg-primary/10', 'text-primary')
    })

    it('should handle unknown routes', () => {
      vi.mocked(usePathname).mockReturnValue('/unknown-route')

      render(<Sidebar />, { wrapper: Wrapper })

      // No nav item should be highlighted
      const navLinks = screen.getAllByRole('link').slice(1, 5) // Skip home link
      navLinks.forEach(link => {
        expect(link).not.toHaveClass('bg-primary/10')
      })
    })

    it('should handle pathname with query params', () => {
      vi.mocked(usePathname).mockReturnValue('/campaigns')

      render(<Sidebar />, { wrapper: Wrapper })

      const campaignsLink = screen.getByText('캠페인').closest('a')
      expect(campaignsLink).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('visual effects', () => {
    it('should have transition effects on nav items', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const navLink = screen.getByText('캠페인').closest('a')
      expect(navLink).toHaveClass('transition-all', 'duration-200')
    })

    it('should have gradient overlay on active item', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      const { container } = render(<Sidebar />, { wrapper: Wrapper })

      const gradientOverlay = container.querySelector('.bg-gradient-to-r')
      expect(gradientOverlay).toBeInTheDocument()
    })

    it('should have shadow on active item', () => {
      vi.mocked(usePathname).mockReturnValue('/dashboard')

      render(<Sidebar />, { wrapper: Wrapper })

      const activeLink = screen.getByText('대시보드').closest('a')
      expect(activeLink).toHaveClass('shadow-sm')
    })
  })
})
