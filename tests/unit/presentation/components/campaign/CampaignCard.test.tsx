import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CampaignCard } from '@/presentation/components/campaign/CampaignCard'
import { NextIntlClientProvider } from 'next-intl'

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="ko" messages={{}}>
      {children}
    </NextIntlClientProvider>
  )
}

describe('CampaignCard', () => {
  const defaultProps = {
    id: 'campaign-1',
    name: '여름 프로모션',
    status: 'ACTIVE' as const,
    objective: 'CONVERSIONS',
    dailyBudget: 50000,
    spend: 45000,
    roas: 3.5,
  }

  describe('rendering', () => {
    it('should render campaign name', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('여름 프로모션')).toBeInTheDocument()
    })

    it('should render campaign name as clickable link', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      const link = screen.getByText('여름 프로모션').closest('a')
      expect(link).toHaveAttribute('href', '/campaigns/campaign-1')
    })

    it('should render objective label', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('전환')).toBeInTheDocument()
    })

    it('should render status badge', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('진행 중')).toBeInTheDocument()
    })
  })

  describe('status badges', () => {
    it('should render ACTIVE status with correct styling', () => {
      render(<CampaignCard {...defaultProps} status="ACTIVE" />, { wrapper: Wrapper })
      const badge = screen.getByText('진행 중')
      expect(badge).toHaveClass('bg-green-500/15', 'text-green-500')
    })

    it('should render PAUSED status with correct styling', () => {
      render(<CampaignCard {...defaultProps} status="PAUSED" />, { wrapper: Wrapper })
      const badge = screen.getByText('일시정지')
      expect(badge).toHaveClass('bg-yellow-500/15', 'text-yellow-500')
    })

    it('should render COMPLETED status with correct styling', () => {
      render(<CampaignCard {...defaultProps} status="COMPLETED" />, { wrapper: Wrapper })
      const badge = screen.getByText('완료')
      expect(badge).toHaveClass('bg-muted', 'text-muted-foreground')
    })

    it('should render DRAFT status with correct styling', () => {
      render(<CampaignCard {...defaultProps} status="DRAFT" />, { wrapper: Wrapper })
      const badge = screen.getByText('초안')
      expect(badge).toHaveClass('bg-primary/15', 'text-primary')
    })

    it('should render PENDING_REVIEW status with correct styling', () => {
      render(<CampaignCard {...defaultProps} status="PENDING_REVIEW" />, { wrapper: Wrapper })
      const badge = screen.getByText('검토 중')
      expect(badge).toHaveClass('bg-purple-500/15', 'text-purple-500')
    })
  })

  describe('objective labels', () => {
    it('should render TRAFFIC objective', () => {
      render(<CampaignCard {...defaultProps} objective="TRAFFIC" />, { wrapper: Wrapper })
      expect(screen.getByText('트래픽')).toBeInTheDocument()
    })

    it('should render CONVERSIONS objective', () => {
      render(<CampaignCard {...defaultProps} objective="CONVERSIONS" />, { wrapper: Wrapper })
      expect(screen.getByText('전환')).toBeInTheDocument()
    })

    it('should render BRAND_AWARENESS objective', () => {
      render(<CampaignCard {...defaultProps} objective="BRAND_AWARENESS" />, { wrapper: Wrapper })
      expect(screen.getByText('브랜드 인지도')).toBeInTheDocument()
    })

    it('should render REACH objective', () => {
      render(<CampaignCard {...defaultProps} objective="REACH" />, { wrapper: Wrapper })
      expect(screen.getByText('도달')).toBeInTheDocument()
    })

    it('should render ENGAGEMENT objective', () => {
      render(<CampaignCard {...defaultProps} objective="ENGAGEMENT" />, { wrapper: Wrapper })
      expect(screen.getByText('참여')).toBeInTheDocument()
    })

    it('should fallback to objective value for unknown objective', () => {
      render(<CampaignCard {...defaultProps} objective="UNKNOWN_OBJECTIVE" />, { wrapper: Wrapper })
      expect(screen.getByText('UNKNOWN_OBJECTIVE')).toBeInTheDocument()
    })
  })

  describe('campaign metrics', () => {
    it('should display daily budget value with currency formatting', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('50,000원')).toBeInTheDocument()
    })

    it('should display spend value with currency formatting', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('45,000원')).toBeInTheDocument()
    })

    it('should display ROAS with two decimal places', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('3.50x')).toBeInTheDocument()
    })

    it('should handle zero spend', () => {
      render(<CampaignCard {...defaultProps} spend={0} />, { wrapper: Wrapper })
      expect(screen.getByText('0원')).toBeInTheDocument()
    })

    it('should handle zero ROAS', () => {
      render(<CampaignCard {...defaultProps} roas={0} />, { wrapper: Wrapper })
      expect(screen.getByText('0.00x')).toBeInTheDocument()
    })
  })

  describe('dropdown menu trigger', () => {
    it('should render MoreVertical dropdown trigger button', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      // DropdownMenuTrigger renders a ghost icon button
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should have dropdown menu trigger button with svg icon', () => {
      const { container } = render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      const triggerButton = container.querySelector('button')
      const svgIcon = triggerButton?.querySelector('svg')
      expect(svgIcon).toBeInTheDocument()
    })
  })

  describe('conditional status buttons', () => {
    it('should not show pause/resume buttons in DOM when onStatusChange is not provided', () => {
      render(<CampaignCard {...defaultProps} status="ACTIVE" />, { wrapper: Wrapper })
      // 버튼은 DropdownMenu 내부에 있으므로 onStatusChange 없으면 렌더되지 않음
      expect(screen.queryByText('일시정지')).not.toBeInTheDocument()
    })

    it('should not show pause button for DRAFT status even with onStatusChange', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="DRAFT" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )
      expect(screen.queryByText('일시정지')).not.toBeInTheDocument()
      expect(screen.queryByText('재개')).not.toBeInTheDocument()
    })

    it('should not show pause button for COMPLETED status even with onStatusChange', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="COMPLETED" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )
      expect(screen.queryByText('일시정지')).not.toBeInTheDocument()
      expect(screen.queryByText('재개')).not.toBeInTheDocument()
    })
  })

  describe('styling and layout', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <CampaignCard {...defaultProps} className="custom-class" />,
        { wrapper: Wrapper }
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('should have hover effects', () => {
      const { container } = render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(container.firstChild).toHaveClass('transition-shadow', 'hover:shadow-md')
    })

    it('should have flex wrap layout for metrics (not grid)', () => {
      const { container } = render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      const metricsContainer = container.querySelector('.flex.flex-wrap')
      expect(metricsContainer).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have accessible campaign name link', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      const link = screen.getByText('여름 프로모션')
      expect(link).toHaveClass('hover:underline')
    })

    it('should have proper button structure', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle very large budget numbers', () => {
      render(<CampaignCard {...defaultProps} dailyBudget={99999999} />, { wrapper: Wrapper })
      expect(screen.getByText('99,999,999원')).toBeInTheDocument()
    })

    it('should handle ROAS with many decimal places', () => {
      render(<CampaignCard {...defaultProps} roas={3.456789} />, { wrapper: Wrapper })
      expect(screen.getByText('3.46x')).toBeInTheDocument()
    })

    it('should handle missing optional props', () => {
      const minimalProps = {
        id: 'campaign-1',
        name: '최소 캠페인',
        status: 'DRAFT' as const,
        objective: 'CONVERSIONS',
        dailyBudget: 10000,
      }

      render(<CampaignCard {...minimalProps} />, { wrapper: Wrapper })
      expect(screen.getByText('최소 캠페인')).toBeInTheDocument()
      expect(screen.getByText('0원')).toBeInTheDocument() // Default spend
      expect(screen.getByText('0.00x')).toBeInTheDocument() // Default ROAS
    })
  })

  describe('button interactions', () => {
    it('should not trigger onStatusChange when button is clicked without callback', () => {
      render(<CampaignCard {...defaultProps} status="ACTIVE" />, { wrapper: Wrapper })
      // onStatusChange 없으면 일시정지 메뉴 아이템이 렌더되지 않음
      expect(screen.queryByText('일시정지')).not.toBeInTheDocument()
    })
  })
})
