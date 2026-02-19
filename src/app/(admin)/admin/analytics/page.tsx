import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { AnalyticsPeriodSelector } from './AnalyticsPeriodSelector'

export const metadata: Metadata = {
  title: '서비스 분석 | 바투',
  description: '서비스 전체 성과를 분석하세요',
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, TrendingUp, TrendingDown, Target, ArrowUpRight, ArrowDownRight, Minus, BarChart3 } from 'lucide-react'

interface AnalyticsData {
  period: string
  users: { total: number; new: number; growth: number }
  subscriptions: { active: number; planDistribution: { plan: string; count: number }[] }
  revenue: { current: number; previous: number; growth: number }
  refunds: { amount: number; count: number }
  campaigns: { total: number; active: number }
  charts: {
    signups: { date: string; label: string; count: number }[]
    revenue: { date: string; label: string; amount: number }[]
  }
}

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(amount)
}

function GrowthIndicator({ value }: { value: number }) {
  if (value > 0) return <span className="flex items-center text-sm text-green-600"><ArrowUpRight className="h-4 w-4" />{value}%</span>
  if (value < 0) return <span className="flex items-center text-sm text-red-600"><ArrowDownRight className="h-4 w-4" />{Math.abs(value)}%</span>
  return <span className="flex items-center text-sm text-muted-foreground"><Minus className="h-4 w-4" />0%</span>
}

function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = { FREE: '무료', STARTER: '스타터', PRO: '프로', ENTERPRISE: '엔터프라이즈' }
  return labels[plan] || plan
}

function SimpleBarChart({ data, valueKey, maxHeight = 100 }: { data: { label: string; [key: string]: string | number }[]; valueKey: string; maxHeight?: number }) {
  const maxValue = Math.max(...data.map((d) => Number(d[valueKey]) || 0))
  return (
    <div className="flex items-end gap-1 h-full">
      {data.map((item, index) => {
        const value = Number(item[valueKey]) || 0
        const height = maxValue > 0 ? (value / maxValue) * maxHeight : 0
        return (
          <div key={index} className="flex flex-col items-center flex-1">
            <div className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary" style={{ height: `${height}px` }} title={`${item.label}: ${valueKey === 'amount' ? formatCurrency(value) : value}`} />
            <span className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

async function fetchAnalytics(period: string): Promise<AnalyticsData | null> {
  try {
    const cookieStore = await cookies()
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/analytics?period=${period}`, {
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 300, tags: ['admin-analytics'] },
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Analytics fetch error:', error)
    return null
  }
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const period = params.period || 'month'
  const data = await fetchAnalytics(period)
  
  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">서비스 분석</h1>
        <Card><CardContent className="pt-6"><p className="text-destructive">데이터를 불러오는데 실패했습니다.</p></CardContent></Card>
      </div>
    )
  }

  const periodLabel = period === 'week' ? '이번 주' : period === 'quarter' ? '이번 분기' : '이번 달'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">서비스 분석</h1>
          <p className="text-sm text-muted-foreground">서비스 전체 성과 및 핵심 지표를 확인합니다.</p>
        </div>
        <div className="flex items-center gap-2">
          <AnalyticsPeriodSelector />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users.total.toLocaleString()}명</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{periodLabel} 신규: {data.users.new}명</span>
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
              <span className="text-xs text-muted-foreground">전기: {formatCurrency(data.revenue.previous)}</span>
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
            <p className="text-xs text-muted-foreground mt-1">{data.subscriptions.planDistribution.map((p) => `${getPlanLabel(p.plan)}: ${p.count}`).join(' / ')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">캠페인</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.campaigns.total}개</div>
            <p className="text-xs text-muted-foreground mt-1">활성: {data.campaigns.active}개</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{periodLabel} 환불</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(data.refunds.amount)}</div>
            <p className="text-xs text-muted-foreground mt-1">{data.refunds.count}건 처리</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">순매출</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.revenue.current - data.refunds.amount)}</div>
            <p className="text-xs text-muted-foreground mt-1">매출 - 환불</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">환불률</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.revenue.current > 0 ? Math.round((data.refunds.amount / data.revenue.current) * 1000) / 10 : 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">환불 / 매출</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">일별 신규 가입자</CardTitle>
            <CardDescription>최근 14일간 가입자 추이</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]"><SimpleBarChart data={data.charts.signups} valueKey="count" maxHeight={120} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">일별 매출</CardTitle>
            <CardDescription>최근 14일간 매출 추이</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[150px]"><SimpleBarChart data={data.charts.revenue} valueKey="amount" maxHeight={120} /></div>
          </CardContent>
        </Card>
      </div>

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
                const percentage = data.subscriptions.active > 0 ? (item.count / data.subscriptions.active) * 100 : 0
                return (
                  <div key={item.plan} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{getPlanLabel(item.plan)}</span>
                      <span className="text-muted-foreground">{item.count}명 ({Math.round(percentage)}%)</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
