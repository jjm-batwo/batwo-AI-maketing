'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import type { DashboardTab } from './dashboardData'
import { DASHBOARD_DATA } from './dashboardData'
import { BrowserChrome } from './BrowserChrome'
import { TabSwitcher } from './TabSwitcher'
import { KPIGrid } from './KPIGrid'
import { MiniChart } from './MiniChart'
import { AIInsight } from './AIInsight'

export const DashboardPreview = memo(function DashboardPreview() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('dashboard')

  const handleTabChange = useCallback((tab: DashboardTab) => {
    setActiveTab(tab)
  }, [])

  const data = useMemo(() => DASHBOARD_DATA[activeTab], [activeTab])

  return (
    // glass-card → bg-card + 명시적 border/shadow. glow 레이어 제거. 과도한 hover 축소
    <div className="relative bg-card border border-border/50 shadow-2xl rounded-2xl p-4 md:p-6 transition-all duration-500 hover:shadow-xl aspect-[4/3] md:aspect-auto">
      <div className="relative bg-card rounded-xl overflow-hidden shadow-sm border border-border/50">
        <BrowserChrome />
        <TabSwitcher activeTab={activeTab} onTabChange={handleTabChange} />

        <div className="p-4 md:p-6 space-y-6 transition-all duration-300">
          {/* Dashboard Header */}
          <DashboardHeader title={data.title} subtitle={data.subtitle} />

          {/* KPI Grid */}
          <KPIGrid kpis={data.kpis} />

          {/* Mini Chart */}
          <MiniChart data={data.chart} activeTab={activeTab} />

          {/* AI Insight Badge */}
          <AIInsight
            title={data.insight.title}
            content={data.insight.content}
          />
        </div>
      </div>
    </div>
  )
})

interface DashboardHeaderProps {
  title: string
  subtitle: string
}

const DashboardHeader = memo(function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="transition-opacity duration-300">
        <h4 className="font-semibold text-lg tracking-tight">{title}</h4>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" aria-hidden="true"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" aria-hidden="true"></span>
        </span>
        <span aria-label="실시간 데이터 업데이트 중">Live</span>
      </div>
    </div>
  )
})
