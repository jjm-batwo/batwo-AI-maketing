'use client'

import { memo, useMemo, useCallback } from 'react'
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
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { MoreVertical, Play, Pause, BarChart3, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useCampaignStore } from '@/presentation/stores'
import { useTranslations } from 'next-intl'

type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT' | 'PENDING_REVIEW'
type SortField = 'createdAt' | 'name' | 'spend' | 'roas' | 'ctr'

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  objective: string
  dailyBudget: number
  spend?: number
  roas?: number
  ctr?: number
  createdAt?: string
}

interface CampaignTableProps {
  campaigns: Campaign[]
  isLoading?: boolean
  onStatusChange?: (id: string, status: string) => void
}

const statusConfig: Record<CampaignStatus, { label: string; className: string; dot: string }> = {
  ACTIVE: { label: '진행 중', className: 'bg-green-500/15 text-green-500', dot: 'bg-green-500' },
  PAUSED: { label: '일시정지', className: 'bg-yellow-500/15 text-yellow-500', dot: 'bg-yellow-500' },
  COMPLETED: { label: '완료', className: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' },
  DRAFT: { label: '초안', className: 'bg-primary/15 text-primary', dot: 'bg-primary' },
  PENDING_REVIEW: { label: '검토 중', className: 'bg-purple-500/15 text-purple-500', dot: 'bg-purple-500' },
}

const objectiveLabels: Record<string, string> = {
  TRAFFIC: '트래픽',
  CONVERSIONS: '전환',
  BRAND_AWARENESS: '브랜드 인지도',
  REACH: '도달',
  ENGAGEMENT: '참여',
}

function SortIcon({ field, currentSort, currentOrder }: { field: SortField; currentSort: SortField; currentOrder: 'asc' | 'desc' }) {
  if (currentSort !== field) {
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />
  }
  return currentOrder === 'asc'
    ? <ArrowUp className="ml-1 h-3 w-3" />
    : <ArrowDown className="ml-1 h-3 w-3" />
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
  } = useCampaignStore()

  const handleSort = useCallback((field: SortField) => {
    if (filters.sortBy === field) {
      setFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      setFilters({ sortBy: field, sortOrder: 'desc' })
    }
  }, [filters.sortBy, filters.sortOrder, setFilters])

  // 검색 + 정렬 적용
  const sortedCampaigns = useMemo(() => {
    let filtered = campaigns
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase()
      filtered = campaigns.filter(c => c.name.toLowerCase().includes(q))
    }

    return [...filtered].sort((a, b) => {
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
        case 'createdAt':
        default:
          return (new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()) * order
      }
    })
  }, [campaigns, filters.searchQuery, filters.sortBy, filters.sortOrder])

  const allSelected = sortedCampaigns.length > 0 && sortedCampaigns.every(c => selectedCampaignIds.includes(c.id))
  const someSelected = sortedCampaigns.some(c => selectedCampaignIds.includes(c.id))

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      clearSelection()
    } else {
      selectAllCampaigns(sortedCampaigns.map(c => c.id))
    }
  }, [allSelected, clearSelection, selectAllCampaigns, sortedCampaigns])

  const handleRowClick = useCallback((id: string, e: React.MouseEvent) => {
    // 체크박스, 드롭다운 클릭 시 네비게이션 방지
    const target = e.target as HTMLElement
    if (target.closest('[data-slot="checkbox"]') || target.closest('[role="menu"]') || target.closest('button')) {
      return
    }
    router.push(`/campaigns/${id}`)
  }, [router])

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
        <p className="mt-2 text-sm text-muted-foreground">
          {t('campaigns.empty.description')}
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
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
                <SortIcon field="name" currentSort={filters.sortBy} currentOrder={filters.sortOrder} />
              </button>
            </TableHead>
            <TableHead className="w-[100px]">
              {t('campaignSummary.columns.status')}
            </TableHead>
            <TableHead className="w-[120px] text-right">
              예산
            </TableHead>
            <TableHead className="w-[120px]">
              <button
                type="button"
                className="flex items-center text-xs font-medium cursor-pointer hover:text-foreground transition-colors ml-auto"
                onClick={() => handleSort('spend')}
              >
                {t('campaignSummary.columns.spend')}
                <SortIcon field="spend" currentSort={filters.sortBy} currentOrder={filters.sortOrder} />
              </button>
            </TableHead>
            <TableHead className="w-[80px]">
              <button
                type="button"
                className="flex items-center text-xs font-medium cursor-pointer hover:text-foreground transition-colors ml-auto"
                onClick={() => handleSort('roas')}
              >
                {t('campaignSummary.columns.roas')}
                <SortIcon field="roas" currentSort={filters.sortBy} currentOrder={filters.sortOrder} />
              </button>
            </TableHead>
            <TableHead className="w-[80px]">
              <button
                type="button"
                className="flex items-center text-xs font-medium cursor-pointer hover:text-foreground transition-colors ml-auto"
                onClick={() => handleSort('ctr')}
              >
                CTR
                <SortIcon field="ctr" currentSort={filters.sortBy} currentOrder={filters.sortOrder} />
              </button>
            </TableHead>
            <TableHead className="w-[100px]">
              <button
                type="button"
                className="flex items-center text-xs font-medium cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleSort('createdAt')}
              >
                생성일
                <SortIcon field="createdAt" currentSort={filters.sortBy} currentOrder={filters.sortOrder} />
              </button>
            </TableHead>
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
                className={cn(
                  'cursor-pointer transition-colors',
                  isSelected && 'bg-primary/5'
                )}
                onClick={(e) => handleRowClick(campaign.id, e)}
              >
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
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium', status.className)}>
                    <span className={cn('h-1.5 w-1.5 rounded-full', status.dot)} />
                    {status.label}
                  </span>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {campaign.dailyBudget.toLocaleString()}{t('currency.suffix')}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {(campaign.spend ?? 0).toLocaleString()}{t('currency.suffix')}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {(campaign.roas ?? 0).toFixed(2)}x
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {(campaign.ctr ?? 0).toFixed(2)}%
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {campaign.createdAt
                    ? new Date(campaign.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
                    : '-'}
                </TableCell>
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
  )
})
