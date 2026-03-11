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
    ACTIVE: { label: t('table.status.active'), className: 'bg-green-500/15 text-green-500', dot: 'bg-green-500' },
    PAUSED: {
      label: t('table.status.paused'),
      className: 'bg-yellow-500/15 text-yellow-500',
      dot: 'bg-yellow-500',
    },
    DELETED: { label: t('table.status.deleted'), className: 'bg-red-500/15 text-red-500', dot: 'bg-red-500' },
    ARCHIVED: {
      label: t('table.status.archived'),
      className: 'bg-muted text-muted-foreground',
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
      className: 'bg-muted text-muted-foreground',
      dot: 'bg-muted-foreground',
    }
  )
}

export const AdSetTable = memo(function AdSetTable({
  adSets,
  isLoading,
  onAdSetClick,
}: AdSetTableProps) {
  const t = useTranslations()
  const statusConfig = useStatusConfig()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        {t('common.loading')}
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
          <TableRow>
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
          {adSets.map((adSet) => {
            const { insights } = adSet
            const ctr =
              insights.impressions > 0 ? (insights.clicks / insights.impressions) * 100 : 0
            const roas = insights.spend > 0 ? insights.revenue / insights.spend : 0
            const config = getStatusConfig(adSet.status, statusConfig)
            // UX-06: Get icon component
            const StatusIcon = statusIconMap[adSet.status as AdSetStatus] ?? Play

            return (
              <TableRow
                key={adSet.id}
                className={cn(onAdSetClick && 'cursor-pointer hover:bg-muted/50')}
                onClick={() => onAdSetClick?.(adSet.id)}
              >
                <TableCell className="font-medium">{adSet.name}</TableCell>
                <TableCell>
                  {/* UX-06: Status badge with icon */}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                      config.className
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
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
                <TableCell className="text-right tabular-nums">{formatMultiplier(roas)}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
})
