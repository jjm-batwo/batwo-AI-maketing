'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  RefreshCw,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  BarChart3,
} from 'lucide-react'

interface AnalyticsData {
  period: string
  users: {
    total: number
    new: number
    growth: number
  }
  subscriptions: {
    active: number
    planDistribution: { plan: string; count: number }[]
  }
  revenue: {
    current: number
    previous: number
    growth: number
  }
  refunds: {
    amount: number
    count: number
  }
  campaigns: {
    total: number
    active: number
  }
  charts: {
    signups: { date: string; label: string; count: number }[]
    revenue: { date: string; label: string; amount: number }[]
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

function GrowthIndicator({ value }: { value: number }) {
  if (value > 0) {
    return (
      <span className="flex items-center text-sm text-green-600">
        <ArrowUpRight className="h-4 w-4" />
        {value}%
      </span>
    )
  }
  if (value < 0) {
    return (
      <span className="flex items-center text-sm text-red-600">
        <ArrowDownRight className="h-4 w-4" />
        {Math.abs(value)}%
      </span>
    )
  }
  return (
    <span className="flex items-center text-sm text-muted-foreground">
      <Minus className="h-4 w-4" />
      0%
    </span>
  )
}

function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    FREE: '무료',
    STARTER: '스타터',
    PRO: '프로',
    ENTERPRISE: '엔터프라이즈',
  }
  return labels[plan] || plan
}

// 간단한 바 차트 컴포넌트
function SimpleBarChart({
  data,
  valueKey,
  maxHeight = 100,
}: {
  data: { label: string; [key: string]: string | number }[]
  valueKey: string
  maxHeight?: number
}) {
  const maxValue = Math.max(...data.map((d) => Number(d[valueKey]) || 0))

  return (
    <div className="flex items-end gap-1 h-full">
      {data.map((item, index) => {
        const value = Number(item[valueKey]) || 0
        const height = maxValue > 0 ? (value / maxValue) * maxHeight : 0
        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
              style={{ height: `${height}px` }}
              title={`${item.label}: ${valueKey === 'amount' ? formatCurrency(value) : value}`}
            />
            <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState('month')

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`)
      if (!res.ok) {
        throw new Error('Failed to fetch analytics')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">서비스 분석</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">서비스 분석</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchAnalytics} className="mt-4">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const periodLabel = period === 'week' ? '이번 주' : period === 'quarter' ? '이번 분기' : '이번 달'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">서비스 분석</h1>
          <p className="text-sm text-muted-foreground">
            서비스 전체 성과 및 핵심 지표를 확인합니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">이번 주</SelectItem>
              <SelectItem value="month">이번 달</SelectItem>
              <SelectItem value="quarter">이번 분기</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="mr-2 h-4 w-4" />
            새로고침
          </Button>
        </div>
      </div>

      {data && (
        <>
          {/* 핵심 지표 카드 */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.users.total.toLocaleString()}명</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {periodLabel} 신규: {data.users.new}명
                  </span>
                  <GrowthIndicator value={data.users.growth} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{periodLabel} 매출</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.revenue.current)}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    전기: {formatCurrency(data.revenue.previous)}
                  </span>
                  <GrowthIndicator value={data.revenue.growth} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">활성 구독</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.subscriptions.active}개</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.subscriptions.planDistribution.map((p) =>
                    `${getPlanLabel(p.plan)}: ${p.count}`
                  ).join(' / ')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">캠페인</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.campaigns.total}개</div>
                <p className="text-xs text-muted-foreground mt-1">
                  활성: {data.campaigns.active}개
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 환불 및 추가 지표 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{periodLabel} 환불</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(data.refunds.amount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {data.refunds.count}건 처리
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">순매출</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(data.revenue.current - data.refunds.amount)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  매출 - 환불
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">환불률</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.revenue.current > 0
                    ? Math.round((data.refunds.amount / data.revenue.current) * 1000) / 10
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  환불 / 매출
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 차트 섹션 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">일별 신규 가입자</CardTitle>
                <CardDescription>최근 14일간 가입자 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[150px]">
                  <SimpleBarChart data={data.charts.signups} valueKey="count" maxHeight={120} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">일별 매출</CardTitle>
                <CardDescription>최근 14일간 매출 추이</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[150px]">
                  <SimpleBarChart data={data.charts.revenue} valueKey="amount" maxHeight={120} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 플랜별 분포 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">구독 플랜 분포</CardTitle>
              <CardDescription>활성 구독자의 플랜별 분포</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.subscriptions.planDistribution.length === 0 ? (
                  <p className="text-sm text-muted-foreground">활성 구독이 없습니다.</p>
                ) : (
                  data.subscriptions.planDistribution.map((item) => {
                    const percentage = data.subscriptions.active > 0
                      ? (item.count / data.subscriptions.active) * 100
                      : 0
                    return (
                      <div key={item.plan} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{getPlanLabel(item.plan)}</span>
                          <span className="text-muted-foreground">
                            {item.count}명 ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
