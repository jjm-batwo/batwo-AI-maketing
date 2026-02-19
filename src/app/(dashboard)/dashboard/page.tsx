'use client'

import { Suspense, lazy, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { ApiSourceBadge } from '@/presentation/components/common/ApiSourceBadge'
import Link from 'next/link'
import { KPICard, KPIChart } from '@/presentation/components/dashboard'
import { DonutChart } from '@/presentation/components/dashboard/DonutChart'
import { useDashboardKPI, useMetaConnection, useSync, useCampaigns, useKPIInsights } from '@/presentation/hooks'
import { useUIStore } from '@/presentation/stores'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  const searchParams = useSearchParams()
  const showApiSource = searchParams.get('showApiSource') === 'true'
  const { dashboardPeriod, setDashboardPeriod, dashboardObjective, setDashboardObjective } = useUIStore()
  const { isConnected, isLoading: isCheckingConnection } = useMetaConnection()
  const { data, isLoading, error } = useDashboardKPI({
    period: dashboardPeriod,
    objective: dashboardObjective,
    includeBreakdown: true, // 캠페인별 KPI 데이터 포함
    includeComparison: true, // 지난 기간 대비 변화율 포함
    enabled: isConnected, // Meta 연결 시에만 데이터 fetch
  })
  const { data: campaignsData } = useCampaigns({
    pageSize: 100,
    enabled: isConnected,
  })
  const sync = useSync()

  // KPI 기반 AI Insights 데이터 가져오기
  const {
    insights: kpiInsights,
    isLoading: isInsightsLoading,
    refetch: refetchInsights,
  } = useKPIInsights({
    enabled: isConnected,
  })

  const summary = data?.summary
  const changes = summary?.changes
  const chartData = data?.chartData ?? []

  // KPI별 스파크라인 mock 데이터 (상승/하락/보합 패턴)
  const sparklinePatterns = {
    roas:        [3.2, 3.5, 3.1, 3.8, 3.6, 4.0, 4.2],
    spend:       [120, 135, 118, 142, 138, 155, 149],
    conversions: [42, 38, 45, 50, 48, 52, 55],
    ctr:         [2.1, 2.3, 2.0, 2.4, 2.2, 2.6, 2.5],
    clicks:      [310, 290, 340, 380, 360, 400, 420],
    impressions: [8200, 7900, 8600, 9100, 8800, 9500, 9300],
    revenue:     [580, 620, 545, 670, 640, 710, 690],
    cpa:         [2800, 2600, 2950, 2500, 2700, 2400, 2450],
    cvr:         [3.5, 3.2, 3.8, 4.0, 3.7, 4.2, 4.1],
    reach:       [5400, 5100, 5700, 6000, 5800, 6300, 6100],
  }

  // 캠페인 상태별 분포 계산 (실데이터 우선, 없으면 mock)
  const campaignStatusSegments = useMemo(() => {
    const campaigns = campaignsData?.campaigns ?? []
    if (campaigns.length === 0) {
      return [
        { label: '진행 중',  value: 5, color: '#22c55e' },
        { label: '일시정지', value: 2, color: '#eab308' },
        { label: '초안',     value: 3, color: '#3b82f6' },
        { label: '완료',     value: 1, color: '#9ca3af' },
      ]
    }
    const counts: Record<string, number> = { ACTIVE: 0, PAUSED: 0, DRAFT: 0, COMPLETED: 0 }
    campaigns.forEach((c: { status: string }) => {
      const key = c.status in counts ? c.status : 'DRAFT'
      counts[key]++
    })
    return [
      { label: '진행 중',  value: counts.ACTIVE,    color: '#22c55e' },
      { label: '일시정지', value: counts.PAUSED,    color: '#eab308' },
      { label: '초안',     value: counts.DRAFT,     color: '#3b82f6' },
      { label: '완료',     value: counts.COMPLETED, color: '#9ca3af' },
    ].filter(s => s.value > 0)
  }, [campaignsData?.campaigns])

  const totalCampaigns = useMemo(
    () => campaignStatusSegments.reduce((sum, s) => sum + s.value, 0),
    [campaignStatusSegments]
  )

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
              {t('dashboard.subtitlePrefix')}
              <span className="text-primary font-medium">{t('dashboard.realtime')}</span>
              {t('dashboard.subtitleSuffix')}
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

  // Helper to determine change type
  const getChangeType = (value: number | undefined): 'positive' | 'negative' | 'neutral' => {
    const v = value ?? 0
    if (v > 0) return 'positive'
    if (v < 0) return 'negative'
    return 'neutral'
  }

  // Helper to safely get KPI values from summary
  const getKPIValue = (summaryData: unknown, key: string): number => {
    if (!summaryData || typeof summaryData !== 'object') return 0
    const value = (summaryData as Record<string, unknown>)[key]
    return typeof value === 'number' ? value : 0
  }

  // Helper to safely get change values
  const getChangeValue = (changesData: unknown, key: string): number => {
    if (!changesData || typeof changesData !== 'object') return 0
    const value = (changesData as Record<string, unknown>)[key]
    return typeof value === 'number' ? value : 0
  }

  // KPI Configuration interface
  interface KPIConfigItem {
    key: string
    title: string
    valueKey: string
    changeKey?: string
    format: 'number' | 'currency' | 'percentage' | 'multiplier'
    unit?: string
    icon: 'chart' | 'dollar' | 'click' | 'target' | 'eye'
  }

  // Objective-specific KPI configurations
  const objectiveKPIConfig: Record<string, KPIConfigItem[]> = {
    ALL: [
      { key: 'roas', title: 'ROAS', valueKey: 'averageRoas', changeKey: 'roas', format: 'multiplier', unit: 'x', icon: 'chart' },
      { key: 'spend', title: t('dashboard.kpi.totalSpend'), valueKey: 'totalSpend', changeKey: 'spend', format: 'currency', unit: '원', icon: 'dollar' },
      { key: 'conversions', title: t('dashboard.kpi.conversions'), valueKey: 'totalConversions', changeKey: 'conversions', format: 'number', icon: 'target' },
      { key: 'ctr', title: 'CTR', valueKey: 'averageCtr', changeKey: 'ctr', format: 'percentage', unit: '%', icon: 'click' },
    ],
    TRAFFIC: [
      { key: 'clicks', title: '클릭수', valueKey: 'totalClicks', changeKey: 'clicks', format: 'number', icon: 'click' },
      { key: 'ctr', title: 'CTR', valueKey: 'averageCtr', changeKey: 'ctr', format: 'percentage', unit: '%', icon: 'click' },
      { key: 'spend', title: '지출', valueKey: 'totalSpend', changeKey: 'spend', format: 'currency', unit: '원', icon: 'dollar' },
      { key: 'impressions', title: '노출수', valueKey: 'totalImpressions', format: 'number', icon: 'eye' },
    ],
    SALES: [
      { key: 'roas', title: 'ROAS', valueKey: 'averageRoas', changeKey: 'roas', format: 'multiplier', unit: 'x', icon: 'chart' },
      { key: 'revenue', title: '매출', valueKey: 'totalRevenue', changeKey: 'revenue', format: 'currency', unit: '원', icon: 'dollar' },
      { key: 'conversions', title: '전환수', valueKey: 'totalConversions', changeKey: 'conversions', format: 'number', icon: 'target' },
      { key: 'spend', title: '지출', valueKey: 'totalSpend', changeKey: 'spend', format: 'currency', unit: '원', icon: 'dollar' },
    ],
    CONVERSIONS: [
      { key: 'conversions', title: '전환수', valueKey: 'totalConversions', changeKey: 'conversions', format: 'number', icon: 'target' },
      { key: 'cpa', title: 'CPA', valueKey: 'averageCpa', format: 'currency', unit: '원', icon: 'dollar' },
      { key: 'cvr', title: 'CVR', valueKey: 'cvr', format: 'percentage', unit: '%', icon: 'target' },
      { key: 'spend', title: '지출', valueKey: 'totalSpend', changeKey: 'spend', format: 'currency', unit: '원', icon: 'dollar' },
    ],
    AWARENESS: [
      { key: 'impressions', title: '노출수', valueKey: 'totalImpressions', format: 'number', icon: 'eye' },
      { key: 'reach', title: '도달', valueKey: 'totalImpressions', format: 'number', icon: 'eye' }, // Using impressions as proxy
      { key: 'spend', title: '지출', valueKey: 'totalSpend', changeKey: 'spend', format: 'currency', unit: '원', icon: 'dollar' },
      { key: 'ctr', title: 'CTR', valueKey: 'averageCtr', changeKey: 'ctr', format: 'percentage', unit: '%', icon: 'click' },
    ],
    ENGAGEMENT: [
      { key: 'clicks', title: '참여수', valueKey: 'totalClicks', format: 'number', icon: 'click' },
      { key: 'ctr', title: '참여율', valueKey: 'averageCtr', changeKey: 'ctr', format: 'percentage', unit: '%', icon: 'click' },
      { key: 'impressions', title: '노출수', valueKey: 'totalImpressions', format: 'number', icon: 'eye' },
      { key: 'spend', title: '지출', valueKey: 'totalSpend', changeKey: 'spend', format: 'currency', unit: '원', icon: 'dollar' },
    ],
    LEADS: [
      { key: 'conversions', title: '리드수', valueKey: 'totalConversions', changeKey: 'conversions', format: 'number', icon: 'target' },
      { key: 'cpa', title: 'CPL', valueKey: 'averageCpa', format: 'currency', unit: '원', icon: 'dollar' },
      { key: 'spend', title: '지출', valueKey: 'totalSpend', changeKey: 'spend', format: 'currency', unit: '원', icon: 'dollar' },
      { key: 'ctr', title: 'CTR', valueKey: 'averageCtr', changeKey: 'ctr', format: 'percentage', unit: '%', icon: 'click' },
    ],
    APP_PROMOTION: [
      { key: 'conversions', title: '설치수', valueKey: 'totalConversions', changeKey: 'conversions', format: 'number', icon: 'target' },
      { key: 'cpa', title: 'CPI', valueKey: 'averageCpa', format: 'currency', unit: '원', icon: 'dollar' },
      { key: 'clicks', title: '클릭수', valueKey: 'totalClicks', format: 'number', icon: 'click' },
      { key: 'spend', title: '지출', valueKey: 'totalSpend', changeKey: 'spend', format: 'currency', unit: '원', icon: 'dollar' },
    ],
  }

  // Get the KPI config for the current objective
  const currentKPIConfig = objectiveKPIConfig[dashboardObjective] || objectiveKPIConfig.ALL

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
            {t('dashboard.subtitlePrefix')}
            <span className="text-primary font-medium">{t('dashboard.realtime')}</span>
            {t('dashboard.subtitleSuffix')}
          </p>
          {showApiSource && <ApiSourceBadge endpoint="GET /act_{id}/insights" permission="ads_read" className="mt-2" />}
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

          {/* Campaign Objective Filter */}
          <Select value={dashboardObjective} onValueChange={setDashboardObjective}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="캠페인 유형" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              <SelectItem value="TRAFFIC">트래픽</SelectItem>
              <SelectItem value="SALES">판매</SelectItem>
              <SelectItem value="CONVERSIONS">전환</SelectItem>
              <SelectItem value="AWARENESS">인지도</SelectItem>
              <SelectItem value="ENGAGEMENT">참여</SelectItem>
              <SelectItem value="LEADS">리드</SelectItem>
            </SelectContent>
          </Select>

          {/* Period Tabs */}
          <Tabs value={dashboardPeriod} onValueChange={(v) => setDashboardPeriod(v as typeof dashboardPeriod)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-4 sm:w-auto bg-muted/50 dark:bg-muted/20">
              <TabsTrigger value="today">오늘</TabsTrigger>
              <TabsTrigger value="yesterday">어제</TabsTrigger>
              <TabsTrigger value="7d">7일</TabsTrigger>
              <TabsTrigger value="30d">30일</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {currentKPIConfig.map((kpi) => (
          <KPICard
            key={kpi.key}
            title={kpi.title}
            value={getKPIValue(summary, kpi.valueKey)}
            unit={kpi.unit}
            format={kpi.format}
            change={kpi.changeKey ? getChangeValue(changes, kpi.changeKey) : 0}
            changeType={kpi.changeKey ? getChangeType(getChangeValue(changes, kpi.changeKey)) : 'neutral'}
            icon={kpi.icon}
            isLoading={isLoading}
            sparklineData={sparklinePatterns[kpi.key as keyof typeof sparklinePatterns] ?? sparklinePatterns.conversions}
          />
        ))}
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
              chartType="area"
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
              yAxisFormat="multiplier"
              isLoading={isLoading}
              chartType="area"
            />
          </CardContent>
        </Card>
      </div>

      {/* 캠페인 상태 분포 */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>캠페인 상태 분포</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-2">
            <DonutChart
              segments={campaignStatusSegments}
              centerValue={totalCampaigns}
              centerLabel="전체"
              size={140}
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
          <AIInsights
              insights={kpiInsights}
              isLoading={isLoading || isInsightsLoading}
              onRefresh={refetchInsights}
            />
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
