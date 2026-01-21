'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

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

const statusOptions = [
  { value: 'all', label: '전체 상태' },
  { value: 'PENDING', label: '결제 대기' },
  { value: 'PAID', label: '결제 완료' },
  { value: 'FAILED', label: '결제 실패' },
  { value: 'REFUND_REQUESTED', label: '환불 요청' },
  { value: 'REFUNDED', label: '환불 완료' },
  { value: 'PARTIALLY_REFUNDED', label: '부분 환불' },
]

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PAID':
      return 'default'
    case 'PENDING':
      return 'secondary'
    case 'FAILED':
      return 'destructive'
    case 'REFUND_REQUESTED':
      return 'outline'
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return 'outline'
    default:
      return 'secondary'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING':
      return '결제 대기'
    case 'PAID':
      return '결제 완료'
    case 'FAILED':
      return '결제 실패'
    case 'REFUND_REQUESTED':
      return '환불 요청'
    case 'REFUNDED':
      return '환불 완료'
    case 'PARTIALLY_REFUNDED':
      return '부분 환불'
    default:
      return status
  }
}

function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
  }).format(amount)
}

function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [data, setData] = useState<PaymentsResponse | null>(null)
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 필터 상태
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [createdAtFrom, setCreatedAtFrom] = useState(searchParams.get('createdAtFrom') || '')
  const [createdAtTo, setCreatedAtTo] = useState(searchParams.get('createdAtTo') || '')
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10))
  const [limit] = useState(10)

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/admin/payments/stats')
      if (!res.ok) {
        throw new Error('Failed to fetch stats')
      }
      const json = await res.json()
      setStats(json)
    } catch (err) {
      console.error('Stats fetch error:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [])

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', limit.toString())
      if (status !== 'all') params.set('status', status)
      if (createdAtFrom) params.set('createdAtFrom', createdAtFrom)
      if (createdAtTo) params.set('createdAtTo', createdAtTo)

      const res = await fetch(`/api/admin/payments?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch payments')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [page, limit, status, createdAtFrom, createdAtTo])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchPayments()
  }, [fetchPayments])

  // URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (status !== 'all') params.set('status', status)
    if (createdAtFrom) params.set('createdAtFrom', createdAtFrom)
    if (createdAtTo) params.set('createdAtTo', createdAtTo)

    const newUrl = params.toString() ? `?${params.toString()}` : ''
    router.replace(`/admin/payments${newUrl}`, { scroll: false })
  }, [page, status, createdAtFrom, createdAtTo, router])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchPayments()
  }

  const handleViewPayment = (paymentId: string) => {
    router.push(`/admin/payments/${paymentId}`)
  }

  // 매출 성장률
  const growthRate = stats ? calculateGrowthRate(stats.revenueThisMonth, stats.revenueLastMonth) : 0

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">결제 관리</h1>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">결제 관리</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchPayments} className="mt-4">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">결제 관리</h1>
        <Button variant="outline" size="sm" onClick={() => { fetchStats(); fetchPayments() }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">총 매출</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  전체 기간 누적
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">이번 달 매출</CardTitle>
            {growthRate >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.revenueThisMonth || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  전월 대비{' '}
                  <span className={growthRate >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {growthRate >= 0 ? '+' : ''}{growthRate}%
                  </span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">대기/실패</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {(stats?.pendingPayments || 0) + (stats?.failedPayments || 0)}건
                </div>
                <p className="text-xs text-muted-foreground">
                  대기 {stats?.pendingPayments || 0} / 실패 {stats?.failedPayments || 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">환불 금액</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatCurrency(stats?.refundedAmount || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  이번 달 {formatCurrency(stats?.refundedThisMonth || 0)}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">검색 및 필터</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="상태" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={createdAtFrom}
                onChange={(e) => setCreatedAtFrom(e.target.value)}
                className="w-[150px]"
              />
              <span className="text-muted-foreground">~</span>
              <Input
                type="date"
                value={createdAtTo}
                onChange={(e) => setCreatedAtTo(e.target.value)}
                className="w-[150px]"
              />
            </div>
            <Button type="submit">검색</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStatus('all')
                setCreatedAtFrom('')
                setCreatedAtTo('')
                setPage(1)
              }}
            >
              초기화
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 결제 테이블 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">결제 내역</CardTitle>
            <p className="text-sm text-muted-foreground">
              총 {data?.total.toLocaleString() || 0}건
            </p>
          </div>
        </CardHeader>
        <CardContent>
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
              {data?.data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                data?.data.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <p className="font-mono text-sm">{invoice.id.slice(0, 8)}...</p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {formatCurrency(invoice.amount, invoice.currency)}
                        </p>
                        {invoice.refundAmount && invoice.refundAmount > 0 && (
                          <p className="text-sm text-destructive">
                            환불: {formatCurrency(invoice.refundAmount, invoice.currency)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(invoice.status)}>
                        {getStatusLabel(invoice.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{invoice.paymentMethod || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {format(new Date(invoice.createdAt), 'yyyy.MM.dd', { locale: ko })}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {invoice.paidAt
                          ? format(new Date(invoice.paidAt), 'yyyy.MM.dd HH:mm', { locale: ko })
                          : '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewPayment(invoice.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            상세 보기
                          </DropdownMenuItem>
                          {invoice.receiptUrl && (
                            <DropdownMenuItem asChild>
                              <a href={invoice.receiptUrl} target="_blank" rel="noopener noreferrer">
                                <CreditCard className="mr-2 h-4 w-4" />
                                영수증 보기
                              </a>
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

          {/* 페이지네이션 */}
          {data && data.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {data.total}건 중 {(page - 1) * limit + 1}-
                {Math.min(page * limit, data.total)}건 표시
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {page} / {data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
