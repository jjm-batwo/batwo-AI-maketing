'use client'

import { memo, useRef } from 'react'
import { useScrollAnimation } from '@/presentation/hooks'
import { SectionHeader } from '@/presentation/components/common'
import { BrowserChrome } from '../HeroSection/BrowserChrome'
import { FEATURES } from './featuresData'

interface FeaturesSectionProps {
  id?: string
}

export const FeaturesSection = memo(function FeaturesSection({
  id = 'features',
}: FeaturesSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { isVisible } = useScrollAnimation(sectionRef, { threshold: 0.1 })

  return (
    <section id={id} className="py-20 md:py-32 overflow-hidden bg-muted/50">
      <div
        ref={sectionRef}
        className={`container mx-auto px-4 transition-all duration-1000 ${
          isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Section Header */}
        <SectionHeader
          label="기능"
          title="왜 바투인가요?"
          description="복잡한 광고 운영을 AI가 대신합니다. 당신은 비즈니스에만 집중하세요."
        />

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group bg-background border border-border rounded-xl p-6 shadow-sm hover:shadow-md hover:border-primary transition-all duration-300 cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Dashboard Preview */}
        <div className="max-w-4xl mx-auto">
          <DashboardMock />
        </div>
      </div>
    </section>
  )
})

function DashboardMock() {
  return (
    <div
      className="rounded-2xl border border-border shadow-2xl overflow-hidden bg-card"
      role="img"
      aria-label="바투 대시보드 미리보기"
    >
      <BrowserChrome />

      {/* Dashboard Content */}
      <div className="p-6 bg-muted/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-semibold text-foreground">광고 성과 대시보드</h4>
            <p className="text-xs text-muted-foreground mt-0.5">최근 7일 기준</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full">
            <span
              className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"
              aria-hidden="true"
            />
            실시간 업데이트
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'ROAS', value: '4.52x', change: '+23%', up: true },
            { label: '광고비', value: '₩1.25M', change: '-8%', up: false },
            { label: '전환수', value: '247건', change: '+31%', up: true },
            { label: 'CTR', value: '3.8%', change: '+0.5%', up: true },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="bg-background rounded-xl p-4 border border-border shadow-sm"
            >
              <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
              <p className="text-xl font-bold text-foreground">{kpi.value}</p>
              <p
                className={`text-xs mt-1 font-medium ${kpi.up ? 'text-green-600' : 'text-blue-600'}`}
              >
                {kpi.change} <span className="text-muted-foreground font-normal">전주 대비</span>
              </p>
            </div>
          ))}
        </div>

        {/* Chart Mockup */}
        <div className="bg-background rounded-xl border border-border shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-muted-foreground">일별 전환 트렌드</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">
              최근 7일
            </span>
          </div>
          <div className="h-28 flex items-end justify-around gap-2 px-2">
            {[38, 60, 45, 78, 52, 88, 65].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full rounded-t-md bg-primary/20 hover:bg-primary/40 transition-colors"
                  style={{ height: `${h}%` }}
                  aria-hidden="true"
                />
                <span className="text-[10px] text-muted-foreground">
                  {['월', '화', '수', '목', '금', '토', '일'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
