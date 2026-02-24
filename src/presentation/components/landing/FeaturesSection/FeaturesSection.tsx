'use client'

import { memo, useRef } from 'react'
import { useScrollAnimation } from '@/presentation/hooks'
import { SectionLabel } from '../SectionLabel'
import { FEATURES } from './featuresData'

interface FeaturesSectionProps {
  id?: string
}

export const FeaturesSection = memo(function FeaturesSection({ id = 'features' }: FeaturesSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const { isVisible } = useScrollAnimation(sectionRef, { threshold: 0.1 })

  return (
    <section id={id} className="py-20 md:py-32 overflow-hidden bg-gray-50/50">
      <div
        ref={sectionRef}
        className={`container mx-auto px-4 transition-all duration-1000 ${
          isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-10'
        }`}
      >
        {/* Section Header */}
        <header className="text-center mb-16">
          <SectionLabel className="text-center">기능</SectionLabel>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            왜 바투인가요?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            복잡한 광고 운영을 AI가 대신합니다. 당신은 비즈니스에만 집중하세요.
          </p>
        </header>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {FEATURES.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-6 w-6 text-primary" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
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
      className="rounded-2xl border border-gray-200 shadow-2xl overflow-hidden bg-white"
      role="img"
      aria-label="바투 대시보드 미리보기"
    >
      {/* Browser Chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" aria-hidden="true" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" aria-hidden="true" />
          <div className="w-3 h-3 rounded-full bg-green-400" aria-hidden="true" />
        </div>
        <div className="flex-1 mx-4">
          <div className="bg-white border border-gray-200 rounded-md h-7 flex items-center px-3 max-w-xs mx-auto">
            <svg className="w-3 h-3 text-green-500 mr-2 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-gray-400 font-mono">app.batwo.io/dashboard</span>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="p-6 bg-gray-50/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="font-semibold text-gray-900">광고 성과 대시보드</h4>
            <p className="text-xs text-gray-500 mt-0.5">최근 7일 기준</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" aria-hidden="true" />
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
            <div key={kpi.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">{kpi.label}</p>
              <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
              <p className={`text-xs mt-1 font-medium ${kpi.up ? 'text-green-600' : 'text-blue-600'}`}>
                {kpi.change} <span className="text-gray-400 font-normal">전주 대비</span>
              </p>
            </div>
          ))}
        </div>

        {/* Chart Mockup */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-gray-700">일별 전환 트렌드</span>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">최근 7일</span>
          </div>
          <div className="h-28 flex items-end justify-around gap-2 px-2">
            {[38, 60, 45, 78, 52, 88, 65].map((h, i) => (
              <div key={i} className="flex flex-col items-center gap-1 flex-1">
                <div
                  className="w-full rounded-t-md bg-primary/20 hover:bg-primary/40 transition-colors"
                  style={{ height: `${h}%` }}
                  aria-hidden="true"
                />
                <span className="text-[10px] text-gray-400">
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
