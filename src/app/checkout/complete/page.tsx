'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Link from 'next/link'

type SubscriptionResult = {
  subscriptionId: string
  plan: string
  billingPeriod: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  amount: number
}

function CheckoutCompleteContent() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [result, setResult] = useState<SubscriptionResult | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function completeSubscription() {
      const authKey = searchParams.get('authKey')
      const customerKey = searchParams.get('customerKey')

      if (!authKey || !customerKey) {
        setError('인증 정보가 누락되었습니다')
        setStatus('error')
        return
      }

      // Retrieve plan info from sessionStorage
      // NOTE: CheckoutForm component must store these values before initiating payment:
      // sessionStorage.setItem('checkoutPlan', plan)
      // sessionStorage.setItem('checkoutPeriod', billingPeriod)
      const plan = sessionStorage.getItem('checkoutPlan')
      const billingPeriod = sessionStorage.getItem('checkoutPeriod')

      if (!plan || !billingPeriod) {
        setError('결제 정보가 만료되었습니다. 다시 시도해주세요.')
        setStatus('error')
        return
      }

      try {
        const res = await fetch('/api/payments/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, billingPeriod, authKey, customerKey }),
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || '구독 처리에 실패했습니다')
        }

        const data = await res.json()
        setResult(data)
        setStatus('success')

        // Clean up sessionStorage
        sessionStorage.removeItem('checkoutPlan')
        sessionStorage.removeItem('checkoutPeriod')
      } catch (err) {
        setError(err instanceof Error ? err.message : '구독 처리 중 오류가 발생했습니다')
        setStatus('error')
      }
    }

    completeSubscription()
  }, [searchParams])

  const formatAmount = (amount: number) => {
    return `₩${amount.toLocaleString('ko-KR')}`
  }

  const getPlanName = (plan: string) => {
    const planNames: Record<string, string> = {
      'starter': '스타터',
      'professional': '프로페셔널',
      'enterprise': '엔터프라이즈'
    }
    return planNames[plan] || plan
  }

  const getPeriodName = (period: string) => {
    return period === 'monthly' ? '월간' : '연간'
  }

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium text-gray-900">구독을 처리하고 있습니다...</p>
          <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
        </CardContent>
      </Card>
    )
  }

  if (status === 'success' && result) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">구독이 완료되었습니다!</CardTitle>
          <CardDescription className="text-base mt-2">
            바투 AI 마케팅 솔루션을 시작하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">플랜</span>
              <span className="font-semibold">{getPlanName(result.plan)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">결제 금액</span>
              <span className="font-semibold text-lg">{formatAmount(result.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">결제 주기</span>
              <span className="font-semibold">{getPeriodName(result.billingPeriod)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm text-gray-600">다음 결제일</span>
              <span className="text-sm font-medium">
                {new Date(result.currentPeriodEnd).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>

          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">대시보드로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Error state
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <CardTitle className="text-2xl">결제 처리 실패</CardTitle>
        <CardDescription className="text-base mt-2">
          {error || '구독 처리 중 오류가 발생했습니다'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            문제가 지속되면 고객 지원팀에 문의해주세요.
          </p>
        </div>

        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/#pricing">요금제 보기</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

export default function CheckoutCompletePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      }>
        <CheckoutCompleteContent />
      </Suspense>
    </div>
  )
}
