import React from 'react'
import { View, Text, StyleSheet, Svg, Rect } from '@react-pdf/renderer'
import type { CreativeFatigueItem } from '@application/dto/report/EnhancedReportSections'

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  item: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  healthy: { borderLeftColor: '#16a34a' },
  warning: { borderLeftColor: '#ca8a04' },
  critical: { borderLeftColor: '#dc2626' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
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
    color: '#64748b',
  },
  barContainer: {
    marginBottom: 4,
  },
  recommendation: {
    fontSize: 9,
    color: '#64748b',
  },
})

const LEVEL_COLORS = {
  healthy: { bg: '#f0fdf4', text: '#16a34a', bar: '#16a34a' },
  warning: { bg: '#fefce8', text: '#ca8a04', bar: '#ca8a04' },
  critical: { bg: '#fef2f2', text: '#dc2626', bar: '#dc2626' },
}

interface FatigueMatrixProps {
  creatives: CreativeFatigueItem[]
}

export function FatigueMatrix({ creatives }: FatigueMatrixProps) {
  if (creatives.length === 0) return null

  return (
    <View style={styles.container}>
      {creatives.map((c) => {
        const colors = LEVEL_COLORS[c.fatigueLevel]
        return (
          <View key={c.creativeId} style={[styles.item, styles[c.fatigueLevel]]}>
            <View style={styles.header}>
              <Text style={styles.name}>{c.name} ({c.format})</Text>
              <View style={[styles.badge, { backgroundColor: colors.bg }]}>
                <Text style={[styles.badgeText, { color: colors.text }]}>{c.fatigueLevel}</Text>
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
                <Rect x={0} y={0} width={200} height={8} rx={4} fill="#e2e8f0" />
                <Rect x={0} y={0} width={c.fatigueScore * 2} height={8} rx={4} fill={colors.bar} />
              </Svg>
            </View>
            <Text style={styles.recommendation}>{c.recommendation}</Text>
          </View>
        )
      })}
    </View>
  )
}
