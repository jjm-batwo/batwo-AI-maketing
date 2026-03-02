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

type AdStatus = 'ACTIVE' | 'PAUSED' | 'DELETED'

interface AdWithInsights {
  id: string
  name: string
  status: string
  insights: {
    impressions: number
    clicks: number
    spend: number
    conversions: number
    revenue: number
  }
}

interface AdTableProps {
  ads: AdWithInsights[]
  isLoading?: boolean
}

const statusConfig: Record<AdStatus, { label: string; className: string; dot: string }> = {
  ACTIVE: { label: '진행 중', className: 'bg-green-500/15 text-green-500', dot: 'bg-green-500' },
  PAUSED: {
    label: '일시정지',
    className: 'bg-yellow-500/15 text-yellow-500',
    dot: 'bg-yellow-500',
  },
  DELETED: { label: '삭제됨', className: 'bg-red-500/15 text-red-500', dot: 'bg-red-500' },
}

function getStatusConfig(status: string) {
  return (
    statusConfig[status as AdStatus] ?? {
      label: status,
      className: 'bg-muted text-muted-foreground',
      dot: 'bg-muted-foreground',
    }
  )
}

export const AdTable = memo(function AdTable({ ads, isLoading }: AdTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        로딩 중...
      </div>
    )
  }

  if (ads.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
        광고가 없습니다
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[200px]">이름</TableHead>
            <TableHead className="w-[100px]">상태</TableHead>
            <TableHead className="text-right w-[120px]">지출</TableHead>
            <TableHead className="text-right w-[100px]">노출</TableHead>
            <TableHead className="text-right w-[80px]">클릭</TableHead>
            <TableHead className="text-right w-[80px]">CTR</TableHead>
            <TableHead className="text-right w-[80px]">전환</TableHead>
            <TableHead className="text-right w-[80px]">ROAS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ads.map((ad) => {
            const { insights } = ad
            const ctr =
              insights.impressions > 0 ? (insights.clicks / insights.impressions) * 100 : 0
            const roas = insights.spend > 0 ? insights.revenue / insights.spend : 0
            const config = getStatusConfig(ad.status)

            return (
              <TableRow key={ad.id}>
                <TableCell className="font-medium">{ad.name}</TableCell>
                <TableCell>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
                      config.className
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', config.dot)} />
                    {config.label}
                  </span>
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
