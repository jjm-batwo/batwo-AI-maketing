'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { CreditCard, Loader2, AlertCircle } from 'lucide-react'
import { SubscriptionPlan, getPlanLabel } from '@/domain/value-objects/SubscriptionPlan'

interface BillingKeyData {
  id: string
  cardCompany: string
  cardNumber: string
  method: string
  isActive: boolean
  authenticatedAt: string
}

interface PaymentHistory {
  id: string
  amount: number
  status: string
  createdAt: string
  description?: string
}

interface PlanInfo {
  plan: SubscriptionPlan
  trial: {
    isActive: boolean
    daysRemaining: number
    startDate: string
    endDate: string
  } | null
}

export default function BillingPage() {
  const [loading, setLoading] = useState(true)
  const [billingKey, setBillingKey] = useState<BillingKeyData | null>(null)
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [deleteCardLoading, setDeleteCardLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch billing key, payment history, and plan info in parallel
      const [billingKeyRes, historyRes, quotaRes] = await Promise.all([
        fetch('/api/payments/billing-key'),
        fetch('/api/payments/history?limit=10'),
        fetch('/api/quota'),
      ])

      if (!billingKeyRes.ok || !historyRes.ok || !quotaRes.ok) {
        throw new Error('결제 정보를 불러오는데 실패했습니다')
      }

      const billingKeyData = await billingKeyRes.json()
      const historyData = await historyRes.json()
      const quotaData = await quotaRes.json()

      setBillingKey(billingKeyData.billingKey)
      setPaymentHistory(historyData)
      setPlanInfo({
        plan: quotaData.plan,
        trial: quotaData.trial,
      })
    } catch (err) {
      console.error('Failed to fetch billing data:', err)
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    try {
      setCancelLoading(true)
      const res = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: '사용자 요청' }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '구독 취소에 실패했습니다')
      }

      alert('구독이 취소되었습니다')
      fetchBillingData()
    } catch (err) {
      console.error('Cancel subscription error:', err)
      alert(err instanceof Error ? err.message : '구독 취소 중 오류가 발생했습니다')
    } finally {
      setCancelLoading(false)
    }
  }

  const handleDeleteCard = async () => {
    try {
      setDeleteCardLoading(true)
      const res = await fetch('/api/payments/billing-key', {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || '결제 수단 삭제에 실패했습니다')
      }

      alert('결제 수단이 삭제되었습니다')
      fetchBillingData()
    } catch (err) {
      console.error('Delete card error:', err)
      alert(err instanceof Error ? err.message : '결제 수단 삭제 중 오류가 발생했습니다')
    } finally {
      setDeleteCardLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const formatAmount = (amount: number) => {
    return `₩${amount.toLocaleString('ko-KR')}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE':
      case 'SUCCESS':
        return <Badge variant="default">완료</Badge>
      case 'PENDING':
        return <Badge variant="secondary">대기중</Badge>
      case 'FAILED':
      case 'CANCELED':
        return <Badge variant="destructive">실패</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg text-muted-foreground">{error}</p>
          <Button onClick={fetchBillingData}>다시 시도</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">결제 관리</h1>
        <p className="text-muted-foreground">구독 플랜, 결제 수단, 결제 내역을 관리하세요</p>
      </div>

      <div className="space-y-6">
        {/* 현재 구독 */}
        <Card>
          <CardHeader>
            <CardTitle>현재 구독</CardTitle>
            <CardDescription>활성화된 구독 플랜 정보</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {planInfo && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{getPlanLabel(planInfo.plan)} 플랜</p>
                    {planInfo.trial?.isActive && (
                      <p className="text-sm text-muted-foreground">
                        무료 체험 {planInfo.trial.daysRemaining}일 남음
                      </p>
                    )}
                  </div>
                  <Badge variant={planInfo.plan === SubscriptionPlan.FREE ? 'secondary' : 'default'}>
                    {planInfo.trial?.isActive ? '체험중' : '활성'}
                  </Badge>
                </div>

                {planInfo.trial?.isActive && (
                  <div className="text-sm text-muted-foreground">
                    <p>체험 기간: {formatDate(planInfo.trial.startDate)} ~ {formatDate(planInfo.trial.endDate)}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button asChild variant="default">
                    <Link href="/pricing">플랜 변경</Link>
                  </Button>
                  {planInfo.plan !== SubscriptionPlan.FREE && !planInfo.trial?.isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={cancelLoading}>
                          {cancelLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          구독 취소
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>구독을 취소하시겠습니까?</AlertDialogTitle>
                          <AlertDialogDescription>
                            구독을 취소하면 다음 결제일부터 요금이 청구되지 않습니다.
                            현재 결제 기간이 끝날 때까지는 서비스를 계속 이용하실 수 있습니다.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>취소</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelSubscription}>
                            구독 취소
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 결제 수단 */}
        <Card>
          <CardHeader>
            <CardTitle>결제 수단</CardTitle>
            <CardDescription>등록된 결제 수단 정보</CardDescription>
          </CardHeader>
          <CardContent>
            {billingKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-6 w-6 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{billingKey.cardCompany}</p>
                    <p className="text-sm text-muted-foreground">{billingKey.cardNumber}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      등록일: {formatDate(billingKey.authenticatedAt)}
                    </p>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={deleteCardLoading}>
                      {deleteCardLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      결제 수단 삭제
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>결제 수단을 삭제하시겠습니까?</AlertDialogTitle>
                      <AlertDialogDescription>
                        결제 수단을 삭제하면 자동 결제가 중단됩니다.
                        구독을 계속 이용하려면 새로운 결제 수단을 등록해야 합니다.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>취소</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteCard}>
                        삭제
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">등록된 결제 수단이 없습니다</p>
                <Button asChild>
                  <Link href="/pricing">결제 수단 등록</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 결제 내역 */}
        <Card>
          <CardHeader>
            <CardTitle>결제 내역</CardTitle>
            <CardDescription>최근 10건의 결제 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {paymentHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>날짜</TableHead>
                    <TableHead>내용</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                    <TableHead className="text-right">상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentHistory.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell>{payment.description || '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatAmount(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getStatusBadge(payment.status)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                결제 내역이 없습니다
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
