import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { InsightItem } from '@domain/entities/Report'

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
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
    color: '#1e293b',
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
  critical: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
  high: {
    backgroundColor: '#fff7ed',
    color: '#ea580c',
  },
  medium: {
    backgroundColor: '#fefce8',
    color: '#ca8a04',
  },
  low: {
    backgroundColor: '#f0f9ff',
    color: '#0284c7',
  },
  description: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
    marginBottom: 6,
  },
  typeLabel: {
    fontSize: 8,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
})

interface InsightCardProps {
  insight: InsightItem
}

export function InsightCard({ insight }: InsightCardProps) {
  const getBadgeStyles = () => {
    switch (insight.importance) {
      case 'critical':
        return [styles.badge, styles.critical]
      case 'high':
        return [styles.badge, styles.high]
      case 'medium':
        return [styles.badge, styles.medium]
      case 'low':
        return [styles.badge, styles.low]
      default:
        return [styles.badge, styles.medium]
    }
  }

  const getBadgeTextStyles = () => {
    switch (insight.importance) {
      case 'critical':
        return [styles.badgeText, styles.critical]
      case 'high':
        return [styles.badgeText, styles.high]
      case 'medium':
        return [styles.badgeText, styles.medium]
      case 'low':
        return [styles.badgeText, styles.low]
      default:
        return [styles.badgeText, styles.medium]
    }
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
