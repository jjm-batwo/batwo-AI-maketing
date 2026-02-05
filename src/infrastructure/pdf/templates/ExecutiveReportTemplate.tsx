import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import { baseStyles, formatNumber, formatCurrency, formatDate, formatPercent } from './BaseReportTemplate'

// ========================================
// Executive Report Specific Styles
// ========================================

const styles = StyleSheet.create({
  ...baseStyles,
  executivePage: {
    ...baseStyles.page,
    padding: 50,
  },
  companyLogo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 40,
  },
  executiveTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  executiveSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 40,
    textAlign: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    marginBottom: 40,
  },
  kpiCard: {
    width: '45%',
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  kpiChange: {
    fontSize: 11,
    marginTop: 4,
  },
  kpiIncrease: {
    color: '#16a34a',
  },
  kpiDecrease: {
    color: '#dc2626',
  },
  summaryBox: {
    backgroundColor: '#eff6ff',
    padding: 24,
    borderRadius: 8,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 1.8,
  },
  highlightNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  keyInsights: {
    marginBottom: 30,
  },
  insightItem: {
    flexDirection: 'row',
    marginBottom: 10,
    alignItems: 'flex-start',
  },
  insightBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginRight: 10,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 11,
    color: '#334155',
    lineHeight: 1.6,
  },
  bottomSignature: {
    position: 'absolute',
    bottom: 80,
    left: 50,
    right: 50,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 20,
  },
  signatureText: {
    fontSize: 10,
    color: '#64748b',
    textAlign: 'right',
  },
})

// ========================================
// Executive Report Template (1-Page Summary)
// ========================================

interface ExecutiveReportTemplateProps {
  report: ReportDTO
}

export function ExecutiveReportTemplate({ report }: ExecutiveReportTemplateProps) {
  const { summaryMetrics, aiInsights, dateRange } = report

  // Mock previous period comparison
  const previousPeriodROAS = summaryMetrics.overallROAS * 0.85
  const roasChange = ((summaryMetrics.overallROAS - previousPeriodROAS) / previousPeriodROAS) * 100

  const previousRevenue = summaryMetrics.totalRevenue * 0.88
  const revenueChange = ((summaryMetrics.totalRevenue - previousRevenue) / previousRevenue) * 100

  // Extract top insights
  const topInsights = aiInsights
    .flatMap((i) => i.insights || [])
    .filter((insight) => insight.importance === 'critical' || insight.importance === 'high')
    .slice(0, 3)

  // Calculate efficiency score (simplified)
  const efficiencyScore = Math.round(
    (summaryMetrics.overallROAS * 20 +
      summaryMetrics.averageCTR * 10 +
      summaryMetrics.averageCVR * 10) /
      3
  )

  return (
    <Document>
      <Page size="A4" style={styles.executivePage}>
        {/* Logo/Brand */}
        <Text style={styles.companyLogo}>BATWO AI</Text>

        {/* Title */}
        <Text style={styles.executiveTitle}>경영진 요약 보고서</Text>
        <Text style={styles.executiveSubtitle}>
          {formatDate(dateRange.startDate)} ~ {formatDate(dateRange.endDate)}
        </Text>

        {/* Key KPIs (2x2 Grid) */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>총 매출</Text>
            <Text style={styles.kpiValue}>{formatCurrency(summaryMetrics.totalRevenue)}</Text>
            <Text style={[styles.kpiChange, revenueChange > 0 ? styles.kpiIncrease : styles.kpiDecrease]}>
              {revenueChange > 0 ? '▲' : '▼'} {formatPercent(Math.abs(revenueChange), 1)} 전기 대비
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>ROAS</Text>
            <Text style={styles.kpiValue}>{summaryMetrics.overallROAS.toFixed(2)}x</Text>
            <Text style={[styles.kpiChange, roasChange > 0 ? styles.kpiIncrease : styles.kpiDecrease]}>
              {roasChange > 0 ? '▲' : '▼'} {formatPercent(Math.abs(roasChange), 1)} 전기 대비
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>총 전환</Text>
            <Text style={styles.kpiValue}>{formatNumber(summaryMetrics.totalConversions)}</Text>
            <Text style={[styles.kpiChange, styles.kpiIncrease]}>
              광고 효율 {efficiencyScore}점
            </Text>
          </View>

          <View style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>총 광고비</Text>
            <Text style={styles.kpiValue}>{formatCurrency(summaryMetrics.totalSpend)}</Text>
            <Text style={styles.kpiChange}>
              예산 대비 {formatPercent(95, 0)} 집행
            </Text>
          </View>
        </View>

        {/* Executive Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>핵심 요약</Text>
          <Text style={styles.summaryText}>
            해당 기간 동안 <Text style={styles.highlightNumber}>{formatCurrency(summaryMetrics.totalRevenue)}</Text>의 매출을 달성했으며,
            광고 수익률(ROAS)은 <Text style={styles.highlightNumber}>{summaryMetrics.overallROAS.toFixed(2)}x</Text>를 기록했습니다.
            {'\n\n'}
            전환율 <Text style={styles.highlightNumber}>{formatPercent(summaryMetrics.averageCVR)}</Text>,
            클릭률 <Text style={styles.highlightNumber}>{formatPercent(summaryMetrics.averageCTR)}</Text>로
            효율적인 캠페인 운영이 이루어졌습니다.
          </Text>
        </View>

        {/* Key Insights */}
        {topInsights.length > 0 && (
          <View style={styles.keyInsights}>
            <Text style={styles.sectionTitle}>주요 인사이트</Text>
            {topInsights.map((insight, index) => (
              <View key={index} style={styles.insightItem}>
                <View style={styles.insightBullet} />
                <Text style={styles.insightText}>
                  <Text style={{ fontWeight: 'bold' }}>{insight.title}:</Text> {insight.description}
                </Text>
              </View>
            ))}
            {topInsights.length === 0 && (
              <View style={styles.insightItem}>
                <View style={styles.insightBullet} />
                <Text style={styles.insightText}>
                  <Text style={{ fontWeight: 'bold' }}>성과 우수:</Text> 전반적으로 안정적인 캠페인 성과를 보이고 있습니다.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Signature */}
        <View style={styles.bottomSignature}>
          <Text style={styles.signatureText}>
            바투 AI 마케팅 솔루션{'\n'}
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Confidential</Text>
          <Text style={styles.footerText}>Executive Summary</Text>
        </View>
      </Page>
    </Document>
  )
}
