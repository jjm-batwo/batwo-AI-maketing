import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import { baseStyles, formatNumber, formatCurrency, formatDate, formatPercent } from './BaseReportTemplate'
import { MetricCard } from '../components/MetricCard'
import { BarChart } from '../components/BarChart'

// ========================================
// Daily Report Specific Styles
// ========================================

const styles = StyleSheet.create({
  ...baseStyles,
  summarySection: {
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  comparisonSection: {
    marginBottom: 20,
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  comparisonTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 12,
  },
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  comparisonLabel: {
    fontSize: 10,
    color: '#78350f',
  },
  comparisonValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
  },
  increaseText: {
    color: '#16a34a',
  },
  decreaseText: {
    color: '#dc2626',
  },
  highlightBox: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  highlightText: {
    fontSize: 11,
    color: '#1e40af',
    lineHeight: 1.6,
  },
})

// ========================================
// Daily Report Template
// ========================================

interface DailyReportTemplateProps {
  report: ReportDTO
}

export function DailyReportTemplate({ report }: DailyReportTemplateProps) {
  const { summaryMetrics, sections, dateRange } = report

  // Calculate day-over-day changes (mock for now - would need previous day data)
  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0
    return ((current - previous) / previous) * 100
  }

  // Mock previous day metrics (in real implementation, fetch from API)
  const previousMetrics = {
    impressions: summaryMetrics.totalImpressions * 0.9,
    clicks: summaryMetrics.totalClicks * 0.95,
    conversions: summaryMetrics.totalConversions * 0.85,
    spend: summaryMetrics.totalSpend * 0.92,
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>일간 성과 보고서</Text>
          <Text style={styles.subtitle}>바투 AI 마케팅 솔루션 | 데일리 리포트</Text>
          <Text style={styles.dateRange}>{formatDate(dateRange.startDate)}</Text>
        </View>

        {/* Daily Summary */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>오늘의 성과</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              label="총 노출"
              value={formatNumber(summaryMetrics.totalImpressions)}
            />
            <MetricCard
              label="총 클릭"
              value={formatNumber(summaryMetrics.totalClicks)}
            />
            <MetricCard
              label="총 전환"
              value={formatNumber(summaryMetrics.totalConversions)}
            />
            <MetricCard
              label="총 지출"
              value={formatCurrency(summaryMetrics.totalSpend)}
            />
            <MetricCard
              label="총 매출"
              value={formatCurrency(summaryMetrics.totalRevenue)}
            />
            <MetricCard
              label="ROAS"
              value={`${summaryMetrics.overallROAS.toFixed(2)}x`}
            />
            <MetricCard
              label="평균 CTR"
              value={formatPercent(summaryMetrics.averageCTR)}
            />
            <MetricCard
              label="평균 CVR"
              value={formatPercent(summaryMetrics.averageCVR)}
            />
          </View>
        </View>

        {/* Day-over-Day Comparison */}
        <View style={styles.comparisonSection}>
          <Text style={styles.comparisonTitle}>전일 대비 변화</Text>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>노출</Text>
            <Text
              style={[
                styles.comparisonValue,
                calculateChange(summaryMetrics.totalImpressions, previousMetrics.impressions) > 0
                  ? styles.increaseText
                  : styles.decreaseText,
              ]}
            >
              {calculateChange(summaryMetrics.totalImpressions, previousMetrics.impressions) > 0
                ? '▲'
                : '▼'}{' '}
              {formatPercent(
                Math.abs(
                  calculateChange(summaryMetrics.totalImpressions, previousMetrics.impressions)
                )
              )}
            </Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>클릭</Text>
            <Text
              style={[
                styles.comparisonValue,
                calculateChange(summaryMetrics.totalClicks, previousMetrics.clicks) > 0
                  ? styles.increaseText
                  : styles.decreaseText,
              ]}
            >
              {calculateChange(summaryMetrics.totalClicks, previousMetrics.clicks) > 0 ? '▲' : '▼'}{' '}
              {formatPercent(
                Math.abs(calculateChange(summaryMetrics.totalClicks, previousMetrics.clicks))
              )}
            </Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>전환</Text>
            <Text
              style={[
                styles.comparisonValue,
                calculateChange(summaryMetrics.totalConversions, previousMetrics.conversions) > 0
                  ? styles.increaseText
                  : styles.decreaseText,
              ]}
            >
              {calculateChange(summaryMetrics.totalConversions, previousMetrics.conversions) > 0
                ? '▲'
                : '▼'}{' '}
              {formatPercent(
                Math.abs(
                  calculateChange(summaryMetrics.totalConversions, previousMetrics.conversions)
                )
              )}
            </Text>
          </View>

          <View style={styles.comparisonRow}>
            <Text style={styles.comparisonLabel}>지출</Text>
            <Text
              style={[
                styles.comparisonValue,
                calculateChange(summaryMetrics.totalSpend, previousMetrics.spend) > 0
                  ? styles.decreaseText
                  : styles.increaseText,
              ]}
            >
              {calculateChange(summaryMetrics.totalSpend, previousMetrics.spend) > 0 ? '▲' : '▼'}{' '}
              {formatPercent(
                Math.abs(calculateChange(summaryMetrics.totalSpend, previousMetrics.spend))
              )}
            </Text>
          </View>
        </View>

        {/* Top Performing Campaigns */}
        {sections.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.sectionTitle}>주요 캠페인 성과</Text>
            <BarChart
              title=""
              data={sections
                .filter((s) => s.metrics?.conversions)
                .sort((a, b) => (b.metrics?.conversions || 0) - (a.metrics?.conversions || 0))
                .slice(0, 5)
                .map((s) => ({
                  label: s.title.substring(0, 20),
                  value: s.metrics?.conversions || 0,
                  color: '#3b82f6',
                }))
              }
              formatValue={(v) => formatNumber(v)}
            />
          </View>
        )}

        {/* Key Highlights */}
        <View style={styles.highlightBox}>
          <Text style={styles.highlightText}>
            📊 오늘의 하이라이트:{'\n'}
            {summaryMetrics.totalConversions > 0
              ? `• 총 ${formatNumber(summaryMetrics.totalConversions)}건의 전환 달성\n`
              : ''}
            {summaryMetrics.overallROAS > 1
              ? `• ROAS ${summaryMetrics.overallROAS.toFixed(2)}x로 목표 초과 달성\n`
              : ''}
            {summaryMetrics.averageCTR > 1
              ? `• 클릭률 ${formatPercent(summaryMetrics.averageCTR)}로 양호한 성과\n`
              : ''}
            • 활성 캠페인 {sections.length}개 운영 중
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </Text>
          <Text style={styles.footerText}>바투 AI 마케팅 | 일간 보고서</Text>
        </View>
      </Page>
    </Document>
  )
}
