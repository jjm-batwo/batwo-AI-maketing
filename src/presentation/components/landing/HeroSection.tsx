'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles, BarChart3, TrendingUp, DollarSign, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIntersectionObserver } from '@/presentation/hooks'

// Mini Dashboard Preview Component with animations
function DashboardPreview() {
  return (
    <div className="relative bg-card border rounded-xl shadow-2xl p-4 md:p-6 transition-all duration-500 hover:shadow-3xl hover:scale-[1.02]">
      {/* Browser Chrome */}
      <div className="flex items-center gap-2 mb-4 pb-4 border-b">
        <div className="flex gap-1.5" role="presentation" aria-label="Browser window controls">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5f56' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffbd2e' }} />
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#27c93f' }} />
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
      <div className="h-20 bg-gradient-to-r from-primary/5 via-primary/15 to-primary/5 rounded-lg flex items-end justify-around p-2" role="img" aria-label="Performance chart showing daily metrics">
        {[35, 55, 40, 70, 50, 85, 60].map((height, i) => (
          <div
            key={i}
            className="w-4 bg-primary/50 rounded-t transition-all duration-300 hover:bg-primary hover:scale-105"
            style={{ height: `${height}%` }}
          />
        ))}
      </div>

      {/* AI Insight Badge */}
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900" role="status" aria-live="polite">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" aria-hidden="true" />
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
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 text-sm font-medium bg-primary/10 text-primary rounded-full" role="status">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
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
              <Button size="lg" asChild className="min-h-[44px]">
                <Link href="/register" className="gap-2" aria-label="14일 무료 체험 시작하기">
                  14일 무료 체험 시작하기
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="min-h-[44px]">
                <Link href="#how-it-works" aria-label="작동 방식 보기">작동 방식 보기</Link>
              </Button>
            </div>

            {/* Social Proof Badge */}
            <div className="mt-6 flex items-center justify-center lg:justify-start gap-3" role="group" aria-label="Social proof">
              <div
                className="flex -space-x-2"
                aria-hidden="true"
                data-testid="social-proof-avatars"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-primary/30 border-2 border-background" />
                <div className="w-8 h-8 rounded-full bg-primary/40 border-2 border-background" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                1,000+ 마케터가 사용 중
              </span>
            </div>

            {/* Trust Indicators */}
            <ul
              className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-2 text-sm text-muted-foreground list-none"
              data-testid="trust-indicators"
              role="list"
              aria-label="Trust indicators"
            >
              <li className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span>신용카드 불필요</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span>5분 설정</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                <span>언제든 취소</span>
              </li>
            </ul>
          </div>

          {/* Dashboard Preview - Right - Now visible on all screen sizes */}
          <div
            ref={previewRef}
            className={`${
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
