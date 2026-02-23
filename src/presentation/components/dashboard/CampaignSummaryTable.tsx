'use client'

import { memo, useMemo } from 'react'
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
import { useTranslations } from 'next-intl'

interface CampaignSummary {
  id: string
  name: string
  objective?: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT'
  spend: number
  revenue?: number
  roas: number
  ctr: number
  clicks?: number
  linkClicks?: number
  impressions?: number
  conversions?: number
  cpa?: number
  cvr?: number
}

type MetricFormat = 'currency' | 'number' | 'percentage' | 'multiplier'
type CampaignMetricKey =
  | keyof Pick<
      CampaignSummary,
      'spend' | 'revenue' | 'roas' | 'ctr' | 'clicks' | 'impressions' | 'conversions' | 'cpa' | 'cvr'
    >
  | 'linkClicks'

export interface CampaignMetricColumn {
  key: CampaignMetricKey
  label: string
  format: MetricFormat
  unit?: string
}

interface CampaignSummaryTableProps {
  campaigns?: CampaignSummary[]
  metricColumns?: CampaignMetricColumn[]
  isLoading?: boolean
  className?: string
}

const DEFAULT_METRIC_COLUMNS: CampaignMetricColumn[] = [
  { key: 'spend', label: '지출', format: 'currency', unit: '원' },
  { key: 'roas', label: 'ROAS', format: 'multiplier', unit: 'x' },
  { key: 'ctr', label: 'CTR', format: 'percentage', unit: '%' },
]

function formatMetricValue(value: number, format: MetricFormat, unit?: string): string {
  switch (format) {
    case 'currency':
      return `${value.toLocaleString()}${unit ?? '원'}`
    case 'percentage':
      return `${value.toFixed(2)}${unit ?? '%'}`
    case 'multiplier':
      return `${value.toFixed(2)}${unit ?? 'x'}`
    case 'number':
    default:
      return `${value.toLocaleString()}${unit ?? ''}`
  }
}

export const CampaignSummaryTable = memo(function CampaignSummaryTable({
  campaigns = [],
  metricColumns = DEFAULT_METRIC_COLUMNS,
  isLoading = false,
  className,
}: CampaignSummaryTableProps) {
  const t = useTranslations()

  const statusConfig = useMemo(
    () => ({
      ACTIVE: { label: t('campaigns.status.active') },
      PAUSED: { label: t('campaigns.status.paused') },
      COMPLETED: { label: t('campaigns.status.completed') },
      DRAFT: { label: t('campaigns.status.draft') },
    }),
    [t]
  )
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium">{t('campaignSummary.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex animate-pulse gap-4">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-4 w-20 rounded bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
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
          <CardTitle className="text-sm font-medium">{t('campaignSummary.title')}</CardTitle>
          <Link href="/campaigns" className="text-sm text-primary hover:underline">
            {t('campaignSummary.viewAll')}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">
                  {t('campaignSummary.columns.name')}
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  {t('campaignSummary.columns.status')}
                </TableHead>
                {metricColumns.map((column) => (
                  <TableHead key={column.key} className="whitespace-nowrap text-right">
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const status = statusConfig[campaign.status]
                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <Link href={`/campaigns/${campaign.id}`} className="hover:underline">
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            campaign.status === 'ACTIVE' && 'bg-green-500',
                            campaign.status === 'PAUSED' && 'bg-yellow-500',
                            campaign.status === 'COMPLETED' && 'bg-muted-foreground',
                            campaign.status === 'DRAFT' && 'bg-blue-500'
                          )}
                        />
                        <span className="text-sm">{status.label}</span>
                      </div>
                    </TableCell>
                    {metricColumns.map((column) => {
                      const rawValue = campaign[column.key]
                      const numericValue = typeof rawValue === 'number' ? rawValue : 0

                      return (
                        <TableCell key={column.key} className="text-right">
                          {formatMetricValue(numericValue, column.format, column.unit)}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
})
