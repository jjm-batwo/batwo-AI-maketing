'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, BarChart3, TrendingUp, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIntersectionObserver } from '@/presentation/hooks'

// Mini Dashboard Preview Component
function DashboardPreview() {
  return (
    <div className="relative bg-card border rounded-xl shadow-2xl p-4 md:p-6">
      {/* Browser Chrome */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-muted rounded-full px-3 py-1 text-xs text-muted-foreground text-center">
            app.batwo.io/dashboard
          </div>
        </div>
      </div>

      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-sm">오늘의 광고 성과</h4>
        <span className="text-xs text-muted-foreground">실시간</span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <DollarSign className="h-3 w-3" />
            <span className="text-xs">광고비</span>
          </div>
          <div className="font-bold text-sm">₩1.2M</div>
        </div>
        <div className="p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-1 text-muted-foreground mb-1">
            <TrendingUp className="h-3 w-3" />
            <span className="text-xs">매출</span>
          </div>
          <div className="font-bold text-sm">₩4.3M</div>
        </div>
        <div className="p-3 bg-primary/10 rounded-lg">
          <div className="flex items-center gap-1 text-primary mb-1">
            <BarChart3 className="h-3 w-3" />
            <span className="text-xs">ROAS</span>
          </div>
          <div className="font-bold text-sm text-primary">3.5x</div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="h-20 bg-gradient-to-r from-primary/5 via-primary/15 to-primary/5 rounded-lg flex items-end justify-around p-2">
        {[35, 55, 40, 70, 50, 85, 60].map((height, i) => (
          <div
            key={i}
            className="w-4 bg-primary/50 rounded-t transition-all hover:bg-primary"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      {/* AI Insight Badge */}
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-300">
            AI 분석: 25-34세 여성 타겟 전환율이 42% 높습니다. 예산 재배분을 권장합니다.
          </p>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  const { ref: textRef, isIntersecting: textVisible } = useIntersectionObserver()
  const { ref: previewRef, isIntersecting: previewVisible } = useIntersectionObserver()

  return (
    <section className="pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text Content - Left */}
          <div
            ref={textRef}
            className={`text-center lg:text-left ${
              textVisible ? 'animate-slide-in-left' : 'opacity-0'
            }`}
          >
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
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0">
              AI가 캠페인 세팅부터 성과 분석까지 전 과정을 지원합니다.
              누구나 쉽게 온라인 광고를 직접 운영하세요.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
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

          {/* Dashboard Preview - Right */}
          <div
            ref={previewRef}
            className={`hidden lg:block ${
              previewVisible ? 'animate-slide-in-right' : 'opacity-0'
            }`}
          >
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  )
}
