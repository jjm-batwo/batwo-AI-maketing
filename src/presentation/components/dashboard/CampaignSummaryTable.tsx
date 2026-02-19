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

export const CampaignSummaryTable = memo(function CampaignSummaryTable({
  campaigns = [],
  isLoading = false,
  className,
}: CampaignSummaryTableProps) {
  const t = useTranslations()

  const statusConfig = useMemo(() => ({
    ACTIVE: { label: t('campaigns.status.active') },
    PAUSED: { label: t('campaigns.status.paused') },
    COMPLETED: { label: t('campaigns.status.completed') },
    DRAFT: { label: t('campaigns.status.draft') },
  }), [t])
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
          <CardTitle className="text-sm font-medium">{t('campaignSummary.title')}</CardTitle>
          <Link
            href="/campaigns"
            className="text-sm text-primary hover:underline"
          >
            {t('campaignSummary.viewAll')}
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0 md:p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="whitespace-nowrap">{t('campaignSummary.columns.name')}</TableHead>
                <TableHead className="whitespace-nowrap">{t('campaignSummary.columns.status')}</TableHead>
                <TableHead className="whitespace-nowrap text-right">{t('campaignSummary.columns.spend')}</TableHead>
                <TableHead className="whitespace-nowrap text-right">{t('campaignSummary.columns.roas')}</TableHead>
                <TableHead className="whitespace-nowrap text-right">{t('campaignSummary.columns.ctr')}</TableHead>
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
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'h-2 w-2 rounded-full',
                        campaign.status === 'ACTIVE' && 'bg-green-500',
                        campaign.status === 'PAUSED' && 'bg-yellow-500',
                        campaign.status === 'COMPLETED' && 'bg-gray-400',
                        campaign.status === 'DRAFT' && 'bg-blue-500',
                      )} />
                      <span className="text-sm">{status.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {campaign.spend.toLocaleString()}{t('currency.suffix')}
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
})
