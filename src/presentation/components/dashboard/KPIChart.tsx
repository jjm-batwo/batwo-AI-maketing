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
  isLoading = false,
  className,
}: KPIChartProps) {
  // Pre-computed heights for loading skeleton
  const skeletonHeights = [75, 45, 60, 85, 50, 70, 55]

  const renderSkeleton = () => (
    <div className="flex h-32 items-end gap-1">
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

  const renderChart = () => {
    const maxValue = Math.max(...data.map((d) => d.value), 1)
    return (
      <>
        <div className="flex h-32 items-end gap-1">
          {data.map((point, index) => {
            const height = (point.value / maxValue) * 100
            return (
              <div
                key={index}
                className="group relative flex-1"
                title={`${point.date || point.label}: ${formatChartValue(point.value)}`}
              >
                <div
                  className={cn(
                    'w-full rounded-t transition-all hover:opacity-80',
                    colorMap[color]
                  )}
                  style={{ height: `${height}%` }}
                />
                <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 rounded bg-gray-900 px-2 py-1 text-xs text-white group-hover:block">
                  {formatChartValue(point.value)}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          {data.length > 0 && (
            <>
              <span>{data[0].date || data[0].label}</span>
              <span>{data[data.length - 1].date || data[data.length - 1].label}</span>
            </>
          )}
        </div>
      </>
    )
  }

  // Without title - render just the chart content
  if (!title) {
    if (isLoading) {
      return <div className={className}>{renderSkeleton()}</div>
    }
    return <div className={className}>{renderChart()}</div>
  }

  // With title - wrap in Card
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? renderSkeleton() : renderChart()}
      </CardContent>
    </Card>
  )
}
