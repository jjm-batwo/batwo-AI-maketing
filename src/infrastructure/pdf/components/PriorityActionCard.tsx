import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { RecommendedAction } from '@application/dto/report/EnhancedReportSections'

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  highPriority: { borderLeftColor: '#dc2626', backgroundColor: '#fef2f2' },
  mediumPriority: { borderLeftColor: '#ca8a04', backgroundColor: '#fffbeb' },
  lowPriority: { borderLeftColor: '#3b82f6', backgroundColor: '#eff6ff' },
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
  highText: { color: '#dc2626' },
  mediumText: { color: '#ca8a04' },
  lowText: { color: '#3b82f6' },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 8,
    color: '#475569',
  },
  title: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  description: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 4,
  },
  impact: {
    fontSize: 9,
    color: '#3b82f6',
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
