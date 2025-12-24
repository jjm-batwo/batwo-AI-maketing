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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">캠페인</h1>
          <p className="text-muted-foreground">광고 캠페인을 관리하세요</p>
        </div>
        <Button asChild>
          <Link href="/campaigns/new">
            <Plus className="mr-1 h-4 w-4" />
            새 캠페인
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="캠페인 검색..."
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            className="pl-9"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) =>
            setFilters({ status: value as typeof filters.status })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">전체</SelectItem>
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
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="정렬" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">생성일</SelectItem>
            <SelectItem value="name">이름</SelectItem>
            <SelectItem value="spend">지출</SelectItem>
            <SelectItem value="roas">ROAS</SelectItem>
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
  )
}
