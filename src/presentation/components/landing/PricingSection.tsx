'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useIntersectionObserver } from '@/presentation/hooks'

const features = [
  '캠페인 무제한 생성',
  'AI 카피 무제한 생성',
  '실시간 KPI 대시보드',
  'AI 주간 보고서',
  'Meta 계정 연동',
]

export function PricingSection() {
  const { ref, isIntersecting } = useIntersectionObserver()

  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/30 overflow-hidden">
      <div
        ref={ref}
        className={`container mx-auto px-4 transition-all duration-1000 ${isIntersecting ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
          }`}
      >
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            심플한 가격 정책
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            14일 동안 모든 기능을 무제한으로 체험하세요.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <Card className="group border-2 border-primary relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:shadow-primary/20">
            {/* Trial Badge */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
              14일 무료
            </div>

            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">14일 무료 체험</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₩0</span>
                <span className="text-muted-foreground">/월</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                가입 후 14일간 무제한 이용
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features List */}
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 transition-all duration-300 hover:translate-x-1 cursor-default">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:bg-primary/20">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button className="w-full" size="lg" asChild>
                <Link href="/register">무료로 시작하기</Link>
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                신용카드 불필요 &middot; 언제든 취소 가능
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
