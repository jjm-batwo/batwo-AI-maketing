'use client'

import { memo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { formatNumber, formatCurrency, formatPercent, formatMultiplier } from '@/lib/utils/format'
import { Play, Pause, Trash2, Archive } from 'lucide-react'
import { useTranslations } from 'next-intl'

type AdSetStatus = 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'

interface AdSetWithInsights {
  id: string
  name: string
  status: string
  dailyBudget?: number
  insights: {
    impressions: number
    clicks: number
    spend: number
    conversions: number
    revenue: number
  }
}

interface AdSetTableProps {
  adSets: AdSetWithInsights[]
  isLoading?: boolean
  onAdSetClick?: (adSetId: string) => void
  onEdit?: (adSetId: string) => void
  onViewChart?: (adSetId: string) => void
}

// UX-06: Status icon map for color-blind accessibility
const statusIconMap: Record<AdSetStatus, React.ComponentType<{ className?: string }>> = {
  ACTIVE: Play,
  PAUSED: Pause,
  DELETED: Trash2,
  ARCHIVED: Archive,
}

function useStatusConfig() {
  const t = useTranslations()
  return {
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
    DELETED: { label: t('table.status.deleted'), className: 'text-red-500', dot: 'bg-red-500' },
    ARCHIVED: {
      label: t('table.status.archived'),
      className: 'text-muted-foreground',
      dot: 'bg-muted-foreground',
    },
  } as Record<AdSetStatus, { label: string; className: string; dot: string }>
}

function getStatusConfig(
  status: string,
  config: Record<AdSetStatus, { label: string; className: string; dot: string }>
) {
  return (
    config[status as AdSetStatus] ?? {
      label: status,
      className: 'text-muted-foreground',
      dot: 'bg-muted-foreground',
    }
  )
}

export const AdSetTable = memo(function AdSetTable({
  adSets,
  isLoading,
  onAdSetClick,
  onEdit,
  onViewChart,
}: AdSetTableProps) {
  const t = useTranslations()
  const statusConfig = useStatusConfig()

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40px] pl-4">
                <div className="h-4 w-4 animate-pulse rounded bg-muted" />
              </TableHead>
              <TableHead className="w-[60px] text-center">
                {t('table.columns.activation')}
              </TableHead>
              <TableHead className="min-w-[200px]">{t('table.columns.name')}</TableHead>
              <TableHead className="w-[100px]">{t('campaignSummary.columns.status')}</TableHead>
              <TableHead className="text-right w-[120px]">
                {t('table.columns.dailyBudget')}
              </TableHead>
              <TableHead className="text-right w-[120px]">{t('table.columns.spend')}</TableHead>
              <TableHead className="text-right w-[100px]">
                {t('table.columns.impressions')}
              </TableHead>
              <TableHead className="text-right w-[80px]">{t('table.columns.clicks')}</TableHead>
              <TableHead className="text-right w-[80px]">{t('table.columns.ctr')}</TableHead>
              <TableHead className="text-right w-[80px]">
                {t('table.columns.conversions')}
              </TableHead>
              <TableHead className="text-right w-[80px]">{t('table.columns.roas')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell className="pl-4">
                  <div className="h-4 w-4 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell className="text-center">
                  <div className="h-[18px] w-8 animate-pulse rounded-full bg-muted mx-auto" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell>
                  <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-4 w-20 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-4 w-12 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-4 w-14 animate-pulse rounded bg-muted" />
                </TableCell>
                <TableCell className="text-right">
                  <div className="ml-auto h-4 w-12 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (adSets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        {t('table.empty.adSets')}
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b bg-muted/30 text-xs text-muted-foreground font-medium h-10">
            <TableHead className="w-[40px] pl-4">
              <Checkbox checked={false} aria-label="Select all" />
            </TableHead>
            <TableHead className="w-[60px] text-center">{t('table.columns.activation')}</TableHead>
            <TableHead className="min-w-[200px]">{t('table.columns.name')}</TableHead>
            <TableHead className="w-[100px]">{t('campaignSummary.columns.status')}</TableHead>
            <TableHead className="text-right w-[120px]">{t('table.columns.dailyBudget')}</TableHead>
            <TableHead className="text-right w-[120px]">{t('table.columns.spend')}</TableHead>
            <TableHead className="text-right w-[100px]">{t('table.columns.impressions')}</TableHead>
            <TableHead className="text-right w-[80px]">{t('table.columns.clicks')}</TableHead>
            <TableHead className="text-right w-[80px]">{t('table.columns.ctr')}</TableHead>
            <TableHead className="text-right w-[80px]">{t('table.columns.conversions')}</TableHead>
            <TableHead className="text-right w-[80px]">{t('table.columns.roas')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...adSets]
            .sort((a, b) => {
              const priority: Record<string, number> = { ACTIVE: 0, PAUSED: 1, DELETED: 2 }
              return (priority[a.status] ?? 3) - (priority[b.status] ?? 3)
            })
            .map((adSet) => {
              const { insights } = adSet
              const ctr =
                insights.impressions > 0 ? (insights.clicks / insights.impressions) * 100 : 0
              const roas = insights.spend > 0 ? insights.revenue / insights.spend : 0
              const config = getStatusConfig(adSet.status, statusConfig)
              // UX-06: Get icon component
              const _StatusIcon = statusIconMap[adSet.status as AdSetStatus] ?? Play

              return (
                <TableRow
                  key={adSet.id}
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-muted/30',
                    onAdSetClick && 'hover:bg-muted/30'
                  )}
                  onClick={() => onAdSetClick?.(adSet.id)}
                >
                  <TableCell className="pl-4">
                    <Checkbox
                      checked={false}
                      aria-label="Select row"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={adSet.status === 'ACTIVE'}
                      disabled={adSet.status !== 'ACTIVE' && adSet.status !== 'PAUSED'}
                      className={cn(
                        'relative inline-flex h-[18px] w-8 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none',
                        adSet.status === 'ACTIVE' ? 'bg-[#1877F2]' : 'bg-muted-foreground/30',
                        adSet.status !== 'ACTIVE' &&
                          adSet.status !== 'PAUSED' &&
                          'cursor-not-allowed opacity-50'
                      )}
                    >
                      <span
                        className={cn(
                          'pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
                          adSet.status === 'ACTIVE' ? 'translate-x-[16px]' : 'translate-x-[2px]'
                        )}
                      />
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="group flex flex-col justify-center">
                      <button
                        type="button"
                        className="font-medium text-[14px] text-left hover:underline text-[#1877F2] cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation()
                          onAdSetClick?.(adSet.id)
                        }}
                      >
                        {adSet.name}
                      </button>
                      <div className="h-4 flex items-center mt-0.5">
                        <span className="hidden group-hover:flex items-center gap-2 text-[11px] text-muted-foreground">
                          <button
                            type="button"
                            className="hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEdit?.(adSet.id)
                            }}
                          >
                            수정
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            className="hover:underline cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewChart?.(adSet.id)
                            }}
                          >
                            차트 보기
                          </button>
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {/* UX-06: Status dot with text */}
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', config.dot)} />
                      <span className={cn('text-[13px]', config.className)}>{config.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {adSet.dailyBudget != null ? formatCurrency(adSet.dailyBudget) : '-'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(insights.spend)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(insights.impressions)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(insights.clicks)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatPercent(ctr)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(insights.conversions)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMultiplier(roas)}
                  </TableCell>
                </TableRow>
              )
            })}
        </TableBody>
      </Table>
    </div>
  )
})
