'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface UpgradeCTAProps {
  variant?: 'inline' | 'card'
  className?: string
}

export function UpgradeCTA({ variant = 'card', className }: UpgradeCTAProps) {
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
            <h3 className="font-semibold">무제한 기능이 필요하신가요?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Beta 기간 종료 후 유료 플랜을 이용하시면 캠페인, AI 카피, AI 분석을
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
