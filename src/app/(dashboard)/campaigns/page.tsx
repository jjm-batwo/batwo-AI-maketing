'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { CampaignList } from '@/presentation/components/campaign'
import { useCampaigns, useMetaConnection } from '@/presentation/hooks'
import { useCampaignStore } from '@/presentation/stores'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Link2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function CampaignsPage() {
  const t = useTranslations()
  const { filters, setFilters } = useCampaignStore()
  const { isConnected, isLoading: isCheckingConnection } = useMetaConnection()
  const { data, isLoading, error } = useCampaigns({
    status: filters.status === 'ALL' ? undefined : filters.status,
    enabled: isConnected, // Meta 연결 시에만 데이터 fetch
  })

  const campaigns = isConnected ? (data?.campaigns || []) : []

  // Meta 미연결 시 안내 UI
  if (!isCheckingConnection && !isConnected) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-end justify-between border-b border-border/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('campaigns.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('campaigns.subtitle')}</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Link2 className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('metaConnect.notConnected.title')}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t('metaConnect.notConnected.description')}
            </p>
            <Button asChild className="bg-[#1877F2] hover:bg-[#1877F2]/90">
              <Link href="/settings/meta-connect">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {t('metaConnect.notConnected.button')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border/10 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('campaigns.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('campaigns.subtitle')}</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
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

        {/* Error State */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              {t('campaigns.errorLoad')}: {error.message}
            </p>
          </div>
        )}

        {/* Campaign List */}
        <CampaignList campaigns={campaigns} isLoading={isLoading} />
      </div>
    </div>
  )
}
