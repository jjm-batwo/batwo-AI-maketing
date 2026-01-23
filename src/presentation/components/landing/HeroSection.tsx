'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, BarChart3, TrendingUp, DollarSign, Check, LayoutDashboard, Target, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIntersectionObserver } from '@/presentation/hooks'

// Gradient Mesh Background Component
function GradientBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[80px] opacity-20 mix-blend-multiply dark:mix-blend-screen will-change-[opacity]" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[80px] opacity-20 mix-blend-multiply dark:mix-blend-screen will-change-[opacity]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[100px] opacity-10" />
      <div className="absolute inset-0 bg-grid-slate-900/[0.04] dark:bg-grid-slate-400/[0.05] [mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]" />
    </div>
  )
}

// Dashboard Data Types
type DashboardTab = 'dashboard' | 'campaign' | 'report'

const DASHBOARD_DATA = {
  dashboard: {
    title: '광고 캠페인 성과',
    subtitle: '실시간 데이터 업데이트 중',
    kpis: [
      { label: '총 광고비', value: '₩1.2M', trend: '↑ 12%', icon: DollarSign },
      { label: '매출 발생', value: '₩4.3M', trend: '↑ 24%', icon: TrendingUp },
      { label: 'ROAS', value: '358%', trend: 'Top 5%', icon: BarChart3, primary: true },
    ],
    chart: [35, 55, 40, 70, 50, 85, 60],
    insight: {
      title: 'AI 최적화 제안',
      content: '20대 여성 타겟의 전환율이 상승세입니다. 예산을 15% 증액하면 ROAS가 4.2x로 개선될 것으로 예측됩니다.',
    },
  },
  campaign: {
    title: '활성 캠페인 관리',
    subtitle: '12개 캠페인 운영 중',
    kpis: [
      { label: '활성 광고', value: '24개', trend: '↑ 2', icon: Target },
      { label: '클릭률(CTR)', value: '4.2%', trend: '↑ 0.8%', icon: TrendingUp },
      { label: 'CPA', value: '₩8,200', trend: '↓ 15%', icon: DollarSign, primary: true },
    ],
    chart: [60, 45, 75, 50, 80, 55, 90],
    insight: {
      title: '캠페인 자동 튜닝',
      content: '성과가 낮은 A그룹 소재를 일시중지하고 성과가 높은 B그룹으로 예산을 자동 재배분했습니다.',
    },
  },
  report: {
    title: '주간 AI 성과 분석',
    subtitle: '2024년 1월 3주차',
    kpis: [
      { label: '광고 효율', value: '우수', trend: 'A+', icon: BarChart3 },
      { label: '전환수', value: '1,240건', trend: '↑ 18%', icon: TrendingUp },
      { label: '예상 매출', value: '₩15.8M', trend: '↑ 3.2M', icon: FileText, primary: true },
    ],
    chart: [40, 60, 50, 80, 70, 90, 85],
    insight: {
      title: '마켓 인사이트',
      content: '최근 경쟁사 광고 노출이 감소했습니다. 지금이 공격적으로 노출을 늘려 시장 점유율을 확보할 최적기입니다.',
    },
  },
}

