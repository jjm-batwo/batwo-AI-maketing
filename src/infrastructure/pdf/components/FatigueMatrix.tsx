import React from 'react'
import { View, Text, StyleSheet, Svg, Rect } from '@react-pdf/renderer'
import type { CreativeFatigueItem } from '@application/dto/report/EnhancedReportSections'
import { colors, fatigueColors, PDF_MONO_FONT_FAMILY, letterSpacing } from '../design-tokens'

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  item: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.bgCard,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  healthy: { borderLeftColor: fatigueColors.healthy.border },
  warning: { borderLeftColor: fatigueColors.warning.border },
  critical: { borderLeftColor: fatigueColors.critical.border },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  metricText: {
    fontSize: 9,
    color: colors.textSecondary,
    fontFamily: PDF_MONO_FONT_FAMILY,
    letterSpacing: letterSpacing.wide,
  },
  barContainer: {
    marginBottom: 4,
  },
  recommendation: {
    fontSize: 9,
    color: colors.textSecondary,
  },
})

interface FatigueMatrixProps {
  creatives: CreativeFatigueItem[]
}

export function FatigueMatrix({ creatives }: FatigueMatrixProps) {
  if (creatives.length === 0) return null

  return (
    <View style={styles.container}>
      {creatives.map((c) => {
        const levelColors = fatigueColors[c.fatigueLevel]
        return (
          <View key={c.creativeId} style={[styles.item, styles[c.fatigueLevel]]}>
            <View style={styles.header}>
              <Text style={styles.name}>{c.name} ({c.format})</Text>
              <View style={[styles.badge, { backgroundColor: levelColors.bg }]}>
                <Text style={[styles.badgeText, { color: levelColors.text }]}>{c.fatigueLevel}</Text>
              </View>
            </View>
            <View style={styles.metricsRow}>
              <Text style={styles.metricText}>피로도: {c.fatigueScore}/100</Text>
              <Text style={styles.metricText}>Frequency: {c.frequency.toFixed(1)}</Text>
              <Text style={styles.metricText}>CTR: {c.ctr.toFixed(1)}%</Text>
              <Text style={styles.metricText}>활성일: {c.activeDays}일</Text>
            </View>
            <View style={styles.barContainer}>
              <Svg width={200} height={8}>
                <Rect x={0} y={0} width={200} height={8} rx={4} fill={colors.border} />
                <Rect x={0} y={0} width={c.fatigueScore * 2} height={8} rx={4} fill={levelColors.bar} />
              </Svg>
            </View>
            <Text style={styles.recommendation}>{c.recommendation}</Text>
          </View>
        )
      })}
    </View>
  )
}
