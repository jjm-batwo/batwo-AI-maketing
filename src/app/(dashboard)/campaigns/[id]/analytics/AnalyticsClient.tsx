'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KPICard } from '@/presentation/components/dashboard/KPICard'
import { KPIChart } from '@/presentation/components/dashboard/KPIChart'
import { ArrowLeft } from 'lucide-react'
import type { ChangeType, KPIIconType } from '@/presentation/components/dashboard/KPICard'

type KPIPeriod = 'today' | 'yesterday' | '7d' | '30d'

interface Campaign {
  id: string
  name: string
  dailyBudget?: number
  startDate?: string
  endDate?: string
}

interface CampaignKPIResponse {
  campaign: {
    id: string
    name: string
    status: string
    objective: string
    dailyBudget: number
    startDate: string
    endDate?: string
  }
  summary: {
    impressions: number
    clicks: number
    conversions: number
    spend: number
    revenue: number
    roas: number
    ctr: number
    cvr: number
    cpa: number
    cpc: number
    cpm: number
  }
  comparison: {
    impressions: number
    clicks: number
    conversions: number
    spend: number
    revenue: number
    roas: number
    ctr: number
  }
  chartData: Array<{
    date: string
    impressions: number
    clicks: number
    conversions: number
    spend: number
    revenue: number
    roas: number
    ctr: number
  }>
  period: string
}

interface AnalyticsClientProps {
  campaign: Campaign
}

const PERIOD_LABELS: Record<KPIPeriod, string> = {
  today: '오늘',
  yesterday: '어제',
  '7d': '최근 7일',
  '30d': '최근 30일',
}

