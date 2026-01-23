'use client'

import Link from 'next/link'
import { CampaignList } from '@/presentation/components/campaign'
import { useCampaigns } from '@/presentation/hooks'
import { useCampaignStore } from '@/presentation/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CampaignsPage() {
  const { filters, setFilters } = useCampaignStore()
  const { data, isLoading, error } = useCampaigns({
    status: filters.status === 'ALL' ? undefined : filters.status,
  })

  const campaigns = data?.campaigns || []

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">캠페인</h1>
          <p className="text-muted-foreground mt-2">진행 중인 모든 광고 캠페인을 관리하세요</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            새 캠페인 만들기
          </Link>
        </Button>
      </div>

      {/* Filters and List Container */}
      <div className="glass-card rounded-2xl p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="캠페인 이름으로 검색..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              className="pl-9 bg-white/50 dark:bg-black/10 border-border/50 focus:bg-white dark:focus:bg-black/30 transition-colors"
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              setFilters({ status: value as typeof filters.status })
            }
          >
            <SelectTrigger className="w-[160px] bg-white/50 dark:bg-black/10 border-border/50">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체 상태</SelectItem>
              <SelectItem value="ACTIVE">활성</SelectItem>
              <SelectItem value="PAUSED">일시중지</SelectItem>
              <SelectItem value="DRAFT">초안</SelectItem>
              <SelectItem value="COMPLETED">완료</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              setFilters({ sortBy: value as typeof filters.sortBy })
            }
          >
            <SelectTrigger className="w-[160px] bg-white/50 dark:bg-black/10 border-border/50">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">최신순</SelectItem>
              <SelectItem value="name">이름순</SelectItem>
              <SelectItem value="spend">지출순</SelectItem>
              <SelectItem value="roas">ROAS순</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              캠페인을 불러오는데 실패했습니다: {error.message}
            </p>
          </div>
        )}

        {/* Campaign List */}
        <CampaignList campaigns={campaigns} isLoading={isLoading} />
      </div>
    </div>
  )
}
