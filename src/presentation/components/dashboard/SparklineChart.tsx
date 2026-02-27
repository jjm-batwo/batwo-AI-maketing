'use client'

import { memo, useId, useMemo } from 'react'

interface SparklineChartProps {
  data: number[]
  color?: string
  height?: number
  width?: number
  className?: string
}

export const SparklineChart = memo(function SparklineChart({
  data,
  color = 'currentColor',
  height = 32,
  width = 80,
  className,
}: SparklineChartProps) {
  const baseId = useId().replace(/:/g, '')
  const gradientId = `sparkline-${baseId}`
  const { points, fillPoints } = useMemo(() => {
    if (data.length < 2) return { points: '', fillPoints: '' }

    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const padding = 2

    const pts = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2)
      const y = padding + (1 - (value - min) / range) * (height - padding * 2)
      return `${x},${y}`
    })

    const linePoints = pts.join(' ')
    const fill = `${pts[0].split(',')[0]},${height} ${linePoints} ${pts[pts.length - 1].split(',')[0]},${height}`

    return { points: linePoints, fillPoints: fill }
  }, [data, height, width])

  if (data.length < 2) return null

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0.05} />
        </linearGradient>
      </defs>
      <polygon
        points={fillPoints}
        fill={`url(#${gradientId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
})
