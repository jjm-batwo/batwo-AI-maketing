import type { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AdminStatsCard } from '@/presentation/components/admin/common'
import {
  Users,
  CreditCard,
  Megaphone,
  RefreshCcw,
  TrendingUp,
  UserPlus,
  Activity,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: '관리자 대시보드 | 바투',
  description: '서비스 전체 현황을 확인하세요',
}

interface DashboardData {
  users: {
    total: number
    new: number
    active: number
  }
  subscriptions: {
    total: number
    activeCount: number
    byPlan: Record<string, number>
    byStatus: Record<string, number>
    churnedThisMonth: number
  }
  payments: {
    totalRevenue: number
    revenueThisMonth: number
    revenueLastMonth: number
    pendingPayments: number
    failedPayments: number
    refundedAmount: number
    refundedThisMonth: number
  }
  campaigns: {
    total: number
    active: number
    paused: number
    completed: number
  }
  recent: {
    users: Array<{
      id: string
      name: string | null
      email: string
      createdAt: string
      subscription: { plan: string; status: string } | null
    }>
    payments: Array<{
      id: string
      amount: number
      currency: string
      status: string
      paidAt: string
    }>
  }
  pendingRefunds: {
    count: number
    items: Array<{
      id: string
      amount: number
      currency: string
      refundReason: string | null
      createdAt: string
    }>
  }
}

function formatCurrency(amount: number, currency: string = 'KRW') {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
  }).format(amount)
}

async function getDashboardData(): Promise<DashboardData | null> {
  try {
    const cookieStore = await cookies()
    const res = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/admin/dashboard`, {
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 300, tags: ['admin-dashboard'] },
    })

    if (!res.ok) {
      throw new Error('Failed to fetch dashboard data')
    }

    return await res.json()
  } catch (error) {
    console.error('Dashboard fetch error:', error)
    return null
  }
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData()

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">
              데이터를 불러오는데 실패했습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">관리자 대시보드</h1>

      {/* 주요 통계 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <AdminStatsCard
          title="총 회원 수"
          value={data.users.total.toLocaleString()}
          description={`신규 ${data.users.new}명 (7일)`}
          icon={Users}
          trend={
            data.users.new > 0
              ? {
                  value: Math.round((data.users.new / data.users.total) * 100),
                  isPositive: true,
                }
              : undefined
          }
        />
        <AdminStatsCard
          title="활성 구독"
          value={data.subscriptions.activeCount.toLocaleString()}
          description={`전체 ${data.subscriptions.total}명`}
          icon={CreditCard}
        />
        <AdminStatsCard
          title="이번 달 매출"
          value={formatCurrency(data.payments.revenueThisMonth)}
          description={`누적 ${formatCurrency(data.payments.totalRevenue)}`}
          icon={TrendingUp}
        />
        <AdminStatsCard
          title="활성 캠페인"
          value={data.campaigns.active.toLocaleString()}
          description={`전체 ${data.campaigns.total}개`}
          icon={Megaphone}
        />
      </div>

      {/* 상세 정보 그리드 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* 최근 가입 회원 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4" />
              최근 가입 회원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recent.users.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  최근 가입한 회원이 없습니다.
                </p>
              ) : (
                data.recent.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {user.name || '이름 없음'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      {user.subscription ? (
                        <Badge variant="secondary" className="text-xs">
                          {user.subscription.plan}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          FREE
                        </Badge>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 최근 결제 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="h-4 w-4" />
              최근 결제
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recent.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  최근 결제 내역이 없습니다.
                </p>
              ) : (
                data.recent.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(payment.amount, payment.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {payment.id.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          payment.status === 'PAID' ? 'default' : 'secondary'
                        }
                        className="text-xs"
                      >
                        {payment.status}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(payment.paidAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 환불 대기 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCcw className="h-4 w-4" />
              환불 대기
              {data.pendingRefunds.count > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {data.pendingRefunds.count}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.pendingRefunds.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  대기 중인 환불 요청이 없습니다.
                </p>
              ) : (
                data.pendingRefunds.items.map((refund) => (
                  <div
                    key={refund.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {formatCurrency(refund.amount, refund.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {refund.refundReason || '사유 없음'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(refund.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* 구독 현황 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              구독 현황
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(data.subscriptions.byPlan).map(([plan, count]) => (
                <div key={plan} className="flex items-center justify-between">
                  <span className="text-sm">{plan}</span>
                  <Badge variant="outline">{count}명</Badge>
                </div>
              ))}
              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">이번 달 이탈</span>
                  <span className="font-medium text-destructive">
                    {data.subscriptions.churnedThisMonth}명
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
