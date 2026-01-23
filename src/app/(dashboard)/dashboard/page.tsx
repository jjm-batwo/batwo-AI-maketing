'use client'

import { KPICard, KPIChart, CampaignSummaryTable, AIInsights } from '@/presentation/components/dashboard'
import { useDashboardKPI } from '@/presentation/hooks'
import { useUIStore } from '@/presentation/stores'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OnboardingWizard } from '@/presentation/components/onboarding'

export default function DashboardPage() {
  const { dashboardPeriod, setDashboardPeriod } = useUIStore()
  const { data, isLoading, error } = useDashboardKPI({ period: dashboardPeriod })

  if (error) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-red-600">데이터를 불러오는데 실패했습니다</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            다시 시도
          </Button>
        </div>
      </div>
    )
  }

  const summary = data?.summary
  const changes = summary?.changes
  const chartData = data?.chartData ?? []

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
      <OnboardingWizard />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-2 border-b border-border/10">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">대시보드</h1>
          <p className="text-muted-foreground mt-2">
            오늘의 광고 성과를 <span className="text-primary font-medium">실시간</span>으로 확인하세요
          </p>
        </div>
        <Tabs value={dashboardPeriod} onValueChange={(v) => setDashboardPeriod(v as '7d' | '30d' | '90d')} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3 sm:w-auto bg-muted/50 dark:bg-muted/20">
            <TabsTrigger value="7d">7일</TabsTrigger>
            <TabsTrigger value="30d">30일</TabsTrigger>
            <TabsTrigger value="90d">90일</TabsTrigger>
          </TabsList>
        </Tabs>
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
          title="총 지출"
          value={summary?.totalSpend ?? 0}
          unit="원"
          format="currency"
          change={changes?.spend ?? 0}
          changeType="neutral"
          icon="dollar"
          isLoading={isLoading}
        />
        <KPICard
          title="전환수"
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
            <CardTitle>지출 추이</CardTitle>
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
            <CardTitle>ROAS 추이</CardTitle>
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
        <AIInsights isLoading={isLoading} />
        <Card>
          <CardHeader>
            <CardTitle>활성 캠페인</CardTitle>
          </CardHeader>
          <CardContent>
            <CampaignSummaryTable isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
