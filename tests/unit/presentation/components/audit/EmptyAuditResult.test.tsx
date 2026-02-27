import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyAuditResult } from '@/presentation/components/audit/EmptyAuditResult'

describe('EmptyAuditResult', () => {
  const defaultProps = { analyzedAt: '2026-02-27T10:00:00Z' }

  it('캠페인이 없다는 안내 텍스트를 렌더링한다', () => {
    render(<EmptyAuditResult {...defaultProps} />)

    expect(
      screen.getByText('광고 계정에 캠페인이 없어 분석할 수 없습니다'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('캠페인을 생성한 후 다시 진단해보세요'),
    ).toBeInTheDocument()
  })

  it('"무료 진단 다시 받기" 버튼이 존재하고 href="/"이다', () => {
    render(<EmptyAuditResult {...defaultProps} />)

    const link = screen.getByText('무료 진단 다시 받기')
    expect(link).toBeInTheDocument()
    expect(link.closest('a')).toHaveAttribute('href', '/')
  })

  it('분석 시도 날짜를 표시한다', () => {
    render(<EmptyAuditResult {...defaultProps} />)

    expect(screen.getByText(/분석 시도:/)).toBeInTheDocument()
  })
})
