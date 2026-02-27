'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ApiSourceBadge } from '@/presentation/components/common/ApiSourceBadge'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CampaignTable } from '@/presentation/components/campaign'
import { useCampaignStore, useUIStore } from '@/presentation/stores'
import { useDashboardKPI } from '@/presentation/hooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Pause, Play, Trash2, Sparkles } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const STATUS_PRIORITY: Record<string, number> = {
  ACTIVE: 0,
  PAUSED: 1,
  PENDING_REVIEW: 2,
  DRAFT: 3,
  COMPLETED: 4,
}

type KPIPeriod = 'today' | 'yesterday' | '7d' | '30d'

const PERIOD_LABELS: Record<KPIPeriod, string> = {
  today: '오늘',
  yesterday: '어제',
  '7d': '최근 7일',
  '30d': '최근 30일',
}

interface CampaignWithKPI {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT' | 'PENDING_REVIEW'
  objective: string
  dailyBudget: number
  createdAt?: string
  spend?: number
  roas?: number
  ctr?: number
  impressions?: number
  reach?: number
  clicks?: number
  linkClicks?: number
  conversions?: number
  revenue?: number
  cpa?: number
  cpc?: number
  cvr?: number
  cpm?: number
}

interface CampaignsClientProps {
  initialCampaigns: CampaignWithKPI[]
}

export function CampaignsClient({ initialCampaigns }: CampaignsClientProps) {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const showApiSource = searchParams.get('showApiSource') === 'true'
  const { filters, setFilters, selectedCampaignIds } = useCampaignStore()
  const { openChatPanel } = useUIStore()
  const [period, setPeriod] = useState<KPIPeriod>('today')

  // 기간별 KPI 데이터 (클라이언트 사이드 fetch)
  const { data: kpiData, isLoading: isKpiLoading } = useDashboardKPI({
    period,
    includeBreakdown: true,
  })

  // 캠페인 데이터에 KPI 지출/ROAS/CTR 병합
  const rawCampaigns = useMemo((): CampaignWithKPI[] => {
    if (initialCampaigns.length === 0) return []

    const breakdownMap = new Map(
      (kpiData?.campaignBreakdown ?? []).map(
        (b: {
          campaignId: string
          spend: number
          roas: number
          ctr: number
          impressions: number
          reach: number
          clicks: number
          linkClicks: number
          conversions: number
          revenue: number
          cpa: number
          cpc: number
          cvr: number
          cpm: number
        }) => [b.campaignId, b]
      )
    )

    return initialCampaigns.map((campaign): CampaignWithKPI => {
      const breakdown = breakdownMap.get(campaign.id)
      return {
        ...campaign,
        spend: breakdown?.spend ?? 0,
        roas: breakdown?.roas ?? 0,
        ctr: breakdown?.ctr ?? 0,
        impressions: breakdown?.impressions ?? 0,
        reach: breakdown?.reach ?? 0,
        clicks: breakdown?.clicks ?? 0,
        conversions: breakdown?.conversions ?? 0,
        revenue: breakdown?.revenue ?? 0,
        cpa: breakdown?.cpa ?? 0,
        cpc: breakdown?.cpc ?? 0,
        cvr: breakdown?.cvr ?? 0,
        cpm: breakdown?.cpm ?? 0,
        linkClicks: breakdown?.linkClicks ?? 0,
      }
    })
  }, [initialCampaigns, kpiData?.campaignBreakdown])

  // 활성 캠페인을 상단에 배치하는 정렬 로직
  const campaigns = useMemo(() => {
    if (filters.status !== 'ALL') {
      return rawCampaigns.filter((c) => c.status === filters.status)
    }

    return [...rawCampaigns].sort((a, b) => {
      const priorityA = STATUS_PRIORITY[a.status] ?? 99
      const priorityB = STATUS_PRIORITY[b.status] ?? 99

      if (priorityA !== priorityB) {
        return priorityA - priorityB
      }

      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [rawCampaigns, filters.status])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('campaigns.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('campaigns.subtitle')}</p>
          {showApiSource && (
            <ApiSourceBadge
              endpoint="POST /act_{id}/campaigns"
              permission="ads_management"
              className="mt-2"
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="lg"
            className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all"
            onClick={openChatPanel}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI 도움받기
          </Button>
          <Button asChild size="lg" className="shadow-sm transition-all">
            <Link href="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('campaigns.newCampaign')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters and List Container */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
        {/* Period Tabs + Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Tabs
              value={period}
              onValueChange={(v) => setPeriod(v as KPIPeriod)}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid w-full grid-cols-4 sm:w-auto bg-muted/50 dark:bg-muted/20">
                <TabsTrigger value="today">오늘</TabsTrigger>
                <TabsTrigger value="yesterday">어제</TabsTrigger>
                <TabsTrigger value="7d">7일</TabsTrigger>
                <TabsTrigger value="30d">30일</TabsTrigger>
              </TabsList>
            </Tabs>
            <span className="text-xs text-muted-foreground">
              {isKpiLoading ? '데이터 로딩 중...' : `${PERIOD_LABELS[period]} 기준 성과 데이터`}
            </span>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('campaigns.searchPlaceholder')}
                value={filters.searchQuery}
                onChange={(e) => setFilters({ searchQuery: e.target.value })}
                className="pl-9 bg-white/50 dark:bg-black/10 border-border/50 focus:bg-white dark:focus:bg-black/30 transition-colors"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ status: value as typeof filters.status })}
            >
              <SelectTrigger className="w-[160px] bg-white/50 dark:bg-black/10 border-border/50">
                <SelectValue placeholder={t('campaigns.status.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t('campaigns.status.all')}</SelectItem>
                <SelectItem value="ACTIVE">{t('campaigns.status.active')}</SelectItem>
                <SelectItem value="PAUSED">{t('campaigns.status.paused')}</SelectItem>
                <SelectItem value="DRAFT">{t('campaigns.status.draft')}</SelectItem>
                <SelectItem value="COMPLETED">{t('campaigns.status.completed')}</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters({ sortBy: value as typeof filters.sortBy })}
            >
              <SelectTrigger className="w-[160px] bg-white/50 dark:bg-black/10 border-border/50">
                <SelectValue placeholder={t('campaigns.sort.label')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">{t('campaigns.sort.createdAt')}</SelectItem>
                <SelectItem value="name">{t('campaigns.sort.name')}</SelectItem>
                <SelectItem value="spend">{t('campaigns.sort.spend')}</SelectItem>
                <SelectItem value="roas">{t('campaigns.sort.roas')}</SelectItem>
                <SelectItem value="ctr">CTR</SelectItem>
                <SelectItem value="cpc">CPC</SelectItem>
                <SelectItem value="cpa">CPA</SelectItem>
                <SelectItem value="cvr">CVR</SelectItem>
                <SelectItem value="cpm">CPM</SelectItem>
                <SelectItem value="reach">도달</SelectItem>
                <SelectItem value="impressions">노출</SelectItem>
                <SelectItem value="clicks">클릭</SelectItem>
                <SelectItem value="conversions">전환</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedCampaignIds.length > 0 && (
          <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
            <span className="text-sm font-medium">{selectedCampaignIds.length}개 선택됨</span>
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" size="sm">
                <Pause className="mr-1 h-3 w-3" />
                일시정지
              </Button>
              <Button variant="outline" size="sm">
                <Play className="mr-1 h-3 w-3" />
                재개
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                삭제
              </Button>
            </div>
          </div>
        )}

        {/* Campaign Table */}
        <CampaignTable campaigns={campaigns} isLoading={isKpiLoading} />
      </div>
    </div>
  )
}
