import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { QuotaExceededDialog } from '@/presentation/components/quota/QuotaExceededDialog'

describe('QuotaExceededDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnUpgrade = vi.fn()

  it('should render dialog when open', () => {
    render(
      <QuotaExceededDialog
        open
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        type="CAMPAIGN_CREATE"
      />
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(
      <QuotaExceededDialog
        open={false}
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        type="CAMPAIGN_CREATE"
      />
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('should show correct message for CAMPAIGN_CREATE', () => {
    render(
      <QuotaExceededDialog
        open
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        type="CAMPAIGN_CREATE"
      />
    )
    expect(
      screen.getByText('이번 주 캠페인 생성 횟수(5회)를 모두 사용했어요')
    ).toBeInTheDocument()
  })

  it('should show correct message for AI_COPY_GEN', () => {
    render(
      <QuotaExceededDialog
        open
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        type="AI_COPY_GEN"
      />
    )
    expect(
      screen.getByText('오늘 AI 카피 생성 횟수(20회)를 모두 사용했어요')
    ).toBeInTheDocument()
  })

  it('should show correct message for AI_ANALYSIS', () => {
    render(
      <QuotaExceededDialog
        open
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        type="AI_ANALYSIS"
      />
    )
    expect(
      screen.getByText('이번 주 AI 분석 횟수(5회)를 모두 사용했어요')
    ).toBeInTheDocument()
  })

  it('should call onClose when close button clicked', () => {
    render(
      <QuotaExceededDialog
        open
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        type="CAMPAIGN_CREATE"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onUpgrade when upgrade button clicked', () => {
    render(
      <QuotaExceededDialog
        open
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        type="CAMPAIGN_CREATE"
      />
    )
    fireEvent.click(screen.getByRole('button', { name: '유료 플랜 알아보기' }))
    expect(mockOnUpgrade).toHaveBeenCalled()
  })

  it('should show upgrade CTA', () => {
    render(
      <QuotaExceededDialog
        open
        onClose={mockOnClose}
        onUpgrade={mockOnUpgrade}
        type="CAMPAIGN_CREATE"
      />
    )
    expect(
      screen.getByText('더 많은 기능을 원하시면')
    ).toBeInTheDocument()
  })
})
