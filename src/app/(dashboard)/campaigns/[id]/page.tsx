'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useCampaign, useCampaignKPI, useUpdateCampaign } from '@/presentation/hooks'
import { KPICard } from '@/presentation/components/dashboard/KPICard'
import { KPIChart } from '@/presentation/components/dashboard/KPIChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Play,
  Pause,
  Pencil,
  Calendar,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: '진행 중', className: 'bg-green-100 text-green-700' },
  PAUSED: { label: '일시정지', className: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: '완료', className: 'bg-gray-100 text-gray-700' },
  DRAFT: { label: '초안', className: 'bg-blue-100 text-blue-700' },
  PENDING_REVIEW: { label: '검토 중', className: 'bg-purple-100 text-purple-700' },
}

const objectiveLabels: Record<string, string> = {
  TRAFFIC: '트래픽',
  CONVERSIONS: '전환',
  BRAND_AWARENESS: '브랜드 인지도',
  REACH: '도달',
  ENGAGEMENT: '참여',
}

function getChangeType(change: number, isPositiveGood: boolean = true) {
  if (change === 0) return 'neutral'
  if (isPositiveGood) {
    return change > 0 ? 'positive' : 'negative'
  }
  return change > 0 ? 'negative' : 'positive'
}

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = params.id as string
  const [period, setPeriod] = useState('7d')

  const { data: campaign, isLoading: campaignLoading } = useCampaign(campaignId)
  const { data: kpiData, isLoading: kpiLoading } = useCampaignKPI(campaignId, period)
  const updateCampaign = useUpdateCampaign()

  const handleStatusChange = async (newStatus: 'ACTIVE' | 'PAUSED') => {
    try {
      await updateCampaign.mutateAsync({ id: campaignId, status: newStatus })
    } catch (error) {
      console.error('Failed to update campaign status:', error)
    }
  }

  if (campaignLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">캠페인을 찾을 수 없습니다</h2>
        <Button asChild className="mt-4">
          <Link href="/campaigns">캠페인 목록으로</Link>
        </Button>
      </div>
    )
  }

  const statusInfo = statusConfig[campaign.status] || statusConfig.DRAFT
  const summary = kpiData?.summary
  const comparison = kpiData?.comparison
  const chartData = kpiData?.chartData || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/campaigns">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge className={cn('ml-2', statusInfo.className)}>
              {statusInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              {objectiveLabels[campaign.objective] || campaign.objective}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(campaign.startDate).toLocaleDateString('ko-KR')}
              {campaign.endDate && ` ~ ${new Date(campaign.endDate).toLocaleDateString('ko-KR')}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {campaign.status === 'ACTIVE' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('PAUSED')}
              disabled={updateCampaign.isPending}
            >
              <Pause className="mr-1 h-4 w-4" />
              일시정지
            </Button>
          )}
          {campaign.status === 'PAUSED' && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange('ACTIVE')}
              disabled={updateCampaign.isPending}
            >
              <Play className="mr-1 h-4 w-4" />
              재개
            </Button>
          )}
          {campaign.status !== 'COMPLETED' && (
            <Button variant="outline" asChild>
              <Link href={`/campaigns/${campaignId}/edit`}>
                <Pencil className="mr-1 h-4 w-4" />
                수정
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">성과 분석</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">오늘</SelectItem>
            <SelectItem value="yesterday">어제</SelectItem>
            <SelectItem value="7d">최근 7일</SelectItem>
            <SelectItem value="30d">최근 30일</SelectItem>
            <SelectItem value="90d">최근 90일</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="광고비"
          value={summary?.spend || 0}
          format="currency"
          change={comparison?.spend || 0}
          changeType={getChangeType(comparison?.spend || 0, false)}
          isLoading={kpiLoading}
          icon="dollar"
        />
        <KPICard
          title="매출"
          value={summary?.revenue || 0}
          format="currency"
          change={comparison?.revenue || 0}
          changeType={getChangeType(comparison?.revenue || 0)}
          isLoading={kpiLoading}
          icon="dollar"
        />
        <KPICard
          title="ROAS"
          value={Number((summary?.roas || 0).toFixed(2))}
          format="multiplier"
          change={Number((comparison?.roas || 0).toFixed(2))}
          changeType={getChangeType(comparison?.roas || 0)}
          isLoading={kpiLoading}
          icon="chart"
        />
        <KPICard
          title="전환수"
          value={summary?.conversions || 0}
          format="number"
          change={comparison?.conversions || 0}
          changeType={getChangeType(comparison?.conversions || 0)}
          isLoading={kpiLoading}
          icon="target"
        />
      </div>

      {/* Secondary KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="노출수"
          value={summary?.impressions || 0}
          format="number"
          change={comparison?.impressions || 0}
          changeType={getChangeType(comparison?.impressions || 0)}
          isLoading={kpiLoading}
          icon="eye"
        />
        <KPICard
          title="클릭수"
          value={summary?.clicks || 0}
          format="number"
          change={comparison?.clicks || 0}
          changeType={getChangeType(comparison?.clicks || 0)}
          isLoading={kpiLoading}
          icon="click"
        />
        <KPICard
          title="CTR"
          value={Number((summary?.ctr || 0).toFixed(2))}
          format="percentage"
          change={Number((comparison?.ctr || 0).toFixed(2))}
          changeType={getChangeType(comparison?.ctr || 0)}
          isLoading={kpiLoading}
        />
        <KPICard
          title="전환율"
          value={Number((summary?.cvr || 0).toFixed(2))}
          format="percentage"
          isLoading={kpiLoading}
        />
      </div>

      {/* Cost Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <KPICard
          title="CPA (전환당 비용)"
          value={summary?.cpa || 0}
          format="currency"
          isLoading={kpiLoading}
        />
        <KPICard
          title="CPC (클릭당 비용)"
          value={summary?.cpc || 0}
          format="currency"
          isLoading={kpiLoading}
        />
        <KPICard
          title="CPM (1000노출당 비용)"
          value={summary?.cpm || 0}
          format="currency"
          isLoading={kpiLoading}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="spend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="spend">광고비 / 매출</TabsTrigger>
          <TabsTrigger value="performance">클릭 / 전환</TabsTrigger>
          <TabsTrigger value="efficiency">ROAS / CTR</TabsTrigger>
        </TabsList>

        <TabsContent value="spend">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">일별 광고비</CardTitle>
              </CardHeader>
              <CardContent>
                <KPIChart
                  data={chartData.map((d) => ({ date: d.date, value: d.spend }))}
                  color="blue"
                  isLoading={kpiLoading}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">일별 매출</CardTitle>
              </CardHeader>
              <CardContent>
                <KPIChart
                  data={chartData.map((d) => ({ date: d.date, value: d.revenue }))}
                  color="green"
                  isLoading={kpiLoading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">일별 클릭수</CardTitle>
              </CardHeader>
              <CardContent>
                <KPIChart
                  data={chartData.map((d) => ({ date: d.date, value: d.clicks }))}
                  color="primary"
                  isLoading={kpiLoading}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">일별 전환수</CardTitle>
              </CardHeader>
              <CardContent>
                <KPIChart
                  data={chartData.map((d) => ({ date: d.date, value: d.conversions }))}
                  color="purple"
                  isLoading={kpiLoading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">일별 ROAS</CardTitle>
              </CardHeader>
              <CardContent>
                <KPIChart
                  data={chartData.map((d) => ({ date: d.date, value: Number(d.roas.toFixed(2)) }))}
                  color="green"
                  isLoading={kpiLoading}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">일별 CTR (%)</CardTitle>
              </CardHeader>
              <CardContent>
                <KPIChart
                  data={chartData.map((d) => ({ date: d.date, value: Number(d.ctr.toFixed(2)) }))}
                  color="blue"
                  isLoading={kpiLoading}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Campaign Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">캠페인 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-sm text-muted-foreground">일일 예산</dt>
              <dd className="text-lg font-semibold">
                {campaign.dailyBudget?.toLocaleString() || 0}원
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">목표</dt>
              <dd className="text-lg font-semibold">
                {objectiveLabels[campaign.objective] || campaign.objective}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">시작일</dt>
              <dd className="text-lg font-semibold">
                {new Date(campaign.startDate).toLocaleDateString('ko-KR')}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">종료일</dt>
              <dd className="text-lg font-semibold">
                {campaign.endDate
                  ? new Date(campaign.endDate).toLocaleDateString('ko-KR')
                  : '설정 안 됨'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
