import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { AdSetTable } from '../../../../../src/presentation/components/campaign/AdSetTable'

// Mock shadcn/ui Table components
vi.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: React.PropsWithChildren) => (
    <table {...props}>{children}</table>
  ),
  TableHeader: ({ children, ...props }: React.PropsWithChildren) => (
    <thead {...props}>{children}</thead>
  ),
  TableBody: ({ children, ...props }: React.PropsWithChildren) => (
    <tbody {...props}>{children}</tbody>
  ),
  TableRow: ({
    children,
    onClick,
    ...props
  }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <tr onClick={onClick} {...props}>
      {children}
    </tr>
  ),
  TableHead: ({ children, ...props }: React.PropsWithChildren) => (
    <th {...props}>{children}</th>
  ),
  TableCell: ({ children, ...props }: React.PropsWithChildren) => (
    <td {...props}>{children}</td>
  ),
}))

vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

vi.mock('@/lib/utils/format', () => ({
  formatNumber: (n: number) => n.toLocaleString(),
  formatCurrency: (n: number) => `${n.toLocaleString()}원`,
  formatPercent: (n: number) => `${n.toFixed(2)}%`,
  formatMultiplier: (n: number) => `${n.toFixed(2)}x`,
}))

const mockAdSets = [
  {
    id: 'adset-1',
    name: '테스트 광고 세트 A',
    status: 'ACTIVE',
    dailyBudget: 50000,
    insights: {
      impressions: 10000,
      clicks: 500,
      spend: 25000,
      conversions: 20,
      revenue: 100000,
    },
  },
  {
    id: 'adset-2',
    name: '테스트 광고 세트 B',
    status: 'PAUSED',
    insights: {
      impressions: 5000,
      clicks: 100,
      spend: 10000,
      conversions: 5,
      revenue: 25000,
    },
  },
]

describe('AdSetTable', () => {
  describe('로딩 상태', () => {
    it('isLoading이 true이면 "로딩 중..." 텍스트를 표시한다', () => {
      render(<AdSetTable adSets={[]} isLoading={true} />)
      expect(screen.getByText('로딩 중...')).toBeInTheDocument()
    })

    it('isLoading이 true이면 테이블을 렌더링하지 않는다', () => {
      render(<AdSetTable adSets={mockAdSets} isLoading={true} />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('빈 상태', () => {
    it('광고 세트가 없으면 "광고 세트가 없습니다" 텍스트를 표시한다', () => {
      render(<AdSetTable adSets={[]} />)
      expect(screen.getByText('광고 세트가 없습니다')).toBeInTheDocument()
    })

    it('광고 세트가 없으면 테이블을 렌더링하지 않는다', () => {
      render(<AdSetTable adSets={[]} />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('데이터 렌더링', () => {
    it('광고 세트 이름을 표시한다', () => {
      render(<AdSetTable adSets={mockAdSets} />)
      expect(screen.getByText('테스트 광고 세트 A')).toBeInTheDocument()
      expect(screen.getByText('테스트 광고 세트 B')).toBeInTheDocument()
    })

    it('한국어 상태 레이블을 표시한다', () => {
      render(<AdSetTable adSets={mockAdSets} />)
      expect(screen.getByText('진행 중')).toBeInTheDocument()
      expect(screen.getByText('일시정지')).toBeInTheDocument()
    })

    it('테이블 헤더를 올바르게 렌더링한다', () => {
      render(<AdSetTable adSets={mockAdSets} />)
      expect(screen.getByText('이름')).toBeInTheDocument()
      expect(screen.getByText('상태')).toBeInTheDocument()
      expect(screen.getByText('일예산')).toBeInTheDocument()
      expect(screen.getByText('지출')).toBeInTheDocument()
      expect(screen.getByText('노출')).toBeInTheDocument()
      expect(screen.getByText('클릭')).toBeInTheDocument()
      expect(screen.getByText('CTR')).toBeInTheDocument()
      expect(screen.getByText('전환')).toBeInTheDocument()
      expect(screen.getByText('ROAS')).toBeInTheDocument()
    })

    it('dailyBudget가 없으면 "-"를 표시한다', () => {
      render(<AdSetTable adSets={mockAdSets} />)
      // adset-2 has no dailyBudget
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('dailyBudget가 있으면 포맷된 금액을 표시한다', () => {
      render(<AdSetTable adSets={mockAdSets} />)
      expect(screen.getByText('50,000원')).toBeInTheDocument()
    })
  })

  describe('onAdSetClick 콜백', () => {
    it('행 클릭 시 onAdSetClick 콜백에 올바른 ID를 전달한다', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<AdSetTable adSets={mockAdSets} onAdSetClick={handleClick} />)

      const row = screen.getByText('테스트 광고 세트 A').closest('tr')!
      await user.click(row)

      expect(handleClick).toHaveBeenCalledWith('adset-1')
    })

    it('onAdSetClick이 없으면 클릭해도 에러가 발생하지 않는다', async () => {
      const user = userEvent.setup()
      render(<AdSetTable adSets={mockAdSets} />)

      const row = screen.getByText('테스트 광고 세트 A').closest('tr')!
      await user.click(row)
      // No error thrown
    })
  })
})
