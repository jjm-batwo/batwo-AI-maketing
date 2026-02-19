'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { CampaignAllocation } from '@presentation/hooks/usePortfolio'

interface AllocationTableProps {
  allocations: CampaignAllocation[]
}

function formatKRW(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function AllocationTable({ allocations }: AllocationTableProps) {
  if (allocations.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>캠페인명</TableHead>
            <TableHead className="text-right">현재 예산</TableHead>
            <TableHead className="text-right">추천 예산</TableHead>
            <TableHead className="text-right">변화율</TableHead>
            <TableHead className="text-right">한계 ROAS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {allocations.map((row) => (
            <TableRow key={row.campaignId}>
              <TableCell className="font-medium">{row.campaignName}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatKRW(row.currentBudget)}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {formatKRW(row.recommendedBudget)}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-medium',
                  row.changePercent > 0
                    ? 'text-green-600 dark:text-green-400'
                    : row.changePercent < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-muted-foreground'
                )}
              >
                {formatPercent(row.changePercent)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {row.metrics.marginalROAS.toFixed(2)}x
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
