import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { QuotaStatusBadge } from '@/presentation/components/quota/QuotaStatusBadge'

describe('QuotaStatusBadge', () => {
  it('should render remaining quota correctly', () => {
    render(<QuotaStatusBadge used={3} limit={5} label="캠페인 생성" />)
    expect(screen.getByText('캠페인 생성 2/5회 남음')).toBeInTheDocument()
  })

  it('should show warning style when quota is low', () => {
    render(<QuotaStatusBadge used={4} limit={5} label="캠페인 생성" />)
    const badge = screen.getByTestId('quota-badge')
    expect(badge).toHaveClass('bg-yellow-100')
  })

  it('should show error style when quota is exhausted', () => {
    render(<QuotaStatusBadge used={5} limit={5} label="캠페인 생성" />)
    const badge = screen.getByTestId('quota-badge')
    expect(badge).toHaveClass('bg-red-100')
  })

  it('should show success style when quota is sufficient', () => {
    render(<QuotaStatusBadge used={1} limit={5} label="캠페인 생성" />)
    const badge = screen.getByTestId('quota-badge')
    expect(badge).toHaveClass('bg-green-100')
  })

  it('should render with custom period label', () => {
    render(
      <QuotaStatusBadge
        used={10}
        limit={20}
        label="AI 카피"
        period="오늘"
      />
    )
    expect(screen.getByText('AI 카피 10/20회 남음 (오늘)')).toBeInTheDocument()
  })
})
