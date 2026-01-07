'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface CampaignSummary {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT'
  spend: number
  roas: number
  ctr: number
}

interface CampaignSummaryTableProps {
  campaigns?: CampaignSummary[]
  isLoading?: boolean
  className?: string
}

const statusConfig = {
  ACTIVE: { label: '진행 중', className: 'bg-green-100 text-green-700' },
  PAUSED: { label: '일시정지', className: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: '완료', className: 'bg-gray-100 text-gray-700' },
  DRAFT: { label: '초안', className: 'bg-blue-100 text-blue-700' },
}

export function CampaignSummaryTable({
  campaigns = [],
  isLoading = false,
  className,
}: CampaignSummaryTableProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">캠페인 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex animate-pulse gap-4">
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-4 w-16 rounded bg-gray-200" />
                <div className="h-4 w-20 rounded bg-gray-200" />
                <div className="h-4 w-12 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">캠페인 현황</CardTitle>
          <Link
            href="/campaigns"
            className="text-sm text-primary hover:underline"
          >
            전체 보기
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">캠페인명</TableHead>
                <TableHead className="whitespace-nowrap">상태</TableHead>
                <TableHead className="whitespace-nowrap text-right">지출</TableHead>
                <TableHead className="whitespace-nowrap text-right">ROAS</TableHead>
                <TableHead className="whitespace-nowrap text-right">CTR</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {campaigns.map((campaign) => {
              const status = statusConfig[campaign.status]
              return (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="hover:underline"
                    >
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                        status.className
                      )}
                    >
                      {status.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.spend.toLocaleString()}원
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.roas.toFixed(2)}x
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.ctr.toFixed(2)}%
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
