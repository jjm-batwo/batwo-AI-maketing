import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AIInsights } from '@/presentation/components/dashboard/AIInsights'
import { NextIntlClientProvider } from 'next-intl'

// Mock next-intl translations
const mockTranslations = {
  title: 'AI 인사이트',
  empty: '아직 인사이트가 없습니다. 데이터가 수집되면 AI가 분석을 시작합니다.',
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

describe('AIInsights', () => {
  const mockInsights = [
    {
      id: 'insight-1',
      type: 'opportunity' as const,
      title: '전환율 개선 기회',
      description: '특정 연령대에서 전환율이 높습니다. 타겟팅을 조정하면 ROAS를 20% 개선할 수 있습니다.',
      action: {
        label: '타겟팅 조정하기',
        href: '/campaigns/123/edit',
      },
    },
    {
      id: 'insight-2',
      type: 'warning' as const,
      title: '예산 소진 주의',
      description: '현재 속도로는 이번 주 목요일에 예산이 모두 소진될 것으로 예상됩니다.',
    },
    {
      id: 'insight-3',
      type: 'tip' as const,
      title: '광고 소재 다양화',
      description: '동일한 소재가 7일 이상 사용 중입니다. 새로운 소재로 교체하면 피로도를 줄일 수 있습니다.',
      action: {
        label: '소재 업로드',
        href: '/campaigns/123/creatives',
      },
    },
    {
      id: 'insight-4',
      type: 'success' as const,
      title: '성과 목표 달성',
      description: '이번 주 ROAS 목표를 110% 달성했습니다.',
    },
  ]

  describe('rendering', () => {
    it('should render title with icon', () => {
      render(<AIInsights insights={mockInsights} />, { wrapper: Wrapper })
      expect(screen.getByText('AI 인사이트')).toBeInTheDocument()
      // Sparkles icon should be present (using svg query)
      const { container } = render(<AIInsights insights={mockInsights} />, { wrapper: Wrapper })
      const sparklesIcon = container.querySelector('.lucide-sparkles')
      expect(sparklesIcon).toBeInTheDocument()
    })

    it('should render all insights', () => {
      render(<AIInsights insights={mockInsights} />, { wrapper: Wrapper })
      expect(screen.getByText('전환율 개선 기회')).toBeInTheDocument()
      expect(screen.getByText('예산 소진 주의')).toBeInTheDocument()
      expect(screen.getByText('광고 소재 다양화')).toBeInTheDocument()
      expect(screen.getByText('성과 목표 달성')).toBeInTheDocument()
    })

    it('should render insight descriptions', () => {
      render(<AIInsights insights={mockInsights} />, { wrapper: Wrapper })
      expect(screen.getByText(/타겟팅을 조정하면/)).toBeInTheDocument()
      expect(screen.getByText(/현재 속도로는/)).toBeInTheDocument()
    })
  })

  describe('insight types and styling', () => {
    it('should apply correct styling for opportunity type', () => {
      render(<AIInsights insights={[mockInsights[0]]} />, { wrapper: Wrapper })
      const insightCard = screen.getByText('전환율 개선 기회').closest('div')?.parentElement?.parentElement
      expect(insightCard).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-700')
    })

    it('should apply correct styling for warning type', () => {
      render(<AIInsights insights={[mockInsights[1]]} />, { wrapper: Wrapper })
      const insightCard = screen.getByText('예산 소진 주의').closest('div')?.parentElement?.parentElement
      expect(insightCard).toHaveClass('bg-amber-50', 'border-amber-200', 'text-amber-700')
    })

    it('should apply correct styling for tip type', () => {
      render(<AIInsights insights={[mockInsights[2]]} />, { wrapper: Wrapper })
      const insightCard = screen.getByText('광고 소재 다양화').closest('div')?.parentElement?.parentElement
      expect(insightCard).toHaveClass('bg-purple-50', 'border-purple-200', 'text-purple-700')
    })

    it('should apply correct styling for success type', () => {
      render(<AIInsights insights={[mockInsights[3]]} />, { wrapper: Wrapper })
      const insightCard = screen.getByText('성과 목표 달성').closest('div')?.parentElement?.parentElement
      expect(insightCard).toHaveClass('bg-green-50', 'border-green-200', 'text-green-700')
    })
  })

  describe('action buttons', () => {
    it('should render action button when action is provided', () => {
      render(<AIInsights insights={[mockInsights[0]]} />, { wrapper: Wrapper })
      const actionButton = screen.getByText(/타겟팅 조정하기/)
      expect(actionButton).toBeInTheDocument()
    })

    it('should link to correct href', () => {
      render(<AIInsights insights={[mockInsights[0]]} />, { wrapper: Wrapper })
      const actionLink = screen.getByText(/타겟팅 조정하기/).closest('a')
      expect(actionLink).toHaveAttribute('href', '/campaigns/123/edit')
    })

    it('should not render action button when action is not provided', () => {
      render(<AIInsights insights={[mockInsights[1]]} />, { wrapper: Wrapper })
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    })

    it('should have proper button styling', () => {
      render(<AIInsights insights={[mockInsights[0]]} />, { wrapper: Wrapper })
      const actionLink = screen.getByText(/타겟팅 조정하기/).closest('a')
      expect(actionLink).toBeInTheDocument()
    })
  })

  describe('refresh functionality', () => {
    it('should render refresh button when onRefresh is provided', () => {
      const onRefresh = vi.fn()
      render(<AIInsights insights={mockInsights} onRefresh={onRefresh} />, { wrapper: Wrapper })

      const refreshButton = screen.getByRole('button')
      expect(refreshButton).toBeInTheDocument()
    })

    it('should call onRefresh when button is clicked', () => {
      const onRefresh = vi.fn()
      render(<AIInsights insights={mockInsights} onRefresh={onRefresh} />, { wrapper: Wrapper })

      const refreshButton = screen.getByRole('button')
      fireEvent.click(refreshButton)

      expect(onRefresh).toHaveBeenCalledTimes(1)
    })

    it('should not render refresh button when onRefresh is not provided', () => {
      render(<AIInsights insights={mockInsights} />, { wrapper: Wrapper })
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      render(<AIInsights isLoading />, { wrapper: Wrapper })
      const skeletons = screen.getAllByRole('generic').filter(el =>
        el.className.includes('animate-pulse')
      )
      expect(skeletons.length).toBeGreaterThan(0)
    })

    it('should not show insights when loading', () => {
      render(<AIInsights insights={mockInsights} isLoading />, { wrapper: Wrapper })
      expect(screen.queryByText('전환율 개선 기회')).not.toBeInTheDocument()
    })

    it('should render correct number of skeleton items', () => {
      render(<AIInsights isLoading />, { wrapper: Wrapper })
      const skeletonCards = screen.getAllByRole('generic').filter(el =>
        el.className.includes('rounded-lg') && el.className.includes('border')
      )
      expect(skeletonCards.length).toBe(3)
    })
  })

  describe('empty state', () => {
    it('should show empty message when no insights', () => {
      render(<AIInsights insights={[]} />, { wrapper: Wrapper })
      expect(screen.getByText(/아직 인사이트가 없습니다/)).toBeInTheDocument()
    })

    it('should show empty icon when no insights', () => {
      const { container } = render(<AIInsights insights={[]} />, { wrapper: Wrapper })
      const emptyIcon = container.querySelector('.lucide-sparkles')
      expect(emptyIcon).toBeInTheDocument()
    })

    it('should handle undefined insights prop', () => {
      render(<AIInsights />, { wrapper: Wrapper })
      expect(screen.getByText(/아직 인사이트가 없습니다/)).toBeInTheDocument()
    })
  })

  describe('layout and styling', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <AIInsights insights={mockInsights} className="custom-class" />,
        { wrapper: Wrapper }
      )
      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })

    it('should have proper spacing between insights', () => {
      const { container } = render(<AIInsights insights={mockInsights} />, { wrapper: Wrapper })
      const insightsContainer = container.querySelector('.space-y-3')
      expect(insightsContainer).toBeInTheDocument()
    })

    it('should have hover effects', () => {
      render(<AIInsights insights={[mockInsights[0]]} />, { wrapper: Wrapper })
      const insightCard = screen.getByText('전환율 개선 기회').closest('div')?.parentElement?.parentElement
      expect(insightCard).toHaveClass('transition-all')
    })
  })

  describe('accessibility', () => {
    it('should have proper icon layout with flex', () => {
      render(<AIInsights insights={[mockInsights[0]]} />, { wrapper: Wrapper })
      const iconContainer = screen.getByText('전환율 개선 기회').closest('div')?.previousSibling
      expect(iconContainer).toBeInTheDocument()
    })

    it('should maintain proper heading hierarchy', () => {
      render(<AIInsights insights={mockInsights} />, { wrapper: Wrapper })
      // CardTitle should render as appropriate heading
      expect(screen.getByText('AI 인사이트')).toBeInTheDocument()
    })
  })

  describe('integration scenarios', () => {
    it('should handle mixed insights with and without actions', () => {
      render(<AIInsights insights={mockInsights} />, { wrapper: Wrapper })

      // Should have 2 action links (insight-1 and insight-3)
      const actionLinks = screen.getAllByRole('link')
      expect(actionLinks.length).toBe(2)
    })

    it('should render insights in correct order', () => {
      const { container } = render(<AIInsights insights={mockInsights} />, { wrapper: Wrapper })
      const titles = container.querySelectorAll('h4')
      const titlesArray = Array.from(titles).map(h => h.textContent)

      expect(titlesArray).toContain('전환율 개선 기회')
      expect(titlesArray).toContain('예산 소진 주의')
      expect(titlesArray).toContain('광고 소재 다양화')
      expect(titlesArray).toContain('성과 목표 달성')
    })
  })
})
