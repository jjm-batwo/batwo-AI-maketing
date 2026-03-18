import React from 'react'
import { View, Text, StyleSheet, Svg, Line, Circle } from '@react-pdf/renderer'
import type { DailyDataPoint } from '@application/dto/report/EnhancedReportSections'

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendText: {
    fontSize: 8,
    color: '#64748b',
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  xLabel: {
    fontSize: 7,
    color: '#94a3b8',
  },
})

interface LineChartProps {
  data: DailyDataPoint[]
  width?: number
  height?: number
}

const COLORS = {
  spend: '#ef4444',
  revenue: '#22c55e',
  roas: '#3b82f6',
}

export function LineChart({ data, width = 460, height = 150 }: LineChartProps) {
  if (data.length === 0) return null

  const padding = { top: 10, right: 10, bottom: 10, left: 10 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)
  const maxSpend = Math.max(...data.map(d => d.spend), 1)
  const maxVal = Math.max(maxRevenue, maxSpend)

  const getX = (index: number) => padding.left + (index / Math.max(data.length - 1, 1)) * chartWidth
  const getY = (value: number) => padding.top + chartHeight - (value / maxVal) * chartHeight

  const renderLine = (values: number[], color: string) => {
    const elements: React.ReactElement[] = []
    for (let i = 0; i < values.length - 1; i++) {
      elements.push(
        <Line
          key={`line-${color}-${i}`}
          x1={getX(i)}
          y1={getY(values[i])}
          x2={getX(i + 1)}
          y2={getY(values[i + 1])}
          stroke={color}
          strokeWidth={1.5}
        />
      )
    }
    for (let i = 0; i < values.length; i++) {
      elements.push(
        <Circle
          key={`pt-${color}-${i}`}
          cx={getX(i)}
          cy={getY(values[i])}
          r={2.5}
          fill={color}
        />
      )
    }
    return elements
  }

  return (
    <View style={styles.container}>
      <Svg width={width} height={height}>
        {renderLine(data.map(d => d.spend), COLORS.spend)}
        {renderLine(data.map(d => d.revenue), COLORS.revenue)}
      </Svg>
      <View style={styles.xAxis}>
        {data.map((d, i) => (
          <Text key={i} style={styles.xLabel}>{d.date.slice(5)}</Text>
        ))}
      </View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <Svg width={10} height={10}><Circle cx={5} cy={5} r={4} fill={COLORS.spend} /></Svg>
          <Text style={styles.legendText}>지출</Text>
        </View>
        <View style={styles.legendItem}>
          <Svg width={10} height={10}><Circle cx={5} cy={5} r={4} fill={COLORS.revenue} /></Svg>
          <Text style={styles.legendText}>매출</Text>
        </View>
      </View>
    </View>
  )
}
