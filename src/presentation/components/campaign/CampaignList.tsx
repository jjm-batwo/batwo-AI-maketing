'use client'

import { memo, useCallback, useState } from 'react'
import { CampaignCard } from './CampaignCard'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Filter } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

interface Campaign {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT' | 'PENDING_REVIEW'
  objective: string
  dailyBudget: number
  spend?: number
  roas?: number
}

interface CampaignListProps {
  campaigns: Campaign[]
  isLoading?: boolean
  onStatusChange?: (id: string, status: string) => void
  quotaRemaining?: number
}

export const CampaignList = memo(function CampaignList({
  campaigns,
  isLoading = false,
  onStatusChange,
  quotaRemaining,
}: CampaignListProps) {
  const t = useTranslations()
  const [showFilter, setShowFilter] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  const handleStatusChange = useCallback((id: string, status: string) => {
    onStatusChange?.(id, status)
  }, [onStatusChange])

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (statusFilter === 'ALL') return true
    return campaign.status === statusFilter
  })

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg bg-muted"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilter(!showFilter)}
          >
            <Filter className="mr-1 h-4 w-4" />
            {t('campaigns.filter')}
          </Button>
          {showFilter && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger size="sm" className="w-[180px]">
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="DRAFT">초안</SelectItem>
                <SelectItem value="ACTIVE">진행 중</SelectItem>
                <SelectItem value="PAUSED">일시정지</SelectItem>
                <SelectItem value="COMPLETED">완료</SelectItem>
                <SelectItem value="PENDING_REVIEW">검토 중</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <Button asChild disabled={quotaRemaining === 0}>
          <Link href="/campaigns/new">
            <Plus className="mr-1 h-4 w-4" />
            {t('campaigns.newCampaignShort')}
            {quotaRemaining !== undefined && (
              <span className="ml-2 text-xs opacity-70">
                ({t('campaigns.remaining', { count: quotaRemaining })})
              </span>
            )}
          </Link>
        </Button>
      </div>

      {filteredCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">{t('campaigns.empty.title')}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('campaigns.empty.description')}
          </p>
          <Button asChild className="mt-4" disabled={quotaRemaining === 0}>
            <Link href="/campaigns/new">
              <Plus className="mr-1 h-4 w-4" />
              {t('campaigns.empty.button')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              {...campaign}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
})
