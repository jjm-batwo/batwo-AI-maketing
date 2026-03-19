import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { RecommendedAction } from '@application/dto/report/EnhancedReportSections'
import { colors, priorityColors } from '../design-tokens'

const styles = StyleSheet.create({
  card: {
    marginBottom: 6,
    padding: 8,
    backgroundColor: colors.bgCard,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  highPriority: { borderLeftColor: priorityColors.high.border, backgroundColor: priorityColors.high.bg },
  mediumPriority: { borderLeftColor: priorityColors.medium.border, backgroundColor: priorityColors.medium.bg },
  lowPriority: { borderLeftColor: priorityColors.low.border, backgroundColor: priorityColors.low.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  highText: { color: priorityColors.high.text },
  mediumText: { color: priorityColors.medium.text },
  lowText: { color: priorityColors.low.text },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.slate100,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 8,
    color: colors.textSecondary,
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  impact: {
    fontSize: 9,
    color: colors.blue,
  },
})

const CATEGORY_LABELS: Record<string, string> = {
  budget: '예산',
  creative: '소재',
  targeting: '타겟팅',
  funnel: '퍼널',
  general: '일반',
}

const PRIORITY_STYLES = {
  high: { card: styles.highPriority, text: styles.highText },
  medium: { card: styles.mediumPriority, text: styles.mediumText },
  low: { card: styles.lowPriority, text: styles.lowText },
}

interface PriorityActionCardProps {
  action: RecommendedAction
}

export function PriorityActionCard({ action }: PriorityActionCardProps) {
  const pStyle = PRIORITY_STYLES[action.priority]

  return (
    <View style={[styles.card, pStyle.card]}>
      <View style={styles.header}>
        <View style={styles.priorityBadge}>
          <Text style={[styles.priorityText, pStyle.text]}>{action.priority}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{CATEGORY_LABELS[action.category] ?? action.category}</Text>
        </View>
      </View>
      <Text style={styles.title}>{action.title}</Text>
      <Text style={styles.description}>{action.description}</Text>
      <Text style={styles.impact}>{action.expectedImpact}</Text>
    </View>
  )
}
