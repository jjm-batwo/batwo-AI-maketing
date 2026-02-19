import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { PaymentsFilterBar } from './PaymentsFilterBar'

export const metadata: Metadata = {
  title: '결제 관리 | 바투',
  description: '결제 내역을 확인하고 관리하세요',
}
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, ChevronLeft, ChevronRight, Eye, CreditCard, TrendingUp, TrendingDown, AlertCircle, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Link from 'next/link'

interface Invoice {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  status: string
  paymentMethod?: string
  paidAt?: string
  refundedAt?: string
  refundAmount?: number
  refundReason?: string
  receiptUrl?: string
  createdAt: string
  updatedAt: string
}

interface PaymentsResponse {
  data: Invoice[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface PaymentStats {
  totalRevenue: number
  revenueThisMonth: number
  revenueLastMonth: number
  pendingPayments: number
  failedPayments: number
  refundedAmount: number
  refundedThisMonth: number
}

interface PageProps {
  searchParams: Promise<{
    status?: string
    createdAtFrom?: string
    createdAtTo?: string
    page?: string
  }>
}

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID': return 'default'
    case 'PENDING': return 'secondary'
    case 'FAILED': return 'destructive'
    case 'REFUND_REQUESTED': return 'outline'
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED': return 'outline'
    default: return 'secondary'
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '결제 대기',
    PAID: '결제 완료',
    FAILED: '결제 실패',
    REFUND_REQUESTED: '환불 요청',
    REFUNDED: '환불 완료',
    PARTIALLY_REFUNDED: '부분 환불',
  }
  return labels[status] || status
}

function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency }).format(amount)
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

async function fetchData(baseUrl: string, cookieHeader: string) {
  const [paymentsRes, statsRes] = await Promise.all([
    fetch(`${baseUrl}/api/admin/payments`, { headers: { Cookie: cookieHeader }, cache: 'no-store' }),
    fetch(`${baseUrl}/api/admin/payments/stats`, { headers: { Cookie: cookieHeader }, cache: 'no-store' }),
  ])
  
  return {
    payments: paymentsRes.ok ? await paymentsRes.json() : null,
    stats: statsRes.ok ? await statsRes.json() : null,
  }
}

export default async function AdminPaymentsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const cookieStore = await cookies()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  
  const page = parseInt(params.page || '1', 10)
  const limit = 10
  const queryParams = new URLSearchParams()
  queryParams.set('page', page.toString())
  queryParams.set('limit', limit.toString())
  if (params.status && params.status !== 'all') queryParams.set('status', params.status)
  if (params.createdAtFrom) queryParams.set('createdAtFrom', params.createdAtFrom)
  if (params.createdAtTo) queryParams.set('createdAtTo', params.createdAtTo)

  const { payments, stats } = await fetchData(baseUrl, cookieStore.toString())
  const growthRate = stats ? calculateGrowthRate(stats.revenueThisMonth, stats.revenueLastMonth) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">결제 관리</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">전체 기간 누적</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 매출</CardTitle>
            {growthRate >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.revenueThisMonth || 0)}</div>
            <p className="text-xs text-muted-foreground">
              전월 대비 <span className={growthRate >= 0 ? 'text-green-500' : 'text-red-500'}>{growthRate >= 0 ? '+' : ''}{growthRate}%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기/실패</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats?.pendingPayments || 0) + (stats?.failedPayments || 0)}건</div>
            <p className="text-xs text-muted-foreground">대기 {stats?.pendingPayments || 0} / 실패 {stats?.failedPayments || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">환불 금액</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.refundedAmount || 0)}</div>
            <p className="text-xs text-muted-foreground">이번 달 {formatCurrency(stats?.refundedThisMonth || 0)}</p>
          </CardContent>
        </Card>
      </div>

      <PaymentsFilterBar />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">결제 내역</CardTitle>
            <p className="text-sm text-muted-foreground">총 {payments?.total.toLocaleString() || 0}건</p>
          </div>
        </CardHeader>
        <CardContent>
          {!payments ? (
            <p className="text-destructive">데이터를 불러올 수 없습니다.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>결제 ID</TableHead>
                    <TableHead>금액</TableHead>
                    <TableHead>상태</TableHead>
                    <TableHead>결제 수단</TableHead>
                    <TableHead>생성일</TableHead>
                    <TableHead>결제일</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">검색 결과가 없습니다.</TableCell>
                    </TableRow>
                  ) : (
                    payments.data.map((invoice: Invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell><p className="font-mono text-sm">{invoice.id.slice(0, 8)}...</p></TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatCurrency(invoice.amount, invoice.currency)}</p>
                            {invoice.refundAmount && invoice.refundAmount > 0 && (
                              <p className="text-sm text-destructive">환불: {formatCurrency(invoice.refundAmount, invoice.currency)}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant={getStatusBadgeVariant(invoice.status)}>{getStatusLabel(invoice.status)}</Badge></TableCell>
                        <TableCell><p className="text-sm">{invoice.paymentMethod || '-'}</p></TableCell>
                        <TableCell><p className="text-sm">{format(new Date(invoice.createdAt), 'yyyy.MM.dd', { locale: ko })}</p></TableCell>
                        <TableCell><p className="text-sm">{invoice.paidAt ? format(new Date(invoice.paidAt), 'yyyy.MM.dd HH:mm', { locale: ko }) : '-'}</p></TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/payments/${invoice.id}`}><Eye className="mr-2 h-4 w-4" />상세 보기</Link>
                              </DropdownMenuItem>
                              {invoice.receiptUrl && (
                                <DropdownMenuItem asChild>
                                  <a href={invoice.receiptUrl} target="_blank" rel="noopener noreferrer"><CreditCard className="mr-2 h-4 w-4" />영수증 보기</a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {payments.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{payments.total}건 중 {(page - 1) * limit + 1}-{Math.min(page * limit, payments.total)}건 표시</p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" disabled={page <= 1} asChild={page > 1}>
                      {page > 1 ? <Link href={`/admin/payments?${new URLSearchParams({ ...params, page: (page - 1).toString() }).toString()}`}><ChevronLeft className="h-4 w-4" /></Link> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                    <span className="text-sm">{page} / {payments.totalPages}</span>
                    <Button variant="outline" size="icon" disabled={page >= payments.totalPages} asChild={page < payments.totalPages}>
                      {page < payments.totalPages ? <Link href={`/admin/payments?${new URLSearchParams({ ...params, page: (page + 1).toString() }).toString()}`}><ChevronRight className="h-4 w-4" /></Link> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
