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
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  formatMultiplier as formatMultiplierValue,
  formatNumber as formatNumberValue,
  formatPercent as formatPercentValue,
} from '@/lib/utils/format'
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
  CheckCircle2,
  FileEdit,
  Clock,
} from 'lucide-react'
import { useCampaignStore, type ColumnKey } from '@/presentation/stores'
import { useTranslations } from 'next-intl'
import { useUIStore } from '@/presentation/stores/uiStore'
import { BulkActionBar } from './BulkActionBar'

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
  onRowClick?: (id: string, name: string) => void
}

// UX-06: Status config with icons for color-blind accessibility
const statusIconMap: Record<CampaignStatus, React.ComponentType<{ className?: string }>> = {
  ACTIVE: Play,
  PAUSED: Pause,
  COMPLETED: CheckCircle2,
  DRAFT: FileEdit,
  PENDING_REVIEW: Clock,
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
  onRowClick,
}: CampaignTableProps) {
  const t = useTranslations()
  const router = useRouter()
  const announceToScreenReader = useUIStore((s) => s.announceToScreenReader)
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

  // UX-03: Preset name dialog state (replaces window.prompt)
  const [presetDialogOpen, setPresetDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')

  const visibleMetricCount = useMemo(
    () => Object.values(visibleColumns).filter(Boolean).length,
    [visibleColumns]
  )

  // UX-01: i18n status config (using translations)
  const statusConfig = useMemo(
    () =>
      ({
        ACTIVE: {
          label: t('table.status.active'),
          className: 'text-foreground font-medium',
          dot: 'bg-green-500',
        },
        PAUSED: {
          label: t('table.status.paused'),
          className: 'text-muted-foreground',
          dot: 'bg-transparent border-[1.5px] border-muted-foreground',
        },
        COMPLETED: {
          label: t('table.status.completed'),
          className: 'text-muted-foreground',
          dot: 'bg-muted-foreground',
        },
        DRAFT: {
          label: t('table.status.draft'),
          className: 'text-primary',
          dot: 'bg-primary',
        },
        PENDING_REVIEW: {
          label: t('table.status.pendingReview'),
          className: 'text-purple-500',
          dot: 'bg-purple-500',
        },
      }) as Record<CampaignStatus, { label: string; className: string; dot: string }>,
    [t]
  )

  // UX-01: i18n objective labels
  const objectiveLabels = useMemo(
    () => ({
      TRAFFIC: t('table.objective.traffic'),
      CONVERSIONS: t('table.objective.conversions'),
      BRAND_AWARENESS: t('table.objective.brandAwareness'),
      REACH: t('table.objective.reach'),
      ENGAGEMENT: t('table.objective.engagement'),
    }),
    [t]
  )

  // UX-01: i18n column labels
  const columnLabels = useMemo(
    () =>
      ({
        spend: t('table.columns.spend'),
        roas: t('table.columns.roas'),
        ctr: t('table.columns.ctr'),
        cpc: t('table.columns.cpc'),
        cpa: t('table.columns.cpa'),
        cvr: t('table.columns.cvr'),
        cpm: t('table.columns.cpm'),
        reach: t('table.columns.reach'),
        impressions: t('table.columns.impressions'),
        clicks: t('table.columns.clicks'),
        conversions: t('table.columns.conversions'),
        createdAt: t('table.columns.createdAt'),
      }) as Record<ColumnKey, string>,
    [t]
  )

  const toggleColumnVisibility = useCallback(
    (column: ColumnKey, checked: boolean) => {
      setVisibleColumn(column, checked)
    },
    [setVisibleColumn]
  )

  const formatNumber = useCallback((value: number | undefined) => {
    return formatNumberValue(value ?? 0)
  }, [])

  const formatCurrency = useCallback((value: number | undefined) => {
    return formatNumberValue(Math.round(value ?? 0))
  }, [])

  const formatPercent = useCallback((value: number | undefined) => {
    return formatPercentValue(value ?? 0)
  }, [])

  const formatMultiplier = useCallback((value: number | undefined) => {
    return formatMultiplierValue(value ?? 0)
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
    sortedCampaigns.length > 0 && sortedCampaigns.every((c) => selectedCampaignIds.has(c.id))
  const someSelected = sortedCampaigns.some((c) => selectedCampaignIds.has(c.id))

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection()
    } else {
      selectAllCampaigns(sortedCampaigns.map((c) => c.id))
    }
  }, [allSelected, clearSelection, selectAllCampaigns, sortedCampaigns])

  // UX-08: Toggle with aria-live announcement
  const handleActivationToggle = useCallback(
    (campaign: Campaign) => {
      if (!onStatusChange) return
      if (campaign.status === 'ACTIVE') {
        onStatusChange(campaign.id, 'PAUSED')
        announceToScreenReader(
          t('accessibility.statusToggled', { name: campaign.name, status: t('table.status.paused') })
        )
      } else if (campaign.status === 'PAUSED') {
        onStatusChange(campaign.id, 'ACTIVE')
        announceToScreenReader(
          t('accessibility.statusToggled', { name: campaign.name, status: t('table.status.active') })
        )
      }
    },
    [onStatusChange, announceToScreenReader, t]
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
      if (onRowClick) {
        const campaign = campaigns.find((c) => c.id === id)
        onRowClick(id, campaign?.name ?? '')
      } else {
        router.push(`/campaigns/${id}`)
      }
    },
    [router, onRowClick, campaigns]
  )

  // UX-03: Handle preset save via Dialog
  const handleSavePreset = useCallback(() => {
    if (presetName.trim()) {
      saveColumnPreset(presetName.trim())
      setPresetName('')
      setPresetDialogOpen(false)
    }
  }, [presetName, saveColumnPreset])

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
        <span className="text-xs text-muted-foreground">
          {t('table.columnConfig.visibleCount', { count: visibleMetricCount })}
        </span>
        <div className="flex items-center gap-2">
          {/* 프리셋 드롭다운 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8">
                <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                {t('table.columnConfig.presets')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t('table.columnConfig.savedPresets')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columnPresets.length === 0 ? (
                <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                  {t('table.columnConfig.noPresets')}
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
                {/* UX-03: Dialog instead of window.prompt */}
                <button
                  type="button"
                  className="w-full text-left text-sm text-primary hover:underline"
                  onClick={() => {
                    setPresetName('')
                    setPresetDialogOpen(true)
                  }}
                >
                  {t('table.columnConfig.saveCurrentPreset')}
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8">
                <Settings2 className="mr-1.5 h-3.5 w-3.5" />{t('table.columnConfig.columnSettings')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <DropdownMenuLabel className="flex items-center justify-between gap-2 px-2 py-1.5">
                <span className="text-sm font-semibold">{t('table.columnConfig.metricsToShow')}</span>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  {t('table.columnConfig.countLabel', { count: visibleMetricCount })}
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
                      ; (Object.keys(columnLabels) as ColumnKey[]).forEach((key) => {
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
                  {t('table.columnConfig.selectAll')}
                </Button>
                <div className="h-4 w-px bg-border" />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  onClick={(e) => {
                    e.preventDefault()
                      ; (Object.keys(columnLabels) as ColumnKey[]).forEach((key) => {
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
                  {t('table.columnConfig.deselectAll')}
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b bg-muted/30 text-xs text-muted-foreground font-medium h-10">
              <TableHead className="w-[40px] pl-4">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={handleSelectAll}
                  aria-label={t('table.columnConfig.selectAll')}
                />
              </TableHead>
              <TableHead className="w-[60px] text-center">{t('table.columns.activation')}</TableHead>
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
              <TableHead className="w-[120px] text-right">{t('table.columns.budget')}</TableHead>
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
              const isSelected = selectedCampaignIds.has(campaign.id)
              // UX-06: Get icon component for status
              const StatusIcon = statusIconMap[campaign.status]

              return (
                <TableRow
                  key={campaign.id}
                  className={cn('cursor-pointer transition-colors hover:bg-muted/30', isSelected && 'bg-primary/5')}
                  onClick={(e) => handleRowClick(campaign.id, e)}
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectCampaign(campaign.id)
                        } else {
                          deselectCampaign(campaign.id)
                        }
                      }}
                      aria-label={`${campaign.name} ${t('table.columnConfig.selectAll')}`}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    {/* UX-04: Toggle switch with Meta Ads styling */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={campaign.status === 'ACTIVE'}
                      aria-label={t('table.actions.toggleActivation', { name: campaign.name })}
                      disabled={campaign.status !== 'ACTIVE' && campaign.status !== 'PAUSED'}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleActivationToggle(campaign)
                      }}
                      className={cn(
                        'relative inline-flex h-[18px] w-8 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none',
                        campaign.status === 'ACTIVE'
                          ? 'bg-[#1877F2]'
                          : 'bg-muted-foreground/30',
                        campaign.status !== 'ACTIVE' &&
                        campaign.status !== 'PAUSED' &&
                        'cursor-not-allowed opacity-50'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
                          campaign.status === 'ACTIVE' ? 'translate-x-[16px]' : 'translate-x-[2px]'
                        )}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="group flex flex-col justify-center">
                      <button
                        type="button"
                        className="font-medium text-[14px] text-left hover:underline text-[#1877F2]"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (onRowClick) {
                            onRowClick(campaign.id, campaign.name)
                          } else {
                            router.push(`/campaigns/${campaign.id}`)
                          }
                        }}
                      >
                        {campaign.name}
                      </button>
                      <div className="h-4 flex items-center mt-0.5">
                        <span className="text-[11px] text-muted-foreground group-hover:hidden">
                          {objectiveLabels[campaign.objective as keyof typeof objectiveLabels] || campaign.objective}
                        </span>
                        <div className="hidden group-hover:flex items-center gap-2 text-[11px] text-muted-foreground">
                          <Link href={`/campaigns/${campaign.id}/edit`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                            수정
                          </Link>
                          <span>·</span>
                          <Link href={`/campaigns/${campaign.id}/analytics`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                            차트 보기
                          </Link>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* UX-06: Status dot with text */}
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", status.dot)} />
                      <span className={cn("text-[13px]", status.className)}>
                        {status.label}
                      </span>
                    </div>
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
                        {/* UX-07: Enlarged touch target for MoreVertical button (44px) */}
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${campaign.id}/analytics`}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            {t('table.actions.viewAnalytics')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/campaigns/${campaign.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            {t('table.actions.edit')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {campaign.status === 'ACTIVE' && onStatusChange && (
                          <DropdownMenuItem onClick={() => onStatusChange(campaign.id, 'PAUSED')}>
                            <Pause className="mr-2 h-4 w-4" />
                            {t('table.actions.pause')}
                          </DropdownMenuItem>
                        )}
                        {campaign.status === 'PAUSED' && onStatusChange && (
                          <DropdownMenuItem onClick={() => onStatusChange(campaign.id, 'ACTIVE')}>
                            <Play className="mr-2 h-4 w-4" />
                            {t('table.actions.resume')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('table.actions.delete')}
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

      {/* UX-03: Preset name Dialog (replaces window.prompt) */}
      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('table.columnConfig.savedPresets')}</DialogTitle>
            <DialogDescription>
              {t('table.columnConfig.presetNamePrompt')}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t('table.columnConfig.presetNamePrompt')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset()
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPresetDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="button" onClick={handleSavePreset} disabled={!presetName.trim()}>
              {t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <BulkActionBar />
    </div>
  )
})
