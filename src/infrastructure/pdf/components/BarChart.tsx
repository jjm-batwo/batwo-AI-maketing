import React from 'react'
import { View, Text, Svg, Rect, StyleSheet } from '@react-pdf/renderer'
import { colors, PDF_MONO_FONT_FAMILY, letterSpacing } from '../design-tokens'

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  chartArea: {
    flexDirection: 'column',
    gap: 6,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    width: '25%',
    fontSize: 9,
    color: colors.textSecondary,
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: colors.slate100,
    borderRadius: 4,
    position: 'relative',
  },
  valueText: {
    width: '20%',
    textAlign: 'right',
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: PDF_MONO_FONT_FAMILY,
    letterSpacing: letterSpacing.wide,
  },
})

export interface BarChartData {
  label: string
  value: number
  color?: string
}

interface BarChartProps {
  title?: string
  data: BarChartData[]
  formatValue?: (value: number) => string
  maxValue?: number
}

export function BarChart({ title, data, formatValue, maxValue }: BarChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.chartArea}>
        {data.map((item, index) => {
          const percentage = (item.value / max) * 100
          const color = item.color || colors.blue

          return (
            <View key={index} style={styles.barRow}>
              <Text style={styles.label}>{item.label}</Text>
              <View style={styles.barContainer}>
                <Svg height="20" width={`${percentage}%`}>
                  <Rect x="0" y="0" width="100%" height="20" fill={color} rx="4" />
                </Svg>
              </View>
              <Text style={styles.valueText}>
                {formatValue ? formatValue(item.value) : item.value.toLocaleString()}
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}
