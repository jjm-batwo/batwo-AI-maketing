'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ApiSourceBadge } from '@/presentation/components/common/ApiSourceBadge'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CampaignTable } from '@/presentation/components/campaign'
import { AdSetTable } from '@/presentation/components/campaign/AdSetTable'
import { AdTable } from '@/presentation/components/campaign/AdTable'
import { useCampaignStore, useUIStore } from '@/presentation/stores'
import { useDashboardKPI } from '@/presentation/hooks'
import { useAdSetsWithInsights } from '@/presentation/hooks/useAdSetsWithInsights'
import { useAdsWithInsights } from '@/presentation/hooks/useAdsWithInsights'
import {
  CAMPAIGN_KPI_PERIOD_LABELS,
  type CampaignKPIPeriod,
  mapDetailPeriodToDatePreset,
} from '@/presentation/utils/campaignPeriod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Pause, Play, Trash2, Sparkles, ChevronRight } from 'lucide-react'
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
  const {
    filters,
    setFilters,
    selectedCampaignIds,
    activeTab,
    setActiveTab,
    selectedCampaignForDrilldown,
    setSelectedCampaignForDrilldown,
    selectedAdSetForDrilldown,
    setSelectedAdSetForDrilldown,
  } = useCampaignStore()
  const { openChatPanel } = useUIStore()
  const [period, setPeriod] = useState<CampaignKPIPeriod>('today')

  const datePreset = useMemo(() => mapDetailPeriodToDatePreset(period as any), [period])

  // 기간별 KPI 데이터 (클라이언트 사이드 fetch)
  const { data: kpiData, isLoading: isKpiLoading } = useDashboardKPI({
    period,
    includeBreakdown: true,
  })

  // Data Queries for Drill-down / All views
  const adSetsQuery = useAdSetsWithInsights(selectedCampaignForDrilldown, datePreset, activeTab === 'adsets')
  const adsQuery = useAdsWithInsights(selectedAdSetForDrilldown, datePreset, activeTab === 'ads')

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

  // 캠페인/광고세트 선택 핸들러
  const handleCampaignClick = (id: string, name: string) => {
    setSelectedCampaignForDrilldown(id)
    setActiveTab('adsets')
  }

  const handleAdSetClick = (id: string) => {
    setSelectedAdSetForDrilldown(id)
    setActiveTab('ads')
  }

  // Status toggle mutation
  const queryClient = useQueryClient()
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Failed to update status' }))
        throw new Error(error.message || 'Failed to update status')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] })
      queryClient.invalidateQueries({ queryKey: ['dashboardKPI'] })
    },
  })

  const handleStatusChange = useCallback(
    (id: string, status: string) => {
      statusMutation.mutate({ id, status })
    },
    [statusMutation]
  )

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
            className="gap-2 border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all font-semibold"
            onClick={openChatPanel}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI 챗봇
          </Button>
          <Button asChild size="lg" className="shadow-sm transition-all">
            <Link href="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              {t('campaigns.newCampaign')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Breadcrumb for drilldown */}
      {(selectedCampaignForDrilldown || selectedAdSetForDrilldown) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <button
            type="button"
            className="hover:text-foreground transition-colors"
            onClick={() => {
              setSelectedCampaignForDrilldown(null)
              setSelectedAdSetForDrilldown(null)
              setActiveTab('campaigns')
            }}
          >
            전체 캠페인
          </button>
          <ChevronRight className="h-4 w-4" />

          {selectedCampaignForDrilldown && (
            <>
              <button
                type="button"
                className={`transition-colors ${activeTab === 'adsets' && !selectedAdSetForDrilldown ? 'text-foreground font-medium' : 'hover:text-foreground'}`}
                onClick={() => {
                  setSelectedAdSetForDrilldown(null)
                  setActiveTab('adsets')
                }}
              >
                특정 캠페인의 광고 세트
              </button>
              {selectedAdSetForDrilldown && (
                <>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-foreground font-medium">광고</span>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* Filters and List Container */}
      <div className="bg-card border border-border/50 rounded-2xl p-6 space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as any)
            if (v === 'campaigns') {
              setSelectedCampaignForDrilldown(null)
              setSelectedAdSetForDrilldown(null)
            } else if (v === 'adsets' && !selectedCampaignForDrilldown) {
              // Direct click to adsets tab -> show all adsets
              setSelectedCampaignForDrilldown(null)
              setSelectedAdSetForDrilldown(null)
            } else if (v === 'ads' && !selectedAdSetForDrilldown) {
              // Direct click to ads tab -> show all ads
              setSelectedCampaignForDrilldown(null)
              setSelectedAdSetForDrilldown(null)
            }
          }}
          className="w-full"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <TabsList className="bg-muted/50 dark:bg-muted/20">
              <TabsTrigger value="campaigns">캠페인</TabsTrigger>
              <TabsTrigger value="adsets">광고 세트</TabsTrigger>
              <TabsTrigger value="ads">광고</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-4 border p-1 rounded-lg bg-muted/20">
              <Tabs
                value={period}
                onValueChange={(v) => setPeriod(v as CampaignKPIPeriod)}
              >
                <TabsList className="grid grid-cols-4 h-8">
                  <TabsTrigger value="today" className="text-xs">오늘</TabsTrigger>
                  <TabsTrigger value="yesterday" className="text-xs">어제</TabsTrigger>
                  <TabsTrigger value="7d" className="text-xs">7일</TabsTrigger>
                  <TabsTrigger value="30d" className="text-xs">30일</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={activeTab === 'campaigns' ? t('campaigns.searchPlaceholder') : '검색'}
                value={filters.searchQuery}
                onChange={(e) => setFilters({ searchQuery: e.target.value })}
                className="pl-9 bg-white/50 dark:bg-black/10 border-border/50 focus:bg-white dark:focus:bg-black/30 transition-colors"
              />
            </div>
            {activeTab === 'campaigns' && (
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
            )}
            {activeTab === 'campaigns' && (
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
            )}
          </div>

          {/* Bulk Action Bar */}
          {activeTab === 'campaigns' && selectedCampaignIds.size > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 mb-6">
              <span className="text-sm font-medium">{selectedCampaignIds.size}개 선택됨</span>
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
          {/* Main Content Areas */}
          {activeTab === 'campaigns' && (
            <CampaignTable
              campaigns={campaigns}
              isLoading={isKpiLoading}
              onRowClick={handleCampaignClick}
              onStatusChange={handleStatusChange}
            />
          )}

          {activeTab === 'adsets' && (
            <AdSetTable
              adSets={adSetsQuery.data ?? []}
              isLoading={adSetsQuery.isLoading}
              onAdSetClick={handleAdSetClick}
            />
          )}

          {activeTab === 'ads' && (
            <AdTable
              ads={adsQuery.data ?? []}
              isLoading={adsQuery.isLoading}
            />
          )}
        </Tabs>
      </div>
    </div>
  )
}

