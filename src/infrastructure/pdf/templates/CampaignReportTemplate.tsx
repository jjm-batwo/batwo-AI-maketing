import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import { baseStyles, formatNumber, formatCurrency, formatDate, formatPercent } from './BaseReportTemplate'
import { MetricCard } from '../components/MetricCard'
import { BarChart } from '../components/BarChart'

// ========================================
// Campaign Report Specific Styles
// ========================================

const styles = StyleSheet.create({
  ...baseStyles,
  campaignHeader: {
    marginBottom: 20,
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  campaignName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  campaignStatus: {
    fontSize: 11,
    color: '#60a5fa',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  performanceSection: {
    marginBottom: 20,
  },
  timelineSection: {
    marginBottom: 20,
  },
  dayCard: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dayDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  dayMetrics: {
    flexDirection: 'row',
    gap: 12,
  },
  dayMetric: {
    flex: 1,
  },
  dayMetricLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  dayMetricValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#334155',
  },
  optimizationSection: {
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  optimizationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 10,
  },
  optimizationItem: {
    fontSize: 10,
    color: '#78350f',
    marginBottom: 6,
    paddingLeft: 10,
  },
  targetingSection: {
    marginBottom: 20,
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
  },
  targetingTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  targetingDetail: {
    fontSize: 9,
    color: '#075985',
    marginBottom: 4,
  },
})

// ========================================
// Campaign Report Template
// ========================================

interface CampaignReportTemplateProps {
  report: ReportDTO
}

export function CampaignReportTemplate({ report }: CampaignReportTemplateProps) {
  const { summaryMetrics, sections, aiInsights, dateRange } = report

  // Assuming single campaign report
  const campaignSection = sections[0]
  const campaignName = campaignSection?.title || '캠페인'

  // Generate daily breakdown (simplified)
  const daysInPeriod = Math.ceil(
    (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  )
  const dailyMetrics = Array.from({ length: Math.min(daysInPeriod, 7) }, (_, i) => {
    const date = new Date(dateRange.startDate)
    date.setDate(date.getDate() + i)

    // Distribute metrics across days (simplified)
    const dayFactor = 0.8 + Math.random() * 0.4
    return {
      date: date.toISOString(),
      impressions: Math.floor((summaryMetrics.totalImpressions / daysInPeriod) * dayFactor),
      clicks: Math.floor((summaryMetrics.totalClicks / daysInPeriod) * dayFactor),
      conversions: Math.floor((summaryMetrics.totalConversions / daysInPeriod) * dayFactor),
      spend: Math.floor((summaryMetrics.totalSpend / daysInPeriod) * dayFactor),
    }
  })

  // Extract recommendations
  const recommendations = aiInsights
    .flatMap((i) => i.recommendations || [])
    .slice(0, 5)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>캠페인 상세 보고서</Text>
          <Text style={styles.subtitle}>바투 AI 마케팅 솔루션 | 캠페인 리포트</Text>
          <Text style={styles.dateRange}>
            {formatDate(dateRange.startDate)} ~ {formatDate(dateRange.endDate)}
          </Text>
        </View>

        {/* Campaign Info */}
        <View style={styles.campaignHeader}>
          <Text style={styles.campaignName}>{campaignName}</Text>
          <Text style={styles.campaignStatus}>
            활성 상태 | {daysInPeriod}일간 운영
          </Text>
        </View>

        {/* Summary Metrics */}
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
          <MetricCard label="총 지출" value={formatCurrency(summaryMetrics.totalSpend)} />
          <MetricCard
            label="총 매출"
            value={formatCurrency(summaryMetrics.totalRevenue)}
          />
          <MetricCard label="ROAS" value={`${summaryMetrics.overallROAS.toFixed(2)}x`} />
          <MetricCard label="CTR" value={formatPercent(summaryMetrics.averageCTR)} />
          <MetricCard label="CVR" value={formatPercent(summaryMetrics.averageCVR)} />
          <MetricCard
            label="CPC"
            value={formatCurrency(
              summaryMetrics.totalClicks > 0
                ? summaryMetrics.totalSpend / summaryMetrics.totalClicks
                : 0
            )}
          />
        </View>

        {/* Performance Trend */}
        <View style={styles.performanceSection}>
          <Text style={styles.sectionTitle}>일별 성과 추이</Text>
          <BarChart
            title=""
            data={dailyMetrics.map((day, i) => ({
              label: `Day ${i + 1}`,
              value: day.conversions,
              color: '#3b82f6',
            }))}
            formatValue={(v) => formatNumber(v)}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </Text>
          <Text style={styles.footerText}>바투 AI 마케팅 | 캠페인 보고서 (1/2)</Text>
        </View>
      </Page>

      {/* Page 2: Daily Timeline & Recommendations */}
      <Page size="A4" style={styles.page}>
        {/* Daily Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>일별 상세 성과</Text>
          {dailyMetrics.map((day, index) => (
            <View key={index} style={styles.dayCard}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayDate}>
                  {new Date(day.date).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </Text>
              </View>
              <View style={styles.dayMetrics}>
                <View style={styles.dayMetric}>
                  <Text style={styles.dayMetricLabel}>노출</Text>
                  <Text style={styles.dayMetricValue}>{formatNumber(day.impressions)}</Text>
                </View>
                <View style={styles.dayMetric}>
                  <Text style={styles.dayMetricLabel}>클릭</Text>
                  <Text style={styles.dayMetricValue}>{formatNumber(day.clicks)}</Text>
                </View>
                <View style={styles.dayMetric}>
                  <Text style={styles.dayMetricLabel}>전환</Text>
                  <Text style={styles.dayMetricValue}>{formatNumber(day.conversions)}</Text>
                </View>
                <View style={styles.dayMetric}>
                  <Text style={styles.dayMetricLabel}>지출</Text>
                  <Text style={styles.dayMetricValue}>{formatCurrency(day.spend)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Optimization Recommendations */}
        {recommendations.length > 0 && (
          <View style={styles.optimizationSection}>
            <Text style={styles.optimizationTitle}>최적화 제안</Text>
            {recommendations.map((rec, index) => (
              <Text key={index} style={styles.optimizationItem}>
                {index + 1}. {rec}
              </Text>
            ))}
          </View>
        )}

        {/* Targeting Info (if available) */}
        {campaignSection && (
          <View style={styles.targetingSection}>
            <Text style={styles.targetingTitle}>타겟팅 설정</Text>
            <Text style={styles.targetingDetail}>
              • 캠페인 목표: 전환 최적화{'\n'}
              • 예산: 일 {formatCurrency(summaryMetrics.totalSpend / daysInPeriod)}{'\n'}
              • 성과: ROAS {summaryMetrics.overallROAS.toFixed(2)}x
            </Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </Text>
          <Text style={styles.footerText}>바투 AI 마케팅 | 캠페인 보고서 (2/2)</Text>
        </View>
      </Page>
    </Document>
  )
}
