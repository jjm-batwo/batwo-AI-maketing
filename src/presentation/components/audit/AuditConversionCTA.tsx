'use client'

import Link from 'next/link'
import { ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface AuditConversionCTAProps {
  estimatedImprovement: { amount: number; currency: string }
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'KRW') {
    return `₩${amount.toLocaleString('ko-KR')}`
  }
  return `${currency} ${amount.toLocaleString()}`
}

export function AuditConversionCTA({ estimatedImprovement }: AuditConversionCTAProps) {
  return (
    <Card className="w-full border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
      <CardContent className="pt-6 pb-6 px-6 md:px-8">
        <div className="flex flex-col items-center text-center gap-4">
          {/* 아이콘 */}
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <Zap className="w-6 h-6 text-primary" aria-hidden="true" />
          </div>

          {/* 메인 메시지 */}
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              AI가 자동으로 최적화해드려요
            </h2>
            <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
              지금 가입하면 월{' '}
              <span className="font-bold text-emerald-600">
                {formatAmount(estimatedImprovement.amount, estimatedImprovement.currency)}
              </span>{' '}
              절감 가능한 광고 최적화를 AI가 자동으로 실행합니다.
            </p>
          </div>

          {/* 가입 버튼 */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm mt-2">
            <Button
              size="lg"
              asChild
              className="group w-full h-12 px-6 bg-primary hover:bg-primary/90 shadow-sm transition-all"
            >
              <Link
                href="/register"
                className="gap-2 font-semibold"
                aria-label="14일 무료 체험 시작하기 - 회원가입 페이지로 이동"
              >
                14일 무료 체험 시작
                <ArrowRight
                  className="h-4 w-4 group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                />
              </Link>
            </Button>
          </div>

          {/* 보조 텍스트 */}
          <p className="text-xs text-muted-foreground">
            신용카드 불필요 · 언제든 해지 가능 · 1분 안에 시작
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
