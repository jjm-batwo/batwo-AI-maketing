import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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
      expect(badge).toHaveClass('bg-green-100', 'text-green-700')
    })

    it('should render PAUSED status with correct styling', () => {
      render(<CampaignCard {...defaultProps} status="PAUSED" />, { wrapper: Wrapper })
      const badge = screen.getByText('일시정지')
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700')
    })

    it('should render COMPLETED status with correct styling', () => {
      render(<CampaignCard {...defaultProps} status="COMPLETED" />, { wrapper: Wrapper })
      const badge = screen.getByText('완료')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-700')
    })

    it('should render DRAFT status with correct styling', () => {
      render(<CampaignCard {...defaultProps} status="DRAFT" />, { wrapper: Wrapper })
      const badge = screen.getByText('초안')
      expect(badge).toHaveClass('bg-blue-100', 'text-blue-700')
    })

    it('should render PENDING_REVIEW status with correct styling', () => {
      render(<CampaignCard {...defaultProps} status="PENDING_REVIEW" />, { wrapper: Wrapper })
      const badge = screen.getByText('검토 중')
      expect(badge).toHaveClass('bg-purple-100', 'text-purple-700')
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
    it('should display daily budget with currency formatting', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('일일 예산')).toBeInTheDocument()
      expect(screen.getByText('50,000원')).toBeInTheDocument()
    })

    it('should display spend with currency formatting', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('지출')).toBeInTheDocument()
      expect(screen.getByText('45,000원')).toBeInTheDocument()
    })

    it('should display ROAS with two decimal places', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('ROAS')).toBeInTheDocument()
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

  describe('action buttons for ACTIVE campaigns', () => {
    it('should show pause button for ACTIVE campaign', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="ACTIVE" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )
      expect(screen.getByText('일시정지')).toBeInTheDocument()
    })

    it('should call onStatusChange with PAUSED when pause is clicked', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="ACTIVE" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )

      fireEvent.click(screen.getByText('일시정지'))
      expect(onStatusChange).toHaveBeenCalledWith('campaign-1', 'PAUSED')
    })
  })

  describe('action buttons for PAUSED campaigns', () => {
    it('should show resume button for PAUSED campaign', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="PAUSED" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )
      expect(screen.getByText('재개')).toBeInTheDocument()
    })

    it('should call onStatusChange with ACTIVE when resume is clicked', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="PAUSED" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )

      fireEvent.click(screen.getByText('재개'))
      expect(onStatusChange).toHaveBeenCalledWith('campaign-1', 'ACTIVE')
    })
  })

  describe('edit button', () => {
    it('should show edit button for non-completed campaigns', () => {
      render(<CampaignCard {...defaultProps} status="ACTIVE" />, { wrapper: Wrapper })
      expect(screen.getByText('수정')).toBeInTheDocument()
    })

    it('should link to edit page', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      const editLink = screen.getByText('수정').closest('a')
      expect(editLink).toHaveAttribute('href', '/campaigns/campaign-1/edit')
    })

    it('should not show edit button for COMPLETED campaigns', () => {
      render(<CampaignCard {...defaultProps} status="COMPLETED" />, { wrapper: Wrapper })
      expect(screen.queryByText('수정')).not.toBeInTheDocument()
    })
  })

  describe('analytics button', () => {
    it('should show analytics button', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      expect(screen.getByText('분석')).toBeInTheDocument()
    })

    it('should link to analytics page', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      const analyticsLink = screen.getByText('분석').closest('a')
      expect(analyticsLink).toHaveAttribute('href', '/campaigns/campaign-1/analytics')
    })

    it('should always show analytics button regardless of status', () => {
      const statuses: Array<'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT'> = ['ACTIVE', 'PAUSED', 'COMPLETED', 'DRAFT']

      statuses.forEach(status => {
        const { unmount } = render(
          <CampaignCard {...defaultProps} status={status} />,
          { wrapper: Wrapper }
        )
        expect(screen.getByText('분석')).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('more menu button', () => {
    it('should render more menu button', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      const moreButton = screen.getByRole('button', { name: '' })
      expect(moreButton).toBeInTheDocument()
    })
  })

  describe('conditional status buttons', () => {
    it('should not show pause/resume buttons when onStatusChange is not provided', () => {
      render(<CampaignCard {...defaultProps} status="ACTIVE" />, { wrapper: Wrapper })
      expect(screen.queryByText('일시정지')).not.toBeInTheDocument()
    })

    it('should not show pause button for DRAFT status', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="DRAFT" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )
      expect(screen.queryByText('일시정지')).not.toBeInTheDocument()
      expect(screen.queryByText('재개')).not.toBeInTheDocument()
    })

    it('should not show pause button for COMPLETED status', () => {
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

    it('should have proper grid layout for metrics', () => {
      const { container } = render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })
      const metricsGrid = container.querySelector('.grid-cols-3')
      expect(metricsGrid).toBeInTheDocument()
    })
  })

  describe('button icons', () => {
    it('should show Pause icon on pause button', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="ACTIVE" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )

      const pauseButton = screen.getByText('일시정지')
      const icon = pauseButton.parentElement?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should show Play icon on resume button', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="PAUSED" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )

      const resumeButton = screen.getByText('재개')
      const icon = resumeButton.parentElement?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should show Pencil icon on edit button', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })

      const editButton = screen.getByText('수정')
      const icon = editButton.parentElement?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should show BarChart3 icon on analytics button', () => {
      render(<CampaignCard {...defaultProps} />, { wrapper: Wrapper })

      const analyticsButton = screen.getByText('분석')
      const icon = analyticsButton.parentElement?.querySelector('svg')
      expect(icon).toBeInTheDocument()
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
      // No pause button should be rendered without onStatusChange
      expect(screen.queryByText('일시정지')).not.toBeInTheDocument()
    })

    it('should maintain button state after click', () => {
      const onStatusChange = vi.fn()
      render(
        <CampaignCard {...defaultProps} status="ACTIVE" onStatusChange={onStatusChange} />,
        { wrapper: Wrapper }
      )

      const pauseButton = screen.getByText('일시정지')
      fireEvent.click(pauseButton)

      // Button should still be in DOM after click (status doesn't change automatically)
      expect(screen.getByText('일시정지')).toBeInTheDocument()
    })
  })
})
