import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function HeroSection() {
  return (
    <section className="pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium bg-primary/10 text-primary rounded-full">
            <Sparkles className="h-4 w-4" />
            <span>AI 기반 마케팅 자동화</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            마케팅 지식 없이도
            <br />
            <span className="text-primary">Meta 광고 자동화</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI가 캠페인 세팅부터 성과 분석까지 전 과정을 지원합니다.
            <br className="hidden md:block" />
            누구나 쉽게 온라인 광고를 직접 운영하세요.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register" className="gap-2">
                무료로 시작하기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#how-it-works">작동 방식 보기</Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <p className="mt-8 text-sm text-muted-foreground">
            신용카드 없이 시작 &middot; 설정 5분 &middot; 언제든 취소 가능
          </p>
        </div>
      </div>
    </section>
  )
}
