import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'

// Noto Sans KR 폰트 등록 (한글 지원)
Font.register({
  family: 'NotoSansKR',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-400-normal.ttf',
      fontWeight: 'normal',
    },
    {
      src: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-kr@latest/korean-700-normal.ttf',
      fontWeight: 'bold',
    },
  ],
})

// Hyphenation callback 비활성화 (한글 줄바꿈 개선)
Font.registerHyphenationCallback((word) => [word])

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: 'NotoSansKR',
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  dateRange: {
    fontSize: 14,
    color: '#475569',
    marginTop: 8,
  },
  summarySection: {
    marginBottom: 30,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    width: '30%',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  campaignSection: {
    marginBottom: 24,
  },
  campaignCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  campaignTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  campaignMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  campaignMetric: {
    width: '18%',
  },
  campaignMetricLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  campaignMetricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
  },
  insightsSection: {
    marginBottom: 24,
    backgroundColor: '#eff6ff',
    padding: 20,
    borderRadius: 8,
  },
  insightCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe',
  },
  insightText: {
    fontSize: 11,
    color: '#1e40af',
    marginBottom: 8,
    lineHeight: 1.5,
  },
  recommendationTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6,
  },
  recommendationItem: {
    fontSize: 10,
    color: '#3b82f6',
    marginBottom: 4,
    paddingLeft: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: '#94a3b8',
  },
})

interface WeeklyReportTemplateProps {
  report: ReportDTO
}

// Format helpers
function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num))
}

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(num)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function formatPercent(num: number): string {
  return `${num.toFixed(2)}%`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function WeeklyReportTemplate({ report }: WeeklyReportTemplateProps) {
  const { summaryMetrics, sections, aiInsights, dateRange } = report

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>주간 마케팅 리포트</Text>
          <Text style={styles.subtitle}>바투 AI 마케팅 솔루션</Text>
          <Text style={styles.dateRange}>
            {formatDate(dateRange.startDate)} ~ {formatDate(dateRange.endDate)}
          </Text>
        </View>

        {/* Summary Metrics */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>성과 요약</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>총 노출</Text>
              <Text style={styles.metricValue}>
                {formatNumber(summaryMetrics.totalImpressions)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>총 클릭</Text>
              <Text style={styles.metricValue}>
                {formatNumber(summaryMetrics.totalClicks)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>총 전환</Text>
              <Text style={styles.metricValue}>
                {formatNumber(summaryMetrics.totalConversions)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>총 지출</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(summaryMetrics.totalSpend)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>총 매출</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(summaryMetrics.totalRevenue)}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>ROAS</Text>
              <Text style={styles.metricValue}>
                {summaryMetrics.overallROAS.toFixed(2)}x
              </Text>
            </View>
          </View>
        </View>

        {/* Campaign Details */}
        <View style={styles.campaignSection}>
          <Text style={styles.sectionTitle}>캠페인별 성과</Text>
          {sections.map((section, index) => (
            <View key={index} style={styles.campaignCard}>
              <Text style={styles.campaignTitle}>{section.title}</Text>
              {section.metrics && (
                <View style={styles.campaignMetrics}>
                  <View style={styles.campaignMetric}>
                    <Text style={styles.campaignMetricLabel}>노출</Text>
                    <Text style={styles.campaignMetricValue}>
                      {formatNumber(section.metrics.impressions || 0)}
                    </Text>
                  </View>
                  <View style={styles.campaignMetric}>
                    <Text style={styles.campaignMetricLabel}>클릭</Text>
                    <Text style={styles.campaignMetricValue}>
                      {formatNumber(section.metrics.clicks || 0)}
                    </Text>
                  </View>
                  <View style={styles.campaignMetric}>
                    <Text style={styles.campaignMetricLabel}>전환</Text>
                    <Text style={styles.campaignMetricValue}>
                      {formatNumber(section.metrics.conversions || 0)}
                    </Text>
                  </View>
                  <View style={styles.campaignMetric}>
                    <Text style={styles.campaignMetricLabel}>지출</Text>
                    <Text style={styles.campaignMetricValue}>
                      {formatCurrency(section.metrics.spend || 0)}
                    </Text>
                  </View>
                  <View style={styles.campaignMetric}>
                    <Text style={styles.campaignMetricLabel}>매출</Text>
                    <Text style={styles.campaignMetricValue}>
                      {formatCurrency(section.metrics.revenue || 0)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>AI 인사이트</Text>
            {aiInsights.map((insight, index) => (
              <View key={index} style={styles.insightCard}>
                <Text style={styles.insightText}>{insight.insight}</Text>
                {insight.recommendations.length > 0 && (
                  <>
                    <Text style={styles.recommendationTitle}>추천 액션:</Text>
                    {insight.recommendations.map((rec, recIndex) => (
                      <Text key={recIndex} style={styles.recommendationItem}>
                        • {rec}
                      </Text>
                    ))}
                  </>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </Text>
          <Text style={styles.footerText}>바투 AI 마케팅</Text>
        </View>
      </Page>
    </Document>
  )
}