// Mini Dashboard Preview Component with animations
function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard')
  const data = DASHBOARD_DATA[activeTab]

  return (
    <div className="relative glass-card rounded-2xl p-4 md:p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] group aspect-[4/3] md:aspect-auto">
      {/* Glow Effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500 pointer-events-none" />

      <div className="relative bg-card/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-sm border border-border/50">
        {/* Browser Chrome */}
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <div className="flex gap-1.5" role="presentation">
            <div className="w-3 h-3 rounded-full bg-red-400/80" />
            <div className="w-3 h-3 rounded-full bg-amber-400/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
          </div>
          <div className="flex-1 mx-4">
            <div className="bg-background/50 rounded-md px-3 py-1 text-xs text-muted-foreground text-center font-mono border border-border/50">
              app.batwo.io/dashboard
            </div>
          </div>
        </div>

        {/* Tabs Switcher */}
        <div className="flex p-1.5 bg-muted/50 border-b border-border/50 gap-1 relative z-10">
          {[
            { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
            { id: 'campaign', label: '캠페인 관리', icon: Target },
            { id: 'report', label: 'AI 보고서', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as DashboardTab)}
              onMouseEnter={() => setActiveTab(tab.id as DashboardTab)}
              onFocus={() => setActiveTab(tab.id as DashboardTab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg transition-all duration-200 relative z-20 cursor-pointer ${activeTab === tab.id
                ? 'bg-background text-primary shadow-sm ring-1 ring-border/50'
                : 'text-muted-foreground hover:bg-background/50'
                }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6 space-y-6 transition-all duration-300">
          {/* Dashboard Header */}
          <div className="flex items-center justify-between">
            <div key={activeTab} className="animate-fade-in">
              <h4 className="font-semibold text-lg tracking-tight">{data.title}</h4>
              <p className="text-xs text-muted-foreground">{data.subtitle}</p>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live
            </div>
          </div>

          {/* KPI Grid */}
          <dl className="grid grid-cols-3 gap-3 md:gap-4">
            {data.kpis.map((kpi, i) => (
              <div
                key={`${activeTab}-kpi-${i}`}
                className={`p-4 rounded-xl border transition-all duration-300 animate-slide-up ${kpi.primary
                  ? 'bg-primary/5 border-primary/10 hover:bg-primary/10'
                  : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                  }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <dt className={`flex items-center gap-2 mb-2 ${kpi.primary ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className="p-1.5 bg-background rounded-md shadow-sm">
                    <kpi.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] md:text-xs font-medium truncate">{kpi.label}</span>
                </dt>
                <dd className={`font-bold text-base md:text-xl tracking-tight ${kpi.primary ? 'text-primary' : ''}`}>
                  {kpi.value}
                </dd>
                <dd className={`text-[10px] mt-1 flex items-center gap-1 ${kpi.primary ? 'text-primary/80' : 'text-muted-foreground'}`}>
                  <span className={kpi.trend.includes('↑') ? 'text-green-600 font-medium' : kpi.trend.includes('↓') ? 'text-destructive font-medium' : 'font-medium'}>
                    {kpi.trend}
                  </span>
                  <span className="opacity-70">대비</span>
                </dd>
              </div>
            ))}
          </dl>

          {/* Mini Chart */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{activeTab === 'report' ? '주간 성과 변동' : '일별 전환 트렌드'}</span>
              <span>최근 7일</span>
            </div>
            <div className="h-20 md:h-24 bg-gradient-to-b from-primary/5 to-transparent rounded-lg border border-primary/5 flex items-end justify-between p-3 gap-1" role="img" aria-label="Performance chart">
              {data.chart.map((height, i) => (
                <div key={`${activeTab}-bar-${i}`} className="group/bar flex flex-col items-center gap-1 w-full h-full justify-end">
                  <div
                    className="w-full max-w-[12px] bg-primary/40 rounded-t-sm transition-all duration-500 hover:bg-primary hover:scale-y-110 origin-bottom animate-slide-up"
                    style={{
                      height: `${height}%`,
                      animationDelay: `${i * 30}ms`
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight Badge */}
          <div key={`${activeTab}-insight`} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/40 rounded-lg border border-green-200/50 dark:border-green-900/50 shadow-sm animate-fade-in" role="status">
            <div className="flex items-start gap-2.5">
              <div className="p-1 bg-green-100 dark:bg-green-900/50 rounded-full mt-0.5 shrink-0">
                <Sparkles className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-800 dark:text-green-300 mb-0.5">
                  {data.insight.title}
                </p>
                <p className="text-[11px] leading-relaxed text-green-700 dark:text-green-400/80">
                  {data.insight.content}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function HeroSection() {
  const { ref: textRef, isIntersecting: textVisible } = useIntersectionObserver()
  const { ref: previewRef, isIntersecting: previewVisible } = useIntersectionObserver()

  return (
    <section className="relative pt-24 pb-20 md:pt-36 md:pb-32 overflow-hidden">
      <GradientBackground />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content - Left */}
          <div
            ref={textRef}
            className={`text-center lg:text-left ${textVisible ? 'animate-slide-in-left' : 'opacity-0'
              }`}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-sm font-medium bg-primary/10 text-primary rounded-full border border-primary/10 shadow-sm hover:bg-primary/15 transition-colors cursor-default" role="status">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>AI 기반 마케팅 자동화 솔루션</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
              마케팅 지식 없이도
              <br />
              <span className="text-gradient">전문가처럼 광고하기</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              복잡한 메타, 구글 광고 설정을 AI가 1분 만에 완료합니다.<br className="hidden md:block" />
              데이터 분석부터 소재 최적화까지, 바투가 알아서 해드립니다.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Button size="lg" asChild className="h-14 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                <Link href="/register" className="gap-2 font-semibold">
                  14일 무료로 시작하기
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 text-base bg-background/50 backdrop-blur-sm border-2 hover:bg-muted/50 transition-all w-full sm:w-auto">
                <Link href="#how-it-works">서비스 소개 영상</Link>
              </Button>
            </div>

            {/* Social Proof Badge */}
            <div className="mt-10 flex items-center justify-center lg:justify-start gap-5">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-background flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-indigo-400 to-purple-500 shadow-sm relative" style={{ zIndex: 10 - i }}>
                    User
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground relative z-0" aria-label="1,000명 이상의 추가 사용자">
                  +1k
                </div>
              </div>
              <div className="text-sm">
                <div className="flex items-center gap-1 mb-0.5">
                  <div className="flex text-amber-400">
                    {'★★★★★'.split('').map((star, i) => <span key={i}>{star}</span>)}
                  </div>
                  <span className="font-bold">4.9/5.0</span>
                </div>
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">1,200+</span> 마케터가 선택한 솔루션
                </p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 pt-6 border-t border-border/50 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-muted-foreground/80">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span>초기 비용 0원</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Check className="h-3 w-3 text-blue-600" />
                </div>
                <span>5분 간편 설정</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Check className="h-3 w-3 text-purple-600" />
                </div>
                <span>언제든 해지 가능</span>
              </div>
            </div>
          </div>

          {/* Dashboard Preview - Right */}
          <div
            ref={previewRef}
            className={`relative perspective-1000 ${previewVisible ? 'animate-slide-in-right' : 'opacity-0'
              }`}
          >
            {/* Decorative Elements behind preview */}
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-pulse pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl animate-pulse delay-700 pointer-events-none" />

            <div className="relative">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
