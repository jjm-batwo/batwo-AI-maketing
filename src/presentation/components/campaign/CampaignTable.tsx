'use client'

import { memo, useMemo, useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  MoreVertical,
  Play,
  Pause,
  BarChart3,
  Pencil,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings2,
  Bookmark,
} from 'lucide-react'
import { useCampaignStore, type ColumnKey } from '@/presentation/stores'
import { useTranslations } from 'next-intl'

type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT' | 'PENDING_REVIEW'
type SortField =
  | 'createdAt'
  | 'name'
  | 'spend'
  | 'roas'
  | 'ctr'
  | 'cpc'
  | 'cpa'
  | 'cvr'
  | 'cpm'
  | 'reach'
  | 'impressions'
  | 'clicks'
  | 'conversions'

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  objective: string
  dailyBudget: number
  spend?: number
  roas?: number
  ctr?: number
  cpc?: number
  cpa?: number
  cvr?: number
  impressions?: number
  clicks?: number
  conversions?: number
  revenue?: number
  cpm?: number
  reach?: number
  createdAt?: string
}

interface CampaignTableProps {
  campaigns: Campaign[]
  isLoading?: boolean
  onStatusChange?: (id: string, status: string) => void
}

const statusConfig: Record<CampaignStatus, { label: string; className: string; dot: string }> = {
  ACTIVE: { label: '진행 중', className: 'bg-green-500/15 text-green-500', dot: 'bg-green-500' },
  PAUSED: {
    label: '일시정지',
    className: 'bg-yellow-500/15 text-yellow-500',
    dot: 'bg-yellow-500',
  },
  COMPLETED: {
    label: '완료',
    className: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
  DRAFT: { label: '초안', className: 'bg-primary/15 text-primary', dot: 'bg-primary' },
  PENDING_REVIEW: {
    label: '검토 중',
    className: 'bg-purple-500/15 text-purple-500',
    dot: 'bg-purple-500',
  },
}

const objectiveLabels: Record<string, string> = {
  TRAFFIC: '트래픽',
  CONVERSIONS: '전환',
  BRAND_AWARENESS: '브랜드 인지도',
  REACH: '도달',
  ENGAGEMENT: '참여',
}

const columnLabels: Record<ColumnKey, string> = {
  spend: '지출',
  roas: 'ROAS',
  ctr: 'CTR',
  cpc: 'CPC',
  cpa: 'CPA',
  cvr: 'CVR',
  cpm: 'CPM',
  reach: '도달',
  impressions: '노출',
  clicks: '클릭',
  conversions: '전환',
  createdAt: '생성일',
}

function SortIcon({
  field,
  currentSort,
  currentOrder,
}: {
  field: SortField
  currentSort: SortField
  currentOrder: 'asc' | 'desc'
}) {
  if (currentSort !== field) {
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
  }
  return currentOrder === 'asc' ? (
    <ArrowUp className="ml-1 h-3 w-3" />
  ) : (
    <ArrowDown className="ml-1 h-3 w-3" />
  )
}

export const CampaignTable = memo(function CampaignTable({
  campaigns,
  isLoading = false,
  onStatusChange,
}: CampaignTableProps) {
  const t = useTranslations()
  const router = useRouter()
  const {
    filters,
    setFilters,
    selectedCampaignIds,
    selectCampaign,
    deselectCampaign,
    selectAllCampaigns,
    clearSelection,
    visibleColumns,
    setVisibleColumn,
    columnOrder,
    moveColumn,
    columnPresets,
    saveColumnPreset,
    loadColumnPreset,
    deleteColumnPreset,
  } = useCampaignStore()
  const visibleMetricCount = useMemo(
    () => Object.values(visibleColumns).filter(Boolean).length,
    [visibleColumns]
  )

  const toggleColumnVisibility = useCallback(
    (column: ColumnKey, checked: boolean) => {
      setVisibleColumn(column, checked)
    },
    [setVisibleColumn]
  )

  const formatNumber = useCallback((value: number | undefined) => {
    return (value ?? 0).toLocaleString()
  }, [])

  const formatCurrency = useCallback((value: number | undefined) => {
    // Currency: round to nearest integer (like Meta Ads Manager)
    return Math.round(value ?? 0).toLocaleString()
  }, [])

  const formatPercent = useCallback((value: number | undefined) => {
    return `${(value ?? 0).toFixed(2)}%`
  }, [])

  const formatMultiplier = useCallback((value: number | undefined) => {
    return `${(value ?? 0).toFixed(2)}x`
  }, [])

  const handleSort = useCallback(
    (field: SortField) => {
      if (filters.sortBy === field) {
        setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
      } else {
        setFilters({ sortBy: field, sortOrder: 'desc' })
      }
    },
    [filters.sortBy, filters.sortOrder, setFilters]
  )

  // 검색 + 정렬 적용
  const sortedCampaigns = useMemo(() => {
    let filtered = campaigns
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase()
      filtered = campaigns.filter((c) => c.name.toLowerCase().includes(q))
    }

    return [...filtered].sort((a, b) => {
      // 활성 캠페인 최상단 고정
      const isActiveA = a.status === 'ACTIVE' ? 0 : 1
      const isActiveB = b.status === 'ACTIVE' ? 0 : 1
      if (isActiveA !== isActiveB) return isActiveA - isActiveB

      const order = filters.sortOrder === 'asc' ? 1 : -1
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name) * order
        case 'spend':
          return ((a.spend ?? 0) - (b.spend ?? 0)) * order
        case 'roas':
          return ((a.roas ?? 0) - (b.roas ?? 0)) * order
        case 'ctr':
          return ((a.ctr ?? 0) - (b.ctr ?? 0)) * order
        case 'cpc':
          return ((a.cpc ?? 0) - (b.cpc ?? 0)) * order
        case 'cpa':
          return ((a.cpa ?? 0) - (b.cpa ?? 0)) * order
        case 'cvr':
          return ((a.cvr ?? 0) - (b.cvr ?? 0)) * order
        case 'cpm':
          return ((a.cpm ?? 0) - (b.cpm ?? 0)) * order
        case 'reach':
          return ((a.reach ?? 0) - (b.reach ?? 0)) * order
        case 'impressions':
          return ((a.impressions ?? 0) - (b.impressions ?? 0)) * order
        case 'clicks':
          return ((a.clicks ?? 0) - (b.clicks ?? 0)) * order
        case 'conversions':
          return ((a.conversions ?? 0) - (b.conversions ?? 0)) * order
        case 'createdAt':
        default:
          return (
            (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * order
          )
      }
    })
  }, [campaigns, filters.searchQuery, filters.sortBy, filters.sortOrder])

  const allSelected =
    sortedCampaigns.length > 0 && sortedCampaigns.every((c) => selectedCampaignIds.includes(c.id))
  const someSelected = sortedCampaigns.some((c) => selectedCampaignIds.includes(c.id))

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection()
    } else {
      selectAllCampaigns(sortedCampaigns.map((c) => c.id))
    }
  }, [allSelected, clearSelection, selectAllCampaigns, sortedCampaigns])

  const handleActivationToggle = useCallback(
    (campaign: Campaign) => {
      if (!onStatusChange) return
      if (campaign.status === 'ACTIVE') {
        onStatusChange(campaign.id, 'PAUSED')
      } else if (campaign.status === 'PAUSED') {
        onStatusChange(campaign.id, 'ACTIVE')
      }
    },
    [onStatusChange]
  )

  // 드래그 앤 드롭 상태
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ColumnKey | null>(null)

  const handleDragStart = useCallback((column: ColumnKey) => {
    setDraggedColumn(column)
  }, [])

  const handleDragOver = useCallback(
    (e: React.DragEvent, column: ColumnKey) => {
      e.preventDefault()
      if (draggedColumn && draggedColumn !== column) {
        setDragOverColumn(column)
      }
    },
    [draggedColumn]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumn: ColumnKey) => {
      e.preventDefault()
      if (draggedColumn && draggedColumn !== targetColumn) {
        const fromIndex = columnOrder.indexOf(draggedColumn)
        const toIndex = columnOrder.indexOf(targetColumn)
        if (fromIndex !== -1 && toIndex !== -1) {
          moveColumn(fromIndex, toIndex)
        }
      }
      setDraggedColumn(null)
      setDragOverColumn(null)
    },
    [draggedColumn, columnOrder, moveColumn]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedColumn(null)
    setDragOverColumn(null)
  }, [])
  const handleRowClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      // 체크박스, 드롭다운 클릭 시 네비게이션 방지
      const target = e.target as HTMLElement
      if (
        target.closest('[data-slot="checkbox"]') ||
        target.closest('[role="menu"]') ||
        target.closest('button')
      ) {
        return
      }
      router.push(`/campaigns/${id}`)
    },
    [router]
  )

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex animate-pulse gap-4 py-3">
            <div className="h-4 w-4 rounded bg-muted" />
            <div className="h-4 w-40 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>
    )
  }

  if (sortedCampaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-lg font-semibold">{t('campaigns.empty.title')}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t('campaigns.empty.description')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
        <span className="text-xs text-muted-foreground">표시 컬럼 {visibleMetricCount}개</span>
        <div className="flex items-center gap-2">
          {/* 프리셋 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8">
                <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                프리셋
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>저장된 프리셋</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columnPresets.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                  저장된 프리셋이 없습니다
                </div>
              ) : (
                columnPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="flex items-center justify-between px-2 py-1.5 hover:bg-muted rounded-sm"
                  >
                    <button
                      type="button"
                      className="flex-1 text-left text-sm"
                      onClick={() => loadColumnPreset(preset.id)}
                    >
                      {preset.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteColumnPreset(preset.id)}
                      className="ml-2 p-1 hover:bg-muted-foreground/20 rounded"
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </div>
                ))
              )}
              <DropdownMenuSeparator />
              <div className="px-2 py-2">
                <button
                  type="button"
                  className="w-full text-left text-sm text-primary hover:underline"
                  onClick={() => {
                    const name = window.prompt('프리셋 이름을 입력하세요:')
                    if (name?.trim()) {
                      saveColumnPreset(name.trim())
                    }
                  }}
                >
                  + 현재 설정 저장
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8">
                <Settings2 className="mr-1.5 h-3.5 w-3.5" />열 설정
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuLabel className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="text-sm font-semibold">표시할 지표</span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {visibleMetricCount}개
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="my-2" />
              <DropdownMenuGroup className="space-y-0.5">
                {(Object.keys(columnLabels) as ColumnKey[]).map((key) => (
                  <DropdownMenuItem
                    key={key}
                    onSelect={(e) => {
                      e.preventDefault()
                    }}
                    onClick={() => toggleColumnVisibility(key, !visibleColumns[key])}
                    className="gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/60 focus:bg-accent/60 data-[highlighted]:bg-accent/60"
                    role="menuitemcheckbox"
                    aria-checked={visibleColumns[key]}
                  >
                    <div
                      className={cn(
                        'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200',
                        visibleColumns[key]
                          ? 'border-primary bg-gradient-to-br from-primary to-primary/85 shadow-sm'
                          : 'border-muted-foreground/30 bg-background hover:border-muted-foreground/50'
                      )}
                    >
                      {visibleColumns[key] && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3 text-primary-foreground"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-sm transition-colors duration-200',
                        visibleColumns[key]
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {columnLabels[key]}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="my-2" />
              <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    ;(Object.keys(columnLabels) as ColumnKey[]).forEach((key) => {
                      if (!visibleColumns[key]) {
                        setVisibleColumn(key, true)
                      }
                    })
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1.5 h-3.5 w-3.5"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                  전체 선택
                </Button>
                <div className="h-4 w-px bg-border" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                    ;(Object.keys(columnLabels) as ColumnKey[]).forEach((key) => {
                      if (visibleColumns[key]) {
                        setVisibleColumn(key, false)
                      }
                    })
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-1.5 h-3.5 w-3.5"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                  </svg>
                  전체 해제
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[72px] text-center">활성</TableHead>
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={handleSelectAll}
                  aria-label="전체 선택"
                />
              </TableHead>
              <TableHead>
                <button
                  type="button"
                  className="flex items-center text-xs font-medium cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('name')}
                >
                  {t('campaignSummary.columns.name')}
                  <SortIcon
                    field="name"
                    currentSort={filters.sortBy as SortField}
                    currentOrder={filters.sortOrder}
                  />
                </button>
              </TableHead>
              <TableHead className="w-[100px]">{t('campaignSummary.columns.status')}</TableHead>
              <TableHead className="w-[120px] text-right">예산</TableHead>
              {columnOrder
                .filter((key) => visibleColumns[key])
                .map((key) => {
                  const isDragging = draggedColumn === key
                  const isDragOver = dragOverColumn === key
                  return (
                    <TableHead
                      key={key}
                      draggable
                      onDragStart={() => handleDragStart(key)}
                      onDragOver={(e) => handleDragOver(e, key)}
                      onDrop={(e) => handleDrop(e, key)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        'cursor-move select-none',
                        key === 'spend' && 'w-[120px] text-right',
                        key === 'roas' && 'w-[90px] text-right',
                        key === 'ctr' && 'w-[90px] text-right',
                        key === 'cpc' && 'w-[110px] text-right',
                        key === 'cpa' && 'w-[110px] text-right',
                        key === 'cvr' && 'w-[90px] text-right',
                        key === 'cpm' && 'w-[110px] text-right',
                        key === 'reach' && 'w-[100px] text-right',
                        key === 'impressions' && 'w-[110px] text-right',
                        key === 'clicks' && 'w-[100px] text-right',
                        key === 'conversions' && 'w-[100px] text-right',
                        key === 'createdAt' && 'w-[100px]',
                        isDragging && 'opacity-50',
                        isDragOver && 'border-l-2 border-primary'
                      )}
                    >
                      <button
                        type="button"
                        className={cn(
                          'items-center text-xs font-medium cursor-pointer hover:text-foreground transition-colors',
                          key === 'createdAt' ? 'flex' : 'inline-flex'
                        )}
                        onClick={() => handleSort(key as SortField)}
                      >
                        {columnLabels[key]}
                        <SortIcon
                          field={key as SortField}
                          currentSort={filters.sortBy as SortField}
                          currentOrder={filters.sortOrder}
                        />
                      </button>
                    </TableHead>
                  )
                })}
              <TableHead className="w-[40px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCampaigns.map((campaign) => {
              const status = statusConfig[campaign.status]
              const isSelected = selectedCampaignIds.includes(campaign.id)

              return (
                <TableRow
                  key={campaign.id}
                  className={cn('cursor-pointer transition-colors', isSelected && 'bg-primary/5')}
                  onClick={(e) => handleRowClick(campaign.id, e)}
                >
                  <TableCell>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={campaign.status === 'ACTIVE'}
                      aria-label={`${campaign.name} 광고 활성화 토글`}
                      disabled={campaign.status !== 'ACTIVE' && campaign.status !== 'PAUSED'}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleActivationToggle(campaign)
                      }}
                      className={cn(
                        'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                        campaign.status === 'ACTIVE'
                          ? 'bg-blue-500'
                          : 'bg-gray-200 dark:bg-gray-600',
                        campaign.status !== 'ACTIVE' &&
                          campaign.status !== 'PAUSED' &&
                          'cursor-not-allowed opacity-50'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out',
                          campaign.status === 'ACTIVE' ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectCampaign(campaign.id)
                        } else {
                          deselectCampaign(campaign.id)
                        }
                      }}
                      aria-label={`${campaign.name} 선택`}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <Link
                        href={`/campaigns/${campaign.id}`}
                        className="font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {campaign.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {objectiveLabels[campaign.objective] || campaign.objective}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                        status.className
                      )}
                    >
                      <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(campaign.dailyBudget)}
                    {t('currency.suffix')}
                  </TableCell>
                  {columnOrder
                    .filter((key) => visibleColumns[key])
                    .map((key) => (
                      <TableCell
                        key={key}
                        className={cn(
                          key === 'createdAt'
                            ? 'text-muted-foreground text-xs'
                            : 'text-right tabular-nums'
                        )}
                      >
                        {key === 'spend' && (
                          <>
                            {formatNumber(campaign.spend)}
                            {t('currency.suffix')}
                          </>
                        )}
                        {key === 'roas' && formatMultiplier(campaign.roas)}
                        {key === 'ctr' && formatPercent(campaign.ctr)}
                        {key === 'cpc' && (
                          <>
                            {formatCurrency(campaign.cpc)}
                            {t('currency.suffix')}
                          </>
                        )}
                        {key === 'cpa' && (
                          <>
                            {formatCurrency(campaign.cpa)}
                            {t('currency.suffix')}
                          </>
                        )}
                        {key === 'cpm' && (
                          <>
                            {formatCurrency(campaign.cpm)}
                            {t('currency.suffix')}
                          </>
                        )}
                        {key === 'reach' && formatNumber(campaign.reach)}
                        {key === 'cvr' && formatPercent(campaign.cvr)}
                        {key === 'impressions' && formatNumber(campaign.impressions)}
                        {key === 'clicks' && formatNumber(campaign.clicks)}
                        {key === 'conversions' && formatNumber(campaign.conversions)}
                        {key === 'createdAt' &&
                          (campaign.createdAt
                            ? new Date(campaign.createdAt).toLocaleDateString('ko-KR', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : '-')}
                      </TableCell>
                    ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${campaign.id}/analytics`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            분석 보기
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${campaign.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            수정
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status === 'ACTIVE' && onStatusChange && (
                          <DropdownMenuItem onClick={() => onStatusChange(campaign.id, 'PAUSED')}>
                            <Pause className="mr-2 h-4 w-4" />
                            일시정지
                          </DropdownMenuItem>
                        )}
                        {campaign.status === 'PAUSED' && onStatusChange && (
                          <DropdownMenuItem onClick={() => onStatusChange(campaign.id, 'ACTIVE')}>
                            <Play className="mr-2 h-4 w-4" />
                            재개
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
})
