import { memo, useMemo } from 'react'
import type { DashboardTab } from './dashboardData'

interface MiniChartProps {
  data: number[]
  activeTab: DashboardTab
}

export const MiniChart = memo(function MiniChart({ data, activeTab }: MiniChartProps) {
  const chartLabel = useMemo(
    () => (activeTab === 'report' ? '주간 성과 변동' : '일별 전환 트렌드'),
    [activeTab]
  )

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{chartLabel}</span>
        <span>최근 7일</span>
      </div>
      <div
        className="h-20 md:h-24 bg-gradient-to-b from-primary/5 to-transparent rounded-lg border border-primary/5 flex items-end justify-between p-3 gap-1"
        role="img"
        aria-label={`${chartLabel} 차트. 최근 7일간 데이터`}
      >
        {data.map((height, i) => (
          <ChartBar key={`bar-${i}`} height={height} index={i} />
        ))}
      </div>
    </div>
  )
})

interface ChartBarProps {
  height: number
  index: number
}

const ChartBar = memo(function ChartBar({ height, index }: ChartBarProps) {
  return (
    <div className="group/bar flex flex-col items-center gap-1 w-full h-full justify-end">
      <div
        className="w-full max-w-[12px] bg-primary/70 rounded-t-sm transition-all duration-500 hover:bg-primary hover:scale-y-110 origin-bottom"
        style={{
          height: `${height}%`,
          animationDelay: `${index * 30}ms`,
        }}
        aria-label={`Day ${index + 1}: ${height}%`}
      />
    </div>
  )
})
