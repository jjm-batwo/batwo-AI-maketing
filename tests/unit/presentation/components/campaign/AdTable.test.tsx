import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type React from 'react'
import { AdTable } from '../../../../../src/presentation/components/campaign/AdTable'

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
  TableRow: ({ children, ...props }: React.PropsWithChildren) => (
    <tr {...props}>{children}</tr>
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

const mockAds = [
  {
    id: 'ad-1',
    name: '테스트 광고 A',
    status: 'ACTIVE',
    insights: {
      impressions: 8000,
      clicks: 400,
      spend: 20000,
      conversions: 15,
      revenue: 75000,
    },
  },
  {
    id: 'ad-2',
    name: '테스트 광고 B',
    status: 'PAUSED',
    insights: {
      impressions: 3000,
      clicks: 60,
      spend: 5000,
      conversions: 2,
      revenue: 10000,
    },
  },
]

describe('AdTable', () => {
  describe('로딩 상태', () => {
    it('isLoading이 true이면 "로딩 중..." 텍스트를 표시한다', () => {
      render(<AdTable ads={[]} isLoading={true} />)
      expect(screen.getByText('로딩 중...')).toBeInTheDocument()
    })

    it('isLoading이 true이면 테이블을 렌더링하지 않는다', () => {
      render(<AdTable ads={mockAds} isLoading={true} />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('빈 상태', () => {
    it('광고가 없으면 "광고가 없습니다" 텍스트를 표시한다', () => {
      render(<AdTable ads={[]} />)
      expect(screen.getByText('광고가 없습니다')).toBeInTheDocument()
    })

    it('광고가 없으면 테이블을 렌더링하지 않는다', () => {
      render(<AdTable ads={[]} />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('데이터 렌더링', () => {
    it('광고 이름을 표시한다', () => {
      render(<AdTable ads={mockAds} />)
      expect(screen.getByText('테스트 광고 A')).toBeInTheDocument()
      expect(screen.getByText('테스트 광고 B')).toBeInTheDocument()
    })

    it('한국어 상태 레이블을 표시한다', () => {
      render(<AdTable ads={mockAds} />)
      expect(screen.getByText('진행 중')).toBeInTheDocument()
      expect(screen.getByText('일시정지')).toBeInTheDocument()
    })

    it('테이블 헤더를 올바르게 렌더링한다', () => {
      render(<AdTable ads={mockAds} />)
      expect(screen.getByText('이름')).toBeInTheDocument()
      expect(screen.getByText('상태')).toBeInTheDocument()
      expect(screen.getByText('지출')).toBeInTheDocument()
      expect(screen.getByText('노출')).toBeInTheDocument()
      expect(screen.getByText('클릭')).toBeInTheDocument()
      expect(screen.getByText('CTR')).toBeInTheDocument()
      expect(screen.getByText('전환')).toBeInTheDocument()
      expect(screen.getByText('ROAS')).toBeInTheDocument()
    })

    it('포맷된 지출 금액을 표시한다', () => {
      render(<AdTable ads={mockAds} />)
      expect(screen.getByText('20,000원')).toBeInTheDocument()
      expect(screen.getByText('5,000원')).toBeInTheDocument()
    })

    it('포맷된 노출수를 표시한다', () => {
      render(<AdTable ads={mockAds} />)
      expect(screen.getByText('8,000')).toBeInTheDocument()
      expect(screen.getByText('3,000')).toBeInTheDocument()
    })
  })
})
