import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ChangeRate } from '@application/dto/report/EnhancedReportSections'

const styles = StyleSheet.create({
  card: {
    width: '18%',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  label: {
    fontSize: 8,
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 3,
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
  if (change.direction === 'flat') return '#64748b'
  if (change.direction === 'up') {
    return change.isPositive ? '#16a34a' : '#dc2626'
  }
  return change.isPositive ? '#dc2626' : '#16a34a'
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
