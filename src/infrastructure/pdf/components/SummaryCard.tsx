import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ChangeRate } from '@application/dto/report/EnhancedReportSections'
import { colors, PDF_MONO_FONT_FAMILY, letterSpacing } from '../design-tokens'

const styles = StyleSheet.create({
  card: {
    width: '18%',
    backgroundColor: colors.slate50,
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.blue,
  },
  label: {
    fontSize: 8,
    color: colors.textSecondary,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 3,
    fontFamily: PDF_MONO_FONT_FAMILY,
    letterSpacing: letterSpacing.wide,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  arrow: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  changeText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
})

function getChangeColor(change: ChangeRate): string {
  if (change.direction === 'flat') return colors.textSecondary
  if (change.direction === 'up') {
    return change.isPositive ? colors.positive : colors.negative
  }
  return change.isPositive ? colors.negative : colors.positive
}

function getArrow(change: ChangeRate): string {
  if (change.direction === 'up') return '▲'
  if (change.direction === 'down') return '▼'
  return '—'
}

function formatChange(change: ChangeRate): string {
  const sign = change.direction === 'up' ? '+' : change.direction === 'down' ? '' : ''
  return `${sign}${change.value.toFixed(1)}%`
}

interface SummaryCardProps {
  label: string
  value: string
  change: ChangeRate
}

export function SummaryCard({ label, value, change }: SummaryCardProps) {
  const color = getChangeColor(change)
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.changeRow}>
        <Text style={[styles.arrow, { color }]}>{getArrow(change)}</Text>
        <Text style={[styles.changeText, { color }]}>{formatChange(change)}</Text>
      </View>
    </View>
  )
}
