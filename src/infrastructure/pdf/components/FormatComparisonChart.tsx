import React from 'react'
import { View, Text, StyleSheet, Svg, Rect } from '@react-pdf/renderer'
import type { FormatPerformanceItem } from '@application/dto/report/EnhancedReportSections'
import { colors, formatColors, PDF_MONO_FONT_FAMILY, letterSpacing } from '../design-tokens'

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  label: {
    width: 60,
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  barArea: {
    flex: 1,
  },
  valueText: {
    fontSize: 9,
    color: colors.textSecondary,
    width: 50,
    textAlign: 'right',
    fontFamily: PDF_MONO_FONT_FAMILY,
    letterSpacing: letterSpacing.wide,
  },
  details: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 68,
    marginBottom: 4,
  },
  detailText: {
    fontSize: 8,
    color: colors.textSecondary,
  },
})

interface FormatComparisonChartProps {
  formats: FormatPerformanceItem[]
}

export function FormatComparisonChart({ formats }: FormatComparisonChartProps) {
  if (formats.length === 0) return null

  const maxRoas = Math.max(...formats.map(f => f.roas), 1)

  return (
    <View style={styles.container}>
      {formats.map((f) => {
        const barWidth = (f.roas / maxRoas) * 300
        const color = formatColors[f.format] ?? colors.textSecondary
        return (
          <View key={f.format}>
            <View style={styles.row}>
              <Text style={styles.label}>{f.formatLabel}</Text>
              <View style={styles.barArea}>
                <Svg width={310} height={16}>
                  <Rect x={0} y={0} width={310} height={16} rx={4} fill={colors.slate100} />
                  <Rect x={0} y={0} width={Math.max(barWidth, 2)} height={16} rx={4} fill={color} />
                </Svg>
              </View>
              <Text style={styles.valueText}>{f.roas.toFixed(2)}x</Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.detailText}>소재 {f.adCount}개</Text>
              <Text style={styles.detailText}>CTR {f.ctr.toFixed(1)}%</Text>
              <Text style={styles.detailText}>Freq {f.avgFrequency.toFixed(1)}</Text>
              {f.thruPlayRate !== undefined && (
                <Text style={styles.detailText}>완전재생 {f.thruPlayRate.toFixed(1)}%</Text>
              )}
            </View>
          </View>
        )
      })}
    </View>
  )
}
