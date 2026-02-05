'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SubscriptionPlan } from '@domain/value-objects/SubscriptionPlan'
import { BillingPeriod } from '@domain/value-objects/BillingPeriod'

interface CheckoutFormProps {
  plan: SubscriptionPlan
  planLabel: string
  price: number // monthly price in KRW
  annualPrice: number // annual per-month price in KRW
  initialPeriod: BillingPeriod
}

interface CheckoutInfo {
  customerKey: string
  orderId: string
  orderName: string
  amount: number
}

export function CheckoutForm({
  plan,
  planLabel,
  price,
  annualPrice,
  initialPeriod,
}: CheckoutFormProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(initialPeriod)
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutInfo, setCheckoutInfo] = useState<CheckoutInfo | null>(null)
  const [billingWidget, setBillingWidget] = useState<any>(null)

  // Calculate amounts
  const monthlyAmount = price
  const annualTotalAmount = annualPrice * 12
  const annualMonthlyAmount = annualPrice
  const isAnnual = billingPeriod === BillingPeriod.ANNUAL
  const displayAmount = isAnnual ? annualTotalAmount : monthlyAmount
  const savingsPercent = Math.round(((price - annualPrice) / price) * 100)

  // Fetch checkout info from API
  useEffect(() => {
    async function fetchCheckoutInfo() {
      setIsInitializing(true)
      setError(null)
      try {
        const response = await fetch('/api/payments/billing/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, billingPeriod }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || '결제 정보를 가져오는데 실패했습니다')
        }

        const data = await response.json()
        setCheckoutInfo(data)
      } catch (err) {
        console.error('Failed to fetch checkout info:', err)
        setError(err instanceof Error ? err.message : '결제 정보를 가져오는데 실패했습니다')
      } finally {
        setIsInitializing(false)
      }
    }

    fetchCheckoutInfo()
  }, [plan, billingPeriod])

  // Initialize Toss Payments SDK
  useEffect(() => {
    async function initToss() {
      if (!checkoutInfo) return

      try {
        const { loadTossPayments } = await import('@tosspayments/tosspayments-sdk')
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY

        if (!clientKey) {
          throw new Error('결제 클라이언트 키가 설정되지 않았습니다')
        }

        const tossPayments = await loadTossPayments(clientKey)
        const payment = tossPayments.payment({ customerKey: checkoutInfo.customerKey })
        setBillingWidget(payment)
      } catch (err) {
        console.error('Failed to load Toss SDK:', err)
        setError('결제 모듈 로드에 실패했습니다')
      }
    }

    initToss()
  }, [checkoutInfo])

  async function handlePayment() {
    if (!billingWidget || !checkoutInfo) {
      setError('결제 정보가 준비되지 않았습니다')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await billingWidget.requestBillingAuth({
        method: 'CARD',
        successUrl: `${window.location.origin}/api/payments/billing/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
        customerEmail: undefined, // optional
        customerName: undefined, // optional
      })
    } catch (err) {
      console.error('Payment error:', err)
      setError('결제 인증에 실패했습니다')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Back link */}
      <Link
        href="/#pricing"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        요금제로 돌아가기
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">주문 요약</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan info */}
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-1">바투 {planLabel} 플랜</h3>
            {plan === SubscriptionPlan.PRO && (
              <Badge variant="secondary" className="mb-2">
                인기
              </Badge>
            )}
          </div>

          {/* Billing period toggle */}
          <div className="flex gap-2">
            <Button
              variant={billingPeriod === BillingPeriod.MONTHLY ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setBillingPeriod(BillingPeriod.MONTHLY)}
              disabled={isLoading || isInitializing}
            >
              월간 결제
            </Button>
            <Button
              variant={billingPeriod === BillingPeriod.ANNUAL ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setBillingPeriod(BillingPeriod.ANNUAL)}
              disabled={isLoading || isInitializing}
            >
              연간 결제
            </Button>
          </div>

          {/* Price display */}
          <div className="space-y-2">
            {isAnnual ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">연간 결제</span>
                  <span className="text-2xl font-bold">
                    ₩{annualTotalAmount.toLocaleString('ko-KR')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>월 환산 금액</span>
                  <span>₩{annualMonthlyAmount.toLocaleString('ko-KR')}</span>
                </div>
                {savingsPercent > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                    <Check className="h-4 w-4" />
                    <span className="font-medium">{savingsPercent}% 할인 적용</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">월간 결제</span>
                  <span className="text-2xl font-bold">
                    ₩{monthlyAmount.toLocaleString('ko-KR')}
                  </span>
                </div>
                {annualPrice < price && (
                  <p className="text-sm text-gray-500 text-center">
                    연간 결제 시 월 ₩{annualMonthlyAmount.toLocaleString('ko-KR')}
                  </p>
                )}
              </>
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>결제 금액</span>
              <span>₩{displayAmount.toLocaleString('ko-KR')}</span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Payment button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={isLoading || isInitializing || !billingWidget || !!error}
          >
            {isLoading || isInitializing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isInitializing ? '초기화 중...' : '결제 진행 중...'}
              </>
            ) : (
              '결제하기'
            )}
          </Button>

          {/* Info text */}
          <div className="text-center space-y-1 text-sm text-gray-500">
            <p>결제 후 14일 무료 체험</p>
            <p>언제든 취소 가능</p>
          </div>

          {/* Security notice */}
          <div className="text-xs text-gray-400 text-center border-t pt-4">
            안전한 결제를 위해 토스페이먼츠를 이용합니다
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
