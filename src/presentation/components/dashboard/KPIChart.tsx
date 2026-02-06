'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface DataPoint {
  date?: string
  label?: string
  value: number
}

interface KPIChartProps {
  title?: string
  data: DataPoint[]
  color?: 'primary' | 'green' | 'blue' | 'purple'
  yAxisFormat?: 'currency' | 'multiplier' | 'number'
  isLoading?: boolean
  className?: string
}

const colorMap = {
  primary: 'bg-primary',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
}

export function KPIChart({
  title,
  data,
  color = 'primary',
  yAxisFormat = 'currency',
  isLoading = false,
  className,
}: KPIChartProps) {
  // Pre-computed heights for loading skeleton
  const skeletonHeights = [75, 45, 60, 85, 50, 70, 55]

  const renderSkeleton = () => (
    <div className="flex h-32 items-end gap-1 pl-12">
      {skeletonHeights.map((height, i) => (
        <div
          key={i}
          className="flex-1 animate-pulse rounded-t bg-gray-200"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )

  const formatChartValue = (value: number): string => {
    // 값이 100 미만이면 소수점 3자리까지 (ROAS 등), 그 외에는 일반 포맷
    if (value < 100) {
      return Number(value).toFixed(3)
    }
    return value.toLocaleString()
  }

  const formatYAxisLabel = (value: number): string => {
    if (yAxisFormat === 'multiplier') {
      return `${value.toFixed(1)}x`
    }
    if (yAxisFormat === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
      return value.toLocaleString()
    }
    // Default currency
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M원`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K원`
    return `${value.toLocaleString()}원`
  }

  const formatDateLabel = (dateStr: string): string => {
    // Handle both "YYYY-MM-DD" and "MM/DD" formats
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-')
      return `${parts[1]}/${parts[2]}`
    }
    return dateStr
  }

  // Get unique X-axis labels based on data length
  const getXAxisLabels = () => {
    if (data.length === 0) return []
    if (data.length === 1) return [{ index: 0, position: 'center' as const }]
    if (data.length === 2) return [
      { index: 0, position: 'left' as const },
      { index: 1, position: 'right' as const }
    ]
    // For 3+ items, show first, middle, last
    return [
      { index: 0, position: 'left' as const },
      { index: Math.floor(data.length / 2), position: 'center' as const },
      { index: data.length - 1, position: 'right' as const }
    ]
  }

  const renderChart = () => {
    const maxValue = Math.max(...data.map((d) => d.value), 1)
    const minHeightPercent = 8 // Minimum 8% height for visibility

    // Y-axis labels
    const yAxisLabels = [
      { value: maxValue, label: formatYAxisLabel(maxValue) },
      { value: maxValue / 2, label: formatYAxisLabel(maxValue / 2) },
      { value: 0, label: yAxisFormat === 'currency' ? '0원' : '0' },
    ]

    // X-axis labels with unique dates
    const xAxisLabels = getXAxisLabels()

    return (
      <>
        <div className="flex gap-2">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between h-32 py-0.5 text-[10px] text-muted-foreground w-11 text-right">
            {yAxisLabels.map((label, i) => (
              <span key={i} className="leading-none">
                {label.label}
              </span>
            ))}
          </div>

          {/* Chart bars */}
          <div className="flex-1 flex h-32 items-end gap-1 border-l border-b border-border/30 pl-2 pb-0.5">
            {data.map((point, index) => {
              const heightPercent = (point.value / maxValue) * 100
              const adjustedHeight = Math.max(heightPercent, minHeightPercent)

              return (
                <div
                  key={index}
                  className="group relative flex-1 max-w-20 h-full flex flex-col justify-end"
                  title={`${point.date || point.label}: ${formatChartValue(point.value)}`}
                >
                  <div
                    className={cn(
                      'w-full max-w-16 rounded-t transition-all hover:opacity-80',
                      colorMap[color]
                    )}
                    style={{ height: `${adjustedHeight}%` }}
                  />
                  <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white whitespace-nowrap group-hover:block z-10">
                    {formatChartValue(point.value)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* X-axis labels */}
        <div className="mt-2 flex justify-between text-xs text-muted-foreground pl-12">
          {xAxisLabels.map((label) => {
            const point = data[label.index]
            const dateLabel = formatDateLabel(point.date || point.label || '')

            return (
              <span
                key={label.index}
                className={cn(
                  'flex-1',
                  label.position === 'left' && 'text-left',
                  label.position === 'center' && 'text-center',
                  label.position === 'right' && 'text-right'
                )}
              >
                {dateLabel}
              </span>
            )
          })}
        </div>
      </>
    )
  }

  const renderEmptyState = () => (
    <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
      데이터가 없습니다
    </div>
  )

  // Without title - render just the chart content
  if (!title) {
    if (isLoading) {
      return <div className={className}>{renderSkeleton()}</div>
    }
    if (data.length === 0) {
      return <div className={className}>{renderEmptyState()}</div>
    }
    return <div className={className}>{renderChart()}</div>
  }

  // With title - wrap in Card
  return (
    <Card className={cn("glass-card overflow-hidden", className)}>
      <CardHeader className="border-b border-border/50 bg-muted/20 pb-4">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? renderSkeleton() : data.length === 0 ? renderEmptyState() : renderChart()}
      </CardContent>
    </Card>
  )
}
