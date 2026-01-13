'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'

interface UpgradeCTAProps {
  variant?: 'inline' | 'card'
  className?: string
  // 체험 기간 관련 props
  isInTrial?: boolean
  trialDaysRemaining?: number
}

export function UpgradeCTA({
  variant = 'card',
  className,
  isInTrial = false,
  trialDaysRemaining = 0,
}: UpgradeCTAProps) {
  // 체험 기간 중일 때
  if (isInTrial && trialDaysRemaining > 0) {
    if (variant === 'inline') {
      return (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
          <Clock className="h-4 w-4" />
          체험 기간 {trialDaysRemaining}일 남음
        </span>
      )
    }

    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-blue-100 p-3">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">14일 무료 체험 중</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                체험 기간 동안 모든 기능을 무제한으로 이용하실 수 있습니다.
                <br />
                <span className="font-medium text-blue-600">
                  {trialDaysRemaining}일 남음
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 체험 기간 종료 후
  if (variant === 'inline') {
    return (
      <Link
        href="/pricing"
        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
      >
        <Sparkles className="h-4 w-4" />
        유료 플랜으로 업그레이드
        <ArrowRight className="h-4 w-4" />
      </Link>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/10 p-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">체험 기간이 종료되었습니다</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              유료 플랜을 이용하시면 캠페인, AI 카피, AI 분석을
              무제한으로 사용할 수 있어요.
            </p>
            <Button asChild className="mt-4">
              <Link href="/pricing">
                유료 플랜 알아보기
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
