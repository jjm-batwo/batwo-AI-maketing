import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { ChangeRate } from '@application/dto/report/EnhancedReportSections'

const styles = StyleSheet.create({
  card: {
    width: '30%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 10,
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

function formatChange(change: ChangeRate): string {
  const arrow = change.direction === 'up' ? '+' : change.direction === 'down' ? '' : ''
  return `${arrow}${change.value.toFixed(1)}%`
}

interface SummaryCardProps {
  label: string
  value: string
  change: ChangeRate
}

export function SummaryCard({ label, value, change }: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.changeRow}>
        <Text style={[styles.changeText, { color: getChangeColor(change) }]}>
          {formatChange(change)}
        </Text>
      </View>
    </View>
  )
}
