import { memo } from 'react'
import type { KPIData, DashboardTab } from './dashboardData'

interface KPIGridProps {
  kpis: KPIData[]
  activeTab: DashboardTab
}

export const KPIGrid = memo(function KPIGrid({ kpis, activeTab }: KPIGridProps) {
  return (
    <dl className="grid grid-cols-3 gap-3 md:gap-4">
      {kpis.map((kpi, i) => (
        <KPICard key={`${activeTab}-kpi-${i}`} kpi={kpi} index={i} />
      ))}
    </dl>
  )
})

interface KPICardProps {
  kpi: KPIData
  index: number
}

const KPICard = memo(function KPICard({ kpi, index }: KPICardProps) {
  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-300 animate-slide-up ${
        kpi.primary
          ? 'bg-primary/5 border-primary/10 hover:bg-primary/10'
          : 'bg-muted/30 border-border/50 hover:bg-muted/50'
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <dt
        className={`flex items-center gap-2 mb-2 ${
          kpi.primary ? 'text-primary' : 'text-muted-foreground'
        }`}
      >
        <div className="p-1.5 bg-background rounded-md shadow-sm">
          <kpi.icon className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <span className="text-[10px] md:text-xs font-medium truncate">{kpi.label}</span>
      </dt>
      <dd
        className={`font-bold text-base md:text-xl tracking-tight ${
          kpi.primary ? 'text-primary' : ''
        }`}
      >
        {kpi.value}
      </dd>
      <dd
        className={`text-[10px] mt-1 flex items-center gap-1 ${
          kpi.primary ? 'text-primary/80' : 'text-muted-foreground'
        }`}
      >
        <span
          className={
            kpi.trend.includes('↑')
              ? 'text-green-600 font-medium'
              : kpi.trend.includes('↓')
              ? 'text-destructive font-medium'
              : 'font-medium'
          }
        >
          {kpi.trend}
        </span>
        <span className="opacity-70">대비</span>
      </dd>
    </div>
  )
})
