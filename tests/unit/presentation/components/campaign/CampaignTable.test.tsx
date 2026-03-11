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
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const map: Record<string, string> = {
      'campaignSummary.columns.name': '이름',
      'campaignSummary.columns.status': '상태',
      'campaigns.empty.title': '캠페인이 없습니다',
      'campaigns.empty.description': '첫 캠페인을 만들어 광고를 시작하세요',
      'currency.suffix': '원',
      'table.columns.activation': '활성',
      'table.columns.budget': '예산',
      'table.columns.spend': '지출',
      'table.columns.roas': 'ROAS',
      'table.columns.ctr': 'CTR',
      'table.columns.cpc': 'CPC',
      'table.columns.cpa': 'CPA',
      'table.columns.cvr': 'CVR',
      'table.columns.cpm': 'CPM',
      'table.columns.reach': '도달',
      'table.columns.impressions': '노출',
      'table.columns.clicks': '클릭',
      'table.columns.conversions': '전환',
      'table.columns.createdAt': '생성일',
      'table.columnConfig.visibleCount': `${params?.count ?? 0}개 표시`,
      'table.columnConfig.presets': '프리셋',
      'table.columnConfig.savedPresets': '저장된 프리셋',
      'table.columnConfig.noPresets': '저장된 프리셋 없음',
      'table.columnConfig.saveCurrentPreset': '현재 설정 저장',
      'table.columnConfig.columnSettings': '열 설정',
      'table.columnConfig.metricsToShow': '표시할 지표',
      'table.columnConfig.countLabel': `${params?.count ?? 0}개`,
      'table.columnConfig.selectAll': '전체 선택',
      'table.columnConfig.deselectAll': '전체 해제',
      'table.status.active': '진행 중',
      'table.status.paused': '일시정지',
      'table.status.completed': '완료',
      'table.status.draft': '초안',
      'table.status.pendingReview': '검토 중',
      'table.objective.traffic': '트래픽',
      'table.objective.conversions': '전환',
      'table.objective.brandAwareness': '브랜드 인지도',
      'table.objective.reach': '도달',
      'table.objective.engagement': '참여',
      'table.actions.toggleActivation': `${params?.name ?? ''} 활성/비활성 전환`,
      'accessibility.statusToggled': `${params?.name ?? ''} 상태 변경: ${params?.status ?? ''}`,
      'table.columnConfig.presetSaveDialogTitle': '프리셋 이름',
      'table.columnConfig.presetSaveDialogDescription': '현재 열 설정을 프리셋으로 저장합니다',
      'table.columnConfig.presetNamePlaceholder': '프리셋 이름 입력',
      'table.columnConfig.cancelButton': '취소',
      'table.columnConfig.saveButton': '저장',
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
    selectedCampaignIds: new Set(),
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

vi.mock('@/presentation/stores/uiStore', () => ({
  useUIStore: (selector: (s: Record<string, unknown>) => unknown) => {
    const state = { announceToScreenReader: vi.fn() }
    return selector ? selector(state) : state
  },
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
