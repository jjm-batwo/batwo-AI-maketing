'use client'

import { memo, useMemo } from 'react'
import { cn } from '@/lib/utils'

interface DonutSegment {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  strokeWidth?: number
  className?: string
  centerLabel?: string
  centerValue?: string | number
}

export const DonutChart = memo(function DonutChart({
  segments,
  size = 120,
  strokeWidth = 16,
  className,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = useMemo(() => segments.reduce((sum, s) => sum + s.value, 0), [segments])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  const arcs = useMemo(() => {
    return segments
      .reduce<{
        offset: number
        arcs: Array<DonutSegment & { dashLength: number; dashOffset: number; percentage: number }>
      }>(
        (acc, segment) => {
          const percentage = total > 0 ? segment.value / total : 0
          const dashLength = percentage * circumference
          const dashOffset = -acc.offset
          return {
            offset: acc.offset + dashLength,
            arcs: [...acc.arcs, { ...segment, dashLength, dashOffset, percentage }],
          }
        },
        { offset: 0, arcs: [] }
      )
      .arcs
  }, [segments, total, circumference])

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/20"
          />
          {/* Segments */}
          {arcs.map((arc, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${arc.dashLength} ${circumference - arc.dashLength}`}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${center} ${center})`}
              className="transition-all duration-500"
            />
          ))}
        </svg>
        {/* Center text */}
        {(centerLabel || centerValue !== undefined) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {centerValue !== undefined && (
              <span className="text-lg font-bold">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-muted-foreground">{centerLabel}</span>
            )}
          </div>
        )}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((segment, i) => (
          <div key={i} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-muted-foreground">{segment.label}</span>
            <span className="font-medium">{segment.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
})
