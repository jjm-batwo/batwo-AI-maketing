import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { AdSetTable } from '../../../../../src/presentation/components/campaign/AdSetTable'

// Mock next-intl to pass through known keys
const mockMessages = {
  table: {
    columns: {
      name: '이름',
      dailyBudget: '일예산',
      spend: '지출',
      impressions: '노출',
      clicks: '클릭',
      ctr: 'CTR',
      conversions: '전환',
      roas: 'ROAS',
      activation: '활성화',
    },
    status: {
      active: '진행 중',
      paused: '일시정지',
      deleted: '삭제됨',
      archived: '보관됨',
    },
    empty: {
      adSets: '광고 세트가 없습니다',
      ads: '광고가 없습니다',
    },
  },
  campaignSummary: {
    columns: {
      status: '상태',
    },
  },
}

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

// Mock lucide-react icons using importOriginal to inherit all exports
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  const createIcon = (name: string) => {
    const Icon = ({ className, ...props }: { className?: string; [key: string]: unknown }) => (
      <span data-testid={`icon-${name.toLowerCase()}`} className={className} {...props} />
    )
    Icon.displayName = name
    return Icon
  }

  return {
    ...actual,
    Play: createIcon('Play'),
    Pause: createIcon('Pause'),
    Trash2: createIcon('Trash2'),
    Archive: createIcon('Archive'),
    CheckIcon: createIcon('CheckIcon'),
    XIcon: createIcon('XIcon'),
    ChevronDownIcon: createIcon('ChevronDownIcon'),
    ChevronUpIcon: createIcon('ChevronUpIcon'),
    ChevronRightIcon: createIcon('ChevronRightIcon'),
    CircleIcon: createIcon('CircleIcon'),
    ArrowUpRight: createIcon('ArrowUpRight'),
    ArrowDownRight: createIcon('ArrowDownRight'),
    Minus: createIcon('Minus'),
    LoaderCircle: createIcon('LoaderCircle'),
    TriangleAlert: createIcon('TriangleAlert'),
    CircleCheck: createIcon('CircleCheck'),
    Info: createIcon('Info'),
    X: createIcon('X'),
  }
})

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="ko" messages={mockMessages}>
      {ui}
    </NextIntlClientProvider>
  )
}

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
    it('isLoading이 true이면 스켈레톤을 표시한다', () => {
      renderWithIntl(<AdSetTable adSets={[]} isLoading={true} />)
      // 로딩 시 스켈레톤 테이블 헤더 렌더링
      expect(screen.getByText('이름')).toBeInTheDocument()
    })
  })

  describe('빈 상태', () => {
    it('광고 세트가 없으면 "광고 세트가 없습니다" 텍스트를 표시한다', () => {
      renderWithIntl(<AdSetTable adSets={[]} />)
      expect(screen.getByText('광고 세트가 없습니다')).toBeInTheDocument()
    })

    it('광고 세트가 없으면 테이블을 렌더링하지 않는다', () => {
      renderWithIntl(<AdSetTable adSets={[]} />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  describe('데이터 렌더링', () => {
    it('광고 세트 이름을 표시한다', () => {
      renderWithIntl(<AdSetTable adSets={mockAdSets} />)
      expect(screen.getByText('테스트 광고 세트 A')).toBeInTheDocument()
      expect(screen.getByText('테스트 광고 세트 B')).toBeInTheDocument()
    })

    it('한국어 상태 레이블을 표시한다', () => {
      renderWithIntl(<AdSetTable adSets={mockAdSets} />)
      expect(screen.getByText('진행 중')).toBeInTheDocument()
      expect(screen.getByText('일시정지')).toBeInTheDocument()
    })

    it('테이블 헤더를 올바르게 렌더링한다', () => {
      renderWithIntl(<AdSetTable adSets={mockAdSets} />)
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
      renderWithIntl(<AdSetTable adSets={mockAdSets} />)
      expect(screen.getByText('-')).toBeInTheDocument()
    })

    it('dailyBudget가 있으면 포맷된 금액을 표시한다', () => {
      renderWithIntl(<AdSetTable adSets={mockAdSets} />)
      expect(screen.getByText('50,000원')).toBeInTheDocument()
    })
  })

  describe('onAdSetClick 콜백', () => {
    it('행 클릭 시 onAdSetClick 콜백에 올바른 ID를 전달한다', async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      renderWithIntl(<AdSetTable adSets={mockAdSets} onAdSetClick={handleClick} />)

      const row = screen.getByText('테스트 광고 세트 A').closest('tr')!
      await user.click(row)

      expect(handleClick).toHaveBeenCalledWith('adset-1')
    })

    it('onAdSetClick이 없으면 클릭해도 에러가 발생하지 않는다', async () => {
      const user = userEvent.setup()
      renderWithIntl(<AdSetTable adSets={mockAdSets} />)

      const row = screen.getByText('테스트 광고 세트 A').closest('tr')!
      await user.click(row)
      // No error thrown
    })
  })
})
