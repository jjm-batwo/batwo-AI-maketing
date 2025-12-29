import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
  '캠페인 5회/주 생성',
  'AI 카피 생성 20회/일',
  '실시간 KPI 대시보드',
  'AI 주간 보고서',
  'Meta 계정 연동',
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            심플한 가격 정책
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            베타 기간 동안 모든 기능을 무료로 이용하실 수 있습니다.
          </p>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <Card className="border-2 border-primary relative overflow-hidden">
            {/* Beta Badge */}
            <div className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
              Beta 무료
            </div>

            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Beta 무료 체험</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">₩0</span>
                <span className="text-muted-foreground">/월</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                베타 서비스 기간 한정
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Features List */}
              <ul className="space-y-3">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
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
