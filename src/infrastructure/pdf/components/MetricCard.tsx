import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'

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
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  changeText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  positive: {
    color: '#10b981',
  },
  negative: {
    color: '#ef4444',
  },
  neutral: {
    color: '#64748b',
  },
  trend: {
    fontSize: 10,
  },
})

interface MetricCardProps {
  label: string
  value: string
  change?: number
  trend?: 'up' | 'down' | 'stable'
}

export function MetricCard({ label, value, change, trend }: MetricCardProps) {
  const getTrendStyle = () => {
    if (!trend || trend === 'stable') return styles.neutral
    return trend === 'up' ? styles.positive : styles.negative
  }

  const getTrendArrow = () => {
    if (!trend || trend === 'stable') return '→'
    return trend === 'up' ? '↑' : '↓'
  }

  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value}</Text>
        {trend && <Text style={[styles.trend, getTrendStyle()]}>{getTrendArrow()}</Text>}
      </View>
      {change !== undefined && (
        <View style={styles.changeContainer}>
          <Text style={[styles.changeText, getTrendStyle()]}>
            {change > 0 ? '+' : ''}
            {change.toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  )
}
