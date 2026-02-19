'use client'

import { useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ApiSourceBadge } from '@/presentation/components/common/ApiSourceBadge'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CampaignList } from '@/presentation/components/campaign'
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

const STATUS_PRIORITY: Record<string, number> = {
  ACTIVE: 0,
  PAUSED: 1,
  PENDING_REVIEW: 2,
  DRAFT: 3,
  COMPLETED: 4,
}

interface CampaignWithKPI {
  id: string
  status: string
  createdAt?: string
  [key: string]: any
}

interface CampaignsClientProps {
  initialCampaigns: CampaignWithKPI[]
  initialKpiData?: {
    campaignBreakdown?: Array<{
      campaignId: string
      spend: number
      roas: number
    }>
  }
}

export function CampaignsClient({ initialCampaigns, initialKpiData }: CampaignsClientProps) {
  const t = useTranslations()
  const searchParams = useSearchParams()
  const showApiSource = searchParams.get('showApiSource') === 'true'
  const { filters, setFilters } = useCampaignStore()

  // 캠페인 데이터에 KPI 지출/ROAS 병합
  const rawCampaigns = useMemo((): CampaignWithKPI[] => {
    if (initialCampaigns.length === 0) return []

    const breakdownMap = new Map(
      (initialKpiData?.campaignBreakdown ?? []).map((b: { campaignId: string; spend: number; roas: number }) => [b.campaignId, b])
    )

    return initialCampaigns.map((campaign): CampaignWithKPI => {
      const breakdown = breakdownMap.get(campaign.id)
      return {
        ...campaign,
        spend: breakdown?.spend ?? 0,
        roas: breakdown?.roas ?? 0,
      }
    })
  }, [initialCampaigns, initialKpiData?.campaignBreakdown])

  // 활성 캠페인을 상단에 배치하는 정렬 로직
  const campaigns = useMemo(() => {
    if (filters.status !== 'ALL') {
      return rawCampaigns.filter(c => c.status === filters.status)
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
          {showApiSource && <ApiSourceBadge endpoint="POST /act_{id}/campaigns" permission="ads_management" className="mt-2" />}
        </div>
        <Button asChild size="lg" className="shadow-sm hover:shadow-primary/30 transition-all">
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            {t('campaigns.newCampaign')}
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
              placeholder={t('campaigns.searchPlaceholder')}
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
            onValueChange={(value) =>
              setFilters({ sortBy: value as typeof filters.sortBy })
            }
          >
            <SelectTrigger className="w-[160px] bg-white/50 dark:bg-black/10 border-border/50">
              <SelectValue placeholder={t('campaigns.sort.label')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">{t('campaigns.sort.createdAt')}</SelectItem>
              <SelectItem value="name">{t('campaigns.sort.name')}</SelectItem>
              <SelectItem value="spend">{t('campaigns.sort.spend')}</SelectItem>
              <SelectItem value="roas">{t('campaigns.sort.roas')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Campaign List */}
        <CampaignList campaigns={campaigns as any} isLoading={false} />
      </div>
    </div>
  )
}
