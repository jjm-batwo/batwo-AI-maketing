import React from 'react'
import { View, Text, StyleSheet } from '@react-pdf/renderer'
import type { FunnelStageItem } from '@application/dto/report/EnhancedReportSections'

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  stage: {
    padding: 12,
    marginBottom: 4,
    borderRadius: 4,
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  budgetRatio: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#475569',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metric: {
    fontSize: 9,
    color: '#475569',
  },
  metricValue: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
})

const STAGE_COLORS: Record<string, string> = {
  tofu: '#dbeafe',
  mofu: '#fef3c7',
  bofu: '#dcfce7',
  auto: '#f3e8ff',
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원'
}

interface FunnelChartProps {
  stages: FunnelStageItem[]
  totalBudget: number
}

export function FunnelChart({ stages }: FunnelChartProps) {
  if (stages.length === 0) return null

  return (
    <View style={styles.container}>
      {stages.map((s) => (
        <View key={s.stage} style={[styles.stage, { backgroundColor: STAGE_COLORS[s.stage] ?? '#f1f5f9' }]}>
          <View style={styles.stageHeader}>
            <Text style={styles.stageLabel}>{s.stageLabel}</Text>
            <Text style={styles.budgetRatio}>
              {s.budgetRatio.toFixed(1)}% ({s.campaignCount}개 캠페인)
            </Text>
          </View>
          <View style={styles.metricsRow}>
            <Text style={styles.metric}>지출: <Text style={styles.metricValue}>{formatCurrency(s.spend)}</Text></Text>
            <Text style={styles.metric}>전환: <Text style={styles.metricValue}>{s.conversions}건</Text></Text>
            <Text style={styles.metric}>ROAS: <Text style={styles.metricValue}>{s.roas.toFixed(2)}x</Text></Text>
            <Text style={styles.metric}>CTR: <Text style={styles.metricValue}>{s.ctr.toFixed(1)}%</Text></Text>
          </View>
        </View>
      ))}
    </View>
  )
}