export function AnalyticsClient({ campaign }: AnalyticsClientProps) {
  const t = useTranslations()
  const [period, setPeriod] = useState<KPIPeriod>('today')

  const { data, isLoading } = useQuery<CampaignKPIResponse>({
    queryKey: ['campaign-kpi', campaign.id, period],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${campaign.id}/kpi?period=${period}`)
      if (!res.ok) throw new Error('KPI 데이터를 불러오지 못했습니다')
      return res.json()
    },
    staleTime: 60 * 1000,
  })

  const summary = data?.summary
  const comparison = data?.comparison
  const chartData = data?.chartData ?? []

  // chartData에서 sparkline 및 차트 데이터 추출
  const sparklinePatterns = useMemo(() => {
    if (chartData.length === 0) return {} as Record<string, number[]>
    return {
      ctr: chartData.map(d => d.ctr),
      cvr: chartData.map(d => d.clicks > 0 ? (d.conversions / d.clicks) * 100 : 0),
      cpc: chartData.map(d => d.clicks > 0 ? d.spend / d.clicks : 0),
      roas: chartData.map(d => d.roas),
    }
  }, [chartData])

  const getChangeType = (value: number | undefined): ChangeType => {
    const v = value ?? 0
    if (v > 0) return 'positive'
    if (v < 0) return 'negative'
    return 'neutral'
  }

  // KPI 카드 설정 (대시보드와 동일 패턴)
  const kpiCards: Array<{
    key: string
    title: string
    value: number
    format: 'number' | 'currency' | 'percentage' | 'multiplier'
    unit?: string
    icon: KPIIconType
    change: number
    sparklineKey: string
  }> = [
    {
      key: 'ctr',
      title: '클릭률 (CTR)',
      value: summary?.ctr ?? 0,
      format: 'percentage',
      unit: '%',
      icon: 'click',
      change: comparison?.ctr ?? 0,
      sparklineKey: 'ctr',
    },
    {
      key: 'cvr',
      title: '전환율 (CVR)',
      value: summary?.cvr ?? 0,
      format: 'percentage',
      unit: '%',
      icon: 'target',
      change: comparison?.conversions ?? 0,
      sparklineKey: 'cvr',
    },
    {
      key: 'cpc',
      title: '클릭당 비용 (CPC)',
      value: summary?.cpc ?? 0,
      format: 'currency',
      unit: '원',
      icon: 'dollar',
      change: comparison?.spend ? -comparison.spend : 0,
      sparklineKey: 'cpc',
    },
    {
      key: 'roas',
      title: 'ROAS',
      value: summary?.roas ?? 0,
      format: 'multiplier',
      unit: 'x',
      icon: 'chart',
      change: comparison?.roas ?? 0,
      sparklineKey: 'roas',
    },
  ]

  const currencySuffix = t('currency.suffix')

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between pb-2 border-b border-border/10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/campaigns/${campaign.id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground">캠페인 분석</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {isLoading ? '데이터 로딩 중...' : `${PERIOD_LABELS[period]} 기준`}
          </span>
          <Tabs value={period} onValueChange={(v) => setPeriod(v as KPIPeriod)} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-4 sm:w-auto bg-muted/50 dark:bg-muted/20">
              <TabsTrigger value="today">오늘</TabsTrigger>
              <TabsTrigger value="yesterday">어제</TabsTrigger>
              <TabsTrigger value="7d">7일</TabsTrigger>
              <TabsTrigger value="30d">30일</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* KPI Cards — 대시보드와 동일한 KPICard 컴포넌트 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <KPICard
            key={kpi.key}
            title={kpi.title}
            value={kpi.value}
            unit={kpi.unit}
            format={kpi.format}
            change={kpi.change}
            changeType={getChangeType(kpi.change)}
            icon={kpi.icon}
            isLoading={isLoading}
            sparklineData={sparklinePatterns[kpi.sparklineKey as keyof typeof sparklinePatterns]}
          />
        ))}
      </div>

      {/* Charts — 대시보드와 동일한 Card 래핑 + area 차트 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>일일 노출수</CardTitle>
          </CardHeader>
          <CardContent>
            <KPIChart
              data={chartData.map((d) => ({ label: d.date, value: d.impressions }))}
              color="blue"
              yAxisFormat="number"
              isLoading={isLoading}
              chartType="area"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>일일 클릭수</CardTitle>
          </CardHeader>
          <CardContent>
            <KPIChart
              data={chartData.map((d) => ({ label: d.date, value: d.clicks }))}
              color="green"
              yAxisFormat="number"
              isLoading={isLoading}
              chartType="area"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>일일 전환수</CardTitle>
          </CardHeader>
          <CardContent>
            <KPIChart
              data={chartData.map((d) => ({ label: d.date, value: d.conversions }))}
              color="purple"
              yAxisFormat="number"
              isLoading={isLoading}
              chartType="area"
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>일일 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <KPIChart
              data={chartData.map((d) => ({ label: d.date, value: d.spend }))}
              color="primary"
              yAxisFormat="currency"
              isLoading={isLoading}
              chartType="area"
            />
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>성과 요약</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">총 노출수</p>
                {isLoading ? (
                  <div className="mt-1 h-8 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="text-2xl font-bold">
                    {summary?.impressions.toLocaleString() ?? 0}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 클릭수</p>
                {isLoading ? (
                  <div className="mt-1 h-8 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="text-2xl font-bold">
                    {summary?.clicks.toLocaleString() ?? 0}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 전환수</p>
                {isLoading ? (
                  <div className="mt-1 h-8 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="text-2xl font-bold">
                    {summary?.conversions.toLocaleString() ?? 0}
                  </p>
                )}
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">캠페인 기간</p>
                  <p className="font-medium">
                    {campaign.startDate
                      ? new Date(campaign.startDate).toLocaleDateString('ko-KR')
                      : '-'}{' '}
                    ~{' '}
                    {campaign.endDate
                      ? new Date(campaign.endDate).toLocaleDateString('ko-KR')
                      : '진행중'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 지출</p>
                  {isLoading ? (
                    <div className="mt-1 h-6 w-28 animate-pulse rounded bg-muted" />
                  ) : (
                    <p className="font-medium">
                      {summary?.spend.toLocaleString() ?? 0}{currencySuffix}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
