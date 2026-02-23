import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { CampaignTable } from '../../../../../src/presentation/components/campaign/CampaignTable'
import type { ColumnKey } from '../../../../../src/presentation/stores/campaignStore'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      'campaignSummary.columns.name': '이름',
      'campaignSummary.columns.status': '상태',
      'campaigns.empty.title': '캠페인이 없습니다',
      'campaigns.empty.description': '첫 캠페인을 만들어 광고를 시작하세요',
      'currency.suffix': '원',
    }
    return map[key] || key
  },
}))

const defaultVisibleColumns: Record<ColumnKey, boolean> = {
  spend: true,
  roas: true,
  ctr: true,
  cpc: true,
  cpa: true,
  cvr: true,
  cpm: true,
  reach: true,
  impressions: true,
  clicks: true,
  conversions: true,
  createdAt: true,
}

const setVisibleColumnMock = vi.fn()

vi.mock('@/presentation/stores', () => ({
  useCampaignStore: () => ({
    filters: {
      status: 'ALL',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      searchQuery: '',
    },
    setFilters: vi.fn(),
    selectedCampaignIds: [],
    selectCampaign: vi.fn(),
    deselectCampaign: vi.fn(),
    selectAllCampaigns: vi.fn(),
    clearSelection: vi.fn(),
    visibleColumns: defaultVisibleColumns,
    setVisibleColumn: setVisibleColumnMock,
    columnOrder: [
      'spend',
      'roas',
      'ctr',
      'cpc',
      'cpa',
      'cvr',
      'cpm',
      'reach',
      'impressions',
      'clicks',
      'conversions',
      'createdAt',
    ] as ColumnKey[],
    moveColumn: vi.fn(),
    columnPresets: [],
    saveColumnPreset: vi.fn(),
    loadColumnPreset: vi.fn(),
    deleteColumnPreset: vi.fn(),
  }),
}))

describe('CampaignTable', () => {
  beforeEach(() => {
    pushMock.mockReset()
    setVisibleColumnMock.mockReset()
  })

  const campaigns = [
    {
      id: 'campaign-1',
      name: '테스트 캠페인',
      status: 'ACTIVE' as const,
      objective: 'CONVERSIONS',
      dailyBudget: 30000,
      spend: 5100,
      roas: 2.35,
      ctr: 2.5,
      cpc: 51,
      cpa: 510,
      cvr: 10,
      impressions: 1000,
      clicks: 100,
      conversions: 10,
      createdAt: '2026-02-20T00:00:00.000Z',
    },
  ]

  it('열 설정 드롭다운에서 체크박스 형태 지표 목록을 렌더링한다', async () => {
    const user = userEvent.setup()
    render(<CampaignTable campaigns={campaigns} />)

    await user.click(screen.getByRole('button', { name: /열 설정/ }))

    expect(screen.getByText('표시할 지표')).toBeTruthy()
    expect(screen.getByText('12개')).toBeTruthy()
    expect(screen.getByRole('menuitemcheckbox', { name: '지출' })).toBeTruthy()
    expect(screen.getByRole('menuitemcheckbox', { name: 'ROAS' })).toBeTruthy()
    expect(screen.getByText('51원')).toBeTruthy()
    expect(screen.getByText('510원')).toBeTruthy()
    expect(screen.getByText('1,000')).toBeTruthy()
    expect(screen.getByText('100')).toBeTruthy()
    expect(screen.getByText('10')).toBeTruthy()
  })

  it('지표를 클릭해도 드롭다운이 닫히지 않고 복수 선택을 계속할 수 있다', async () => {
    const user = userEvent.setup()
    render(<CampaignTable campaigns={campaigns} />)

    await user.click(screen.getByRole('button', { name: /열 설정/ }))

    const spendItem = screen.getByRole('menuitemcheckbox', { name: '지출' })
    const roasItem = screen.getByRole('menuitemcheckbox', { name: 'ROAS' })

    await user.click(spendItem)
    expect(setVisibleColumnMock).toHaveBeenCalledWith('spend', false)
    expect(screen.getByText('표시할 지표')).toBeTruthy()

    await user.click(roasItem)
    expect(setVisibleColumnMock).toHaveBeenCalledWith('roas', false)
    expect(screen.getByText('전체 선택')).toBeTruthy()
    expect(screen.getByText('전체 해제')).toBeTruthy()
  })
})
