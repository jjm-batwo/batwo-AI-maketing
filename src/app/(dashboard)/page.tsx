'use client'

import { KPICard, KPIChart, CampaignSummaryTable } from '@/presentation/components/dashboard'
import { useDashboardKPI } from '@/presentation/hooks'
import { useUIStore } from '@/presentation/stores'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

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
  const chartData = data?.chartData || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-muted-foreground">광고 성과를 한눈에 확인하세요</p>
        </div>
        <Tabs value={dashboardPeriod} onValueChange={(v) => setDashboardPeriod(v as '7d' | '30d' | '90d')}>
          <TabsList>
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
          change={summary?.changes.roas ?? 0}
          changeType={
            (summary?.changes.roas ?? 0) > 0
              ? 'positive'
              : (summary?.changes.roas ?? 0) < 0
              ? 'negative'
              : 'neutral'
          }
          icon="chart"
          isLoading={isLoading}
        />
        <KPICard
          title="총 지출"
          value={summary?.totalSpend ?? 0}
          unit="원"
          format="currency"
          change={summary?.changes.spend ?? 0}
          changeType="neutral"
          icon="dollar"
          isLoading={isLoading}
        />
        <KPICard
          title="전환수"
          value={summary?.totalConversions ?? 0}
          format="number"
          change={summary?.changes.conversions ?? 0}
          changeType={
            (summary?.changes.conversions ?? 0) > 0
              ? 'positive'
              : (summary?.changes.conversions ?? 0) < 0
              ? 'negative'
              : 'neutral'
          }
          icon="target"
          isLoading={isLoading}
        />
        <KPICard
          title="CTR"
          value={summary?.averageCtr ?? 0}
          unit="%"
          format="percentage"
          change={summary?.changes.ctr ?? 0}
          changeType={
            (summary?.changes.ctr ?? 0) > 0
              ? 'positive'
              : (summary?.changes.ctr ?? 0) < 0
              ? 'negative'
              : 'neutral'
          }
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

      {/* Campaign Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle>활성 캠페인</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignSummaryTable isLoading={isLoading} />
        </CardContent>
      </Card>
    </div>
  )
}
