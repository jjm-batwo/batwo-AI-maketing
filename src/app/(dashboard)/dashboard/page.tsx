'use client'

import { Suspense, lazy, useMemo } from 'react'
import Link from 'next/link'
import { KPICard, KPIChart } from '@/presentation/components/dashboard'
import { useDashboardKPI, useMetaConnection, useSync, useCampaigns } from '@/presentation/hooks'
import { useUIStore } from '@/presentation/stores'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useTranslations } from 'next-intl'
import { Link2, RefreshCw } from 'lucide-react'

// Dynamic imports for heavy components
const OnboardingWizard = lazy(() =>
  import('@/presentation/components/onboarding').then(mod => ({ default: mod.OnboardingWizard }))
)
const CampaignSummaryTable = lazy(() =>
  import('@/presentation/components/dashboard').then(mod => ({ default: mod.CampaignSummaryTable }))
)
const AIInsights = lazy(() =>
  import('@/presentation/components/dashboard').then(mod => ({ default: mod.AIInsights }))
)

export default function DashboardPage() {
  const t = useTranslations()
  const { dashboardPeriod, setDashboardPeriod } = useUIStore()
  const { isConnected, isLoading: isCheckingConnection } = useMetaConnection()
  const { data, isLoading, error } = useDashboardKPI({
    period: dashboardPeriod,
    includeBreakdown: true, // 캠페인별 KPI 데이터 포함
    includeComparison: true, // 지난 기간 대비 변화율 포함
    enabled: isConnected, // Meta 연결 시에만 데이터 fetch
  })
  const { data: campaignsData } = useCampaigns({
    pageSize: 100,
    enabled: isConnected,
  })
  const sync = useSync()

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">{t('dashboard.errorTitle')}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            {t('common.retry')}
          </Button>
        </div>
      </div>
    )
  }

  // Meta 미연결 시 안내 UI
  if (!isCheckingConnection && !isConnected) {
    return (
      <div className="space-y-8 animate-fade-in">
        <Suspense fallback={<div className="h-20" />}>
          <OnboardingWizard />
        </Suspense>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-2 border-b border-border/10">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground mt-2">
              {t('dashboard.subtitle').split('{realtime}')[0]}
              <span className="text-primary font-medium">{t('dashboard.realtime')}</span>
              {t('dashboard.subtitle').split('{realtime}')[1]}
            </p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Link2 className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">{t('metaConnect.notConnected.title')}</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              {t('metaConnect.notConnected.dashboardDescription')}
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

  const summary = data?.summary
  const changes = summary?.changes
  const chartData = data?.chartData ?? []

  // CampaignSummaryTable용 캠페인 데이터 변환
  // 대시보드에는 ACTIVE 캠페인만 표시
  const campaignSummaries = useMemo(() => {
    const campaigns = campaignsData?.campaigns ?? []
    if (campaigns.length === 0) return []

    // 캠페인 ID로 빠른 조회를 위한 맵 생성
    const breakdownMap = new Map(
      (data?.campaignBreakdown ?? []).map((b: { campaignId: string; spend: number; roas: number; ctr: number }) => [b.campaignId, b])
    )

    // ACTIVE 캠페인만 필터링
    const activeCampaigns = campaigns.filter(
      (campaign: { status: string }) => campaign.status === 'ACTIVE'
    )

    return activeCampaigns.map((campaign: { id: string; name: string; status: string; spend?: number; roas?: number }) => {
      const breakdown = breakdownMap.get(campaign.id)
      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status as 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT',
        spend: breakdown?.spend ?? campaign.spend ?? 0,
        roas: breakdown?.roas ?? campaign.roas ?? 0,
        ctr: breakdown?.ctr ?? 0,
      }
    })
  }, [campaignsData?.campaigns, data?.campaignBreakdown])

  // Helper to determine change type
  const getChangeType = (value: number | undefined): 'positive' | 'negative' | 'neutral' => {
    const v = value ?? 0
    if (v > 0) return 'positive'
    if (v < 0) return 'negative'
    return 'neutral'
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Onboarding Wizard for new users */}
      <Suspense fallback={<div className="h-20" />}>
        <OnboardingWizard />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-2 border-b border-border/10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('dashboard.subtitle').split('{realtime}')[0]}
            <span className="text-primary font-medium">{t('dashboard.realtime')}</span>
            {t('dashboard.subtitle').split('{realtime}')[1]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => sync.mutate()}
            disabled={sync.isPending}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${sync.isPending ? 'animate-spin' : ''}`} />
            {sync.isPending ? t('dashboard.syncing') : t('dashboard.sync')}
          </Button>
          <Tabs value={dashboardPeriod} onValueChange={(v) => setDashboardPeriod(v as '7d' | '30d' | '90d')} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto bg-muted/50 dark:bg-muted/20">
              <TabsTrigger value="7d">{t('dashboard.period.7d')}</TabsTrigger>
              <TabsTrigger value="30d">{t('dashboard.period.30d')}</TabsTrigger>
              <TabsTrigger value="90d">{t('dashboard.period.90d')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="ROAS"
          value={summary?.averageRoas ?? 0}
          unit="x"
          format="multiplier"
          change={changes?.roas ?? 0}
          changeType={getChangeType(changes?.roas)}
          icon="chart"
          isLoading={isLoading}
        />
        <KPICard
          title={t('dashboard.kpi.totalSpend')}
          value={summary?.totalSpend ?? 0}
          unit="원"
          format="currency"
          change={changes?.spend ?? 0}
          changeType="neutral"
          icon="dollar"
          isLoading={isLoading}
        />
        <KPICard
          title={t('dashboard.kpi.conversions')}
          value={summary?.totalConversions ?? 0}
          format="number"
          change={changes?.conversions ?? 0}
          changeType={getChangeType(changes?.conversions)}
          icon="target"
          isLoading={isLoading}
        />
        <KPICard
          title="CTR"
          value={summary?.averageCtr ?? 0}
          unit="%"
          format="percentage"
          change={changes?.ctr ?? 0}
          changeType={getChangeType(changes?.ctr)}
          icon="click"
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.charts.spendTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <KPIChart
              data={chartData.map((d) => ({ label: d.date, value: d.spend }))}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.charts.roasTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <KPIChart
              data={chartData.map((d) => ({ label: d.date, value: d.roas }))}
              color="green"
              isLoading={isLoading}
            />
          </CardContent>
        </Card>
      </div>

      {/* AI Insights & Campaign Summary */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Suspense fallback={
          <Card>
            <CardHeader><CardTitle>AI 인사이트</CardTitle></CardHeader>
            <CardContent><div className="h-48 animate-pulse bg-gray-100 rounded" /></CardContent>
          </Card>
        }>
          <AIInsights isLoading={isLoading} />
        </Suspense>
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.activeCampaigns')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-48 animate-pulse bg-gray-100 rounded" />}>
              <CampaignSummaryTable campaigns={campaignSummaries} isLoading={isLoading} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
