'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useCampaign } from '@/presentation/hooks'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPIChart } from '@/presentation/components/dashboard/KPIChart'
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalyticsMetric {
  label: string
  value: string
  change?: number
  trend?: 'up' | 'down'
}

export default function CampaignAnalyticsPage() {
  const params = useParams()
  const id = params.id as string
  const t = useTranslations()
  const { data: campaign, isLoading, error } = useCampaign(id)

  // Calculate metrics once when campaign data changes
  const calculatedMetrics = useMemo(() => {
    if (!campaign) return null

    const ctr = campaign.impressions && campaign.clicks
      ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
      : '0.00'

    const cpc = campaign.clicks && campaign.totalSpent
      ? (campaign.totalSpent / campaign.clicks).toFixed(0)
      : '0'

    const conversionRate = campaign.clicks && campaign.conversions
      ? ((campaign.conversions / campaign.clicks) * 100).toFixed(2)
      : '0.00'

    // Calculate days since start based on campaign start date
    // This is stable because it only depends on campaign.startDate which doesn't change often
    const daysSinceStart = campaign.startDate
      ? Math.max(1, Math.ceil((new Date().getTime() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 1

    const totalBudget = campaign.dailyBudget
      ? campaign.dailyBudget * daysSinceStart
      : 0

    return { ctr, cpc, conversionRate, totalBudget }
  }, [campaign])

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="h-8 w-48 animate-pulse bg-gray-200 rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-32 animate-pulse bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold text-red-600">
          {t('campaigns.error.notFound')}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {error?.message || t('campaigns.error.loadFailed')}
        </p>
        <Button asChild className="mt-4">
          <Link href="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('campaigns.backToList')}
          </Link>
        </Button>
      </div>
    )
  }

  if (!calculatedMetrics) {
    return null
  }

  const { ctr, cpc, conversionRate, totalBudget } = calculatedMetrics

  // Generate mock daily data for the last 7 days
  const generateDailyData = (baseValue: number, variance: number = 0.2) => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      const randomFactor = 1 + (Math.random() - 0.5) * variance
      return {
        date: date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        value: Math.round(baseValue * randomFactor),
      }
    })
  }

  const impressionsData = generateDailyData((campaign.impressions || 0) / 7, 0.3)
  const clicksData = generateDailyData((campaign.clicks || 0) / 7, 0.4)
  const conversionsData = generateDailyData((campaign.conversions || 0) / 7, 0.5)
  const spendData = generateDailyData((campaign.totalSpent || 0) / 7, 0.2)

  const metrics: AnalyticsMetric[] = [
    {
      label: '클릭률 (CTR)',
      value: `${ctr}%`,
      change: 5.2,
      trend: 'up',
    },
    {
      label: '전환율',
      value: `${conversionRate}%`,
      change: 3.1,
      trend: 'up',
    },
    {
      label: '클릭당 비용 (CPC)',
      value: `${Number(cpc).toLocaleString()}원`,
      change: -2.4,
      trend: 'down',
    },
    {
      label: 'ROAS',
      value: `${campaign.roas?.toFixed(2) || '0.00'}x`,
      change: 8.7,
      trend: 'up',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/campaigns/${id}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <p className="text-muted-foreground">캠페인 분석</p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold">{metric.value}</p>
                {metric.change !== undefined && (
                  <div
                    className={cn(
                      'flex items-center gap-1 text-sm font-medium',
                      metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <KPIChart
          title="일일 노출수"
          data={impressionsData}
          color="blue"
          isLoading={false}
        />
        <KPIChart
          title="일일 클릭수"
          data={clicksData}
          color="green"
          isLoading={false}
        />
        <KPIChart
          title="일일 전환수"
          data={conversionsData}
          color="purple"
          isLoading={false}
        />
        <KPIChart
          title="일일 지출"
          data={spendData}
          color="primary"
          isLoading={false}
        />
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
                <p className="text-2xl font-bold">
                  {campaign.impressions?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 클릭수</p>
                <p className="text-2xl font-bold">
                  {campaign.clicks?.toLocaleString() || 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">총 전환수</p>
                <p className="text-2xl font-bold">
                  {campaign.conversions?.toLocaleString() || 0}
                </p>
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
                  <p className="font-medium">
                    {campaign.totalSpent?.toLocaleString() || 0}원 /{' '}
                    {totalBudget.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
