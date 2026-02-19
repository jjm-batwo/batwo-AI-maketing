import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { RefundActions } from './RefundActions'

export const metadata: Metadata = {
  title: '환불 관리 | 바투',
  description: '환불 요청을 처리하세요',
}
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock, AlertCircle } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'

interface RefundRequest {
  id: string
  subscriptionId: string
  amount: number
  currency: string
  status: string
  refundAmount?: number
  refundReason?: string
  createdAt: string
  paidAt?: string
}

interface RefundsResponse {
  data: RefundRequest[]
  total: number
}

function formatCurrency(amount: number, currency: string = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', { style: 'currency', currency }).format(amount)
}

async function fetchRefunds(): Promise<RefundsResponse | null> {
  try {
    const cookieStore = await cookies()
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/admin/refunds`, {
      headers: { Cookie: cookieStore.toString() },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Refunds fetch error:', error)
    return null
  }
}

export default async function AdminRefundsPage() {
  const data = await fetchRefunds()

  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">환불 관리</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">데이터를 불러오는데 실패했습니다.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">환불 관리</h1>
          <p className="text-sm text-muted-foreground">환불 요청을 검토하고 승인/거절합니다.</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">대기 중인 환불 요청</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.total}건</div>
          <p className="text-xs text-muted-foreground">
            {data.total > 0 ? '처리가 필요한 환불 요청이 있습니다.' : '현재 대기 중인 환불 요청이 없습니다.'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">환불 요청 목록</CardTitle>
          <CardDescription>환불 요청을 검토하고 승인 또는 거절할 수 있습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">대기 중인 환불 요청이 없습니다</p>
              <p className="text-sm text-muted-foreground">새로운 환불 요청이 들어오면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>결제 ID</TableHead>
                  <TableHead>결제 금액</TableHead>
                  <TableHead>환불 사유</TableHead>
                  <TableHead>요청일</TableHead>
                  <TableHead>결제일</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell><p className="font-mono text-sm">{request.id.slice(0, 8)}...</p></TableCell>
                    <TableCell><p className="font-medium">{formatCurrency(request.amount, request.currency)}</p></TableCell>
                    <TableCell><p className="max-w-[200px] truncate text-sm">{request.refundReason || '-'}</p></TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{format(new Date(request.createdAt), 'yyyy.MM.dd', { locale: ko })}</p>
                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(request.createdAt), { addSuffix: true, locale: ko })}</p>
                      </div>
                    </TableCell>
                    <TableCell><p className="text-sm">{request.paidAt ? format(new Date(request.paidAt), 'yyyy.MM.dd', { locale: ko }) : '-'}</p></TableCell>
                    <TableCell className="text-right">
                      <RefundActions request={request} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
