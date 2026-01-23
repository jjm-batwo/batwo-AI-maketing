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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
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
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
  }).format(amount)
}

export default function AdminRefundsPage() {
  const [data, setData] = useState<RefundsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 환불 처리 다이얼로그 상태
  const [approveDialog, setApproveDialog] = useState<RefundRequest | null>(null)
  const [rejectDialog, setRejectDialog] = useState<RefundRequest | null>(null)
  const [refundAmount, setRefundAmount] = useState<string>('')
  const [rejectReason, setRejectReason] = useState<string>('')
  const [processing, setProcessing] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const fetchRefunds = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/refunds')
      if (!res.ok) {
        throw new Error('Failed to fetch refunds')
      }
      const json = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRefunds()
  }, [fetchRefunds])

  const handleOpenApprove = (request: RefundRequest) => {
    setApproveDialog(request)
    setRefundAmount(request.amount.toString())
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const handleApprove = async () => {
    if (!approveDialog) return

    setProcessing(true)
    try {
      const amount = parseInt(refundAmount, 10)
      if (isNaN(amount) || amount <= 0) {
        showNotification('error', '유효한 환불 금액을 입력해주세요.')
        setProcessing(false)
        return
      }
      if (amount > approveDialog.amount) {
        showNotification('error', '환불 금액이 결제 금액을 초과할 수 없습니다.')
        setProcessing(false)
        return
      }

      const res = await fetch(`/api/admin/refunds/${approveDialog.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refundAmount: amount }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to approve refund')
      }

      showNotification('success', '환불이 승인되었습니다.')
      setApproveDialog(null)
      setRefundAmount('')
      fetchRefunds()
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : '환불 승인에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog) return

    setProcessing(true)
    try {
      const res = await fetch(`/api/admin/refunds/${rejectDialog.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to reject refund')
      }

      showNotification('success', '환불 요청이 거절되었습니다.')
      setRejectDialog(null)
      setRejectReason('')
      fetchRefunds()
    } catch (err) {
      showNotification('error', err instanceof Error ? err.message : '환불 거절에 실패했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">환불 관리</h1>
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
        <h1 className="text-2xl font-bold">환불 관리</h1>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchRefunds} className="mt-4">
              다시 시도
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const pendingCount = data?.total || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">환불 관리</h1>
          <p className="text-sm text-muted-foreground">
            환불 요청을 검토하고 승인/거절합니다.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRefunds}>
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </Button>
      </div>

      {/* 알림 메시지 */}
      {notification && (
        <Alert variant={notification.type === 'error' ? 'destructive' : 'default'}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* 대기 중인 환불 요약 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">대기 중인 환불 요청</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingCount}건</div>
          <p className="text-xs text-muted-foreground">
            {pendingCount > 0
              ? '처리가 필요한 환불 요청이 있습니다.'
              : '현재 대기 중인 환불 요청이 없습니다.'}
          </p>
        </CardContent>
      </Card>

      {/* 환불 요청 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">환불 요청 목록</CardTitle>
          <CardDescription>
            환불 요청을 검토하고 승인 또는 거절할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data?.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">대기 중인 환불 요청이 없습니다</p>
              <p className="text-sm text-muted-foreground">
                새로운 환불 요청이 들어오면 여기에 표시됩니다.
              </p>
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
                {data?.data.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <p className="font-mono text-sm">{request.id.slice(0, 8)}...</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">
                        {formatCurrency(request.amount, request.currency)}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-[200px] truncate text-sm">
                        {request.refundReason || '-'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">
                          {format(new Date(request.createdAt), 'yyyy.MM.dd', { locale: ko })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {request.paidAt
                          ? format(new Date(request.paidAt), 'yyyy.MM.dd', { locale: ko })
                          : '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleOpenApprove(request)}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setRejectDialog(request)}
                        >
                          <X className="mr-1 h-4 w-4" />
                          거절
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 환불 승인 다이얼로그 */}
      <Dialog open={!!approveDialog} onOpenChange={() => setApproveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>환불 승인</DialogTitle>
            <DialogDescription>
              환불 금액을 확인하고 승인해주세요. 부분 환불도 가능합니다.
            </DialogDescription>
          </DialogHeader>
          {approveDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">결제 금액</div>
                  <div className="font-medium">
                    {formatCurrency(approveDialog.amount, approveDialog.currency)}
                  </div>
                  <div className="text-muted-foreground">환불 사유</div>
                  <div>{approveDialog.refundReason || '-'}</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">환불 금액</label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder="환불 금액 입력"
                  max={approveDialog.amount}
                />
                <p className="text-xs text-muted-foreground">
                  최대 {formatCurrency(approveDialog.amount, approveDialog.currency)}까지 환불 가능
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(null)} disabled={processing}>
              취소
            </Button>
            <Button onClick={handleApprove} disabled={processing}>
              {processing ? '처리 중...' : '환불 승인'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 환불 거절 확인 다이얼로그 */}
      <AlertDialog open={!!rejectDialog} onOpenChange={() => setRejectDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>환불 거절</AlertDialogTitle>
            <AlertDialogDescription>
              환불 요청을 거절하시겠습니까? 거절 사유를 입력해주세요.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {rejectDialog && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">결제 금액</div>
                  <div className="font-medium">
                    {formatCurrency(rejectDialog.amount, rejectDialog.currency)}
                  </div>
                  <div className="text-muted-foreground">환불 사유</div>
                  <div>{rejectDialog.refundReason || '-'}</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">거절 사유 (선택)</label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="거절 사유를 입력해주세요..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={processing}>
              {processing ? '처리 중...' : '환불 거절'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
