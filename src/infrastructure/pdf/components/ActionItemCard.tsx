import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ActionItem } from '@domain/entities/Report'
import { colors, priorityColors } from '../design-tokens'

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.bgCard,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  highPriority: {
    borderLeftColor: priorityColors.high.border,
    backgroundColor: priorityColors.high.bg,
  },
  mediumPriority: {
    borderLeftColor: priorityColors.medium.border,
    backgroundColor: priorityColors.medium.bg,
  },
  lowPriority: {
    borderLeftColor: priorityColors.low.border,
    backgroundColor: priorityColors.low.bg,
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
    color: priorityColors.high.text,
  },
  mediumText: {
    color: priorityColors.medium.text,
  },
  lowText: {
    color: priorityColors.low.text,
  },
  categoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.slate100,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  action: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  impact: {
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  deadline: {
    fontSize: 8,
    color: colors.textMuted,
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
