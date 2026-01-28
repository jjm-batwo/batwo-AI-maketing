import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ActionItem } from '@domain/entities/Report'

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  highPriority: {
    borderLeftColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  mediumPriority: {
    borderLeftColor: '#f59e0b',
    backgroundColor: '#fffbeb',
  },
  lowPriority: {
    borderLeftColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
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
  highText: {
    color: '#dc2626',
  },
  mediumText: {
    color: '#f59e0b',
  },
  lowText: {
    color: '#3b82f6',
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 8,
    color: '#475569',
    textTransform: 'uppercase',
  },
  action: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  impact: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  deadline: {
    fontSize: 8,
    color: '#94a3b8',
  },
})

interface ActionItemCardProps {
  item: ActionItem
}

export function ActionItemCard({ item }: ActionItemCardProps) {
  const getCardStyle = () => {
    switch (item.priority) {
      case 'high':
        return [styles.card, styles.highPriority]
      case 'medium':
        return [styles.card, styles.mediumPriority]
      case 'low':
        return [styles.card, styles.lowPriority]
      default:
        return [styles.card, styles.mediumPriority]
    }
  }

  const getPriorityTextStyle = () => {
    switch (item.priority) {
      case 'high':
        return [styles.priorityText, styles.highText]
      case 'medium':
        return [styles.priorityText, styles.mediumText]
      case 'low':
        return [styles.priorityText, styles.lowText]
      default:
        return [styles.priorityText, styles.mediumText]
    }
  }

  return (
    <View style={getCardStyle()}>
      <View style={styles.header}>
        <View style={styles.priorityBadge}>
          <Text style={getPriorityTextStyle()}>{item.priority}</Text>
        </View>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.action}>{item.action}</Text>
      <Text style={styles.impact}>예상 효과: {item.expectedImpact}</Text>
      {item.deadline && <Text style={styles.deadline}>기한: {item.deadline}</Text>}
    </View>
  )
}
