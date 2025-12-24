'use client'

import { CampaignCard } from './CampaignCard'
import { Button } from '@/components/ui/button'
import { Plus, Filter } from 'lucide-react'
import Link from 'next/link'

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

export function CampaignList({
  campaigns,
  isLoading = false,
  onStatusChange,
  quotaRemaining,
}: CampaignListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-48 animate-pulse rounded-lg bg-gray-100"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-1 h-4 w-4" />
            필터
          </Button>
        </div>
        <Button asChild disabled={quotaRemaining === 0}>
          <Link href="/campaigns/new">
            <Plus className="mr-1 h-4 w-4" />
            새 캠페인
            {quotaRemaining !== undefined && (
              <span className="ml-2 text-xs opacity-70">
                ({quotaRemaining}회 남음)
              </span>
            )}
          </Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <h3 className="text-lg font-semibold">아직 캠페인이 없어요</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            첫 번째 캠페인을 만들어 마케팅을 시작해보세요
          </p>
          <Button asChild className="mt-4" disabled={quotaRemaining === 0}>
            <Link href="/campaigns/new">
              <Plus className="mr-1 h-4 w-4" />
              첫 캠페인 만들기
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              {...campaign}
              onStatusChange={onStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
