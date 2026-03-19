import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { InsightItem } from '@domain/entities/Report'
import { colors, importanceColors } from '../design-tokens'

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textPrimary,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 1.5,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 8,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
})

interface InsightCardProps {
  insight: InsightItem
}

export function InsightCard({ insight }: InsightCardProps) {
  const importanceKey = insight.importance as keyof typeof importanceColors
  const badgeColors = importanceColors[importanceKey] ?? importanceColors.medium

  const getBadgeStyles = () => {
    return [styles.badge, { backgroundColor: badgeColors.bg }]
  }

  const getBadgeTextStyles = () => {
    return [styles.badgeText, { color: badgeColors.text }]
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{insight.title}</Text>
        <View style={getBadgeStyles()}>
          <Text style={getBadgeTextStyles()}>{insight.importance}</Text>
        </View>
      </View>
      <Text style={styles.description}>{insight.description}</Text>
      <Text style={styles.typeLabel}>{insight.type}</Text>
    </View>
  )
}
