import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import { BarChart } from '../components/BarChart'
import { MetricCard } from '../components/MetricCard'
import { InsightCard } from '../components/InsightCard'
import { ActionItemCard } from '../components/ActionItemCard'
import { PDF_FONT_FAMILY, PDF_MONO_FONT_FAMILY, colors, gradeColors, confidenceColors, letterSpacing } from '../design-tokens'

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.bgCard,
    padding: 24,
    fontFamily: PDF_FONT_FAMILY,
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.blue,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dateRange: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  summarySection: {
    marginBottom: 16,
    backgroundColor: colors.slate50,
    padding: 12,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  metricCard: {
    width: '30%',
    backgroundColor: colors.bgCard,
    padding: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: PDF_MONO_FONT_FAMILY,
    letterSpacing: letterSpacing.wide,
  },
  campaignSection: {
    marginBottom: 12,
  },
  campaignCard: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  campaignTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
    color: colors.textSecondary,
  },
  campaignMetricValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.slate700,
    fontFamily: PDF_MONO_FONT_FAMILY,
    letterSpacing: letterSpacing.wide,
  },
  insightsSection: {
    marginBottom: 12,
    backgroundColor: colors.infoSectionBg,
    padding: 12,
    borderRadius: 6,
  },
  insightCard: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.infoSectionBorder,
  },
  insightText: {
    fontSize: 11,
    color: colors.infoSectionText,
    marginBottom: 8,
    lineHeight: 1.5,
  },
  recommendationTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.infoSectionText,
    marginBottom: 6,
  },
  recommendationItem: {
    fontSize: 10,
    color: colors.blue,
    marginBottom: 4,
    paddingLeft: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 24,
    right: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: colors.textMuted,
  },
  executiveSummary: {
    marginBottom: 16,
    backgroundColor: colors.slate50,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.blue,
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  gradeExcellent: {
    backgroundColor: gradeColors.excellent.bg,
  },
  gradeGood: {
    backgroundColor: gradeColors.good.bg,
  },
  gradeAverage: {
    backgroundColor: gradeColors.average.bg,
  },
  gradeBelowAverage: {
    backgroundColor: gradeColors.below_average.bg,
  },
  gradePoor: {
    backgroundColor: gradeColors.poor.bg,
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gradeTextExcellent: {
    color: gradeColors.excellent.text,
  },
  gradeTextGood: {
    color: gradeColors.good.text,
  },
  gradeTextAverage: {
    color: gradeColors.average.text,
  },
  gradeTextBelowAverage: {
    color: gradeColors.below_average.text,
  },
  gradeTextPoor: {
    color: gradeColors.poor.text,
  },
  extendedSection: {
    marginBottom: 12,
  },
  benchmarkSection: {
    marginBottom: 12,
    backgroundColor: colors.skyBg,
    padding: 12,
    borderRadius: 6,
  },
  scoreDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.blue,
    textAlign: 'center',
    marginVertical: 12,
    fontFamily: PDF_MONO_FONT_FAMILY,
    letterSpacing: letterSpacing.wide,
  },
  gapItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.bgCard,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.yellow,
  },
  gapMetric: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  gapText: {
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  gapSuggestion: {
    fontSize: 9,
    color: colors.blue,
  },
  forecastTable: {
    marginTop: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: colors.slate100,
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 9,
    color: colors.textSecondary,
    padding: 4,
  },
  tableCellBold: {
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  confidenceBadge: {
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  highConfidence: {
    backgroundColor: confidenceColors.high.bg,
    color: confidenceColors.high.text,
  },
  mediumConfidence: {
    backgroundColor: confidenceColors.medium.bg,
    color: confidenceColors.medium.text,
  },
  lowConfidence: {
    backgroundColor: confidenceColors.low.bg,
    color: confidenceColors.low.text,
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
  return new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원'
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

  // Helper to get grade styles
  const getGradeStyles = (grade: string) => {
    switch (grade) {
      case 'excellent':
        return {
          badge: [styles.gradeBadge, styles.gradeExcellent],
          text: [styles.gradeText, styles.gradeTextExcellent],
          label: '탁월',
        }
      case 'good':
        return {
          badge: [styles.gradeBadge, styles.gradeGood],
          text: [styles.gradeText, styles.gradeTextGood],
          label: '우수',
        }
      case 'average':
        return {
          badge: [styles.gradeBadge, styles.gradeAverage],
          text: [styles.gradeText, styles.gradeTextAverage],
          label: '보통',
        }
      case 'below_average':
        return {
          badge: [styles.gradeBadge, styles.gradeBelowAverage],
          text: [styles.gradeText, styles.gradeTextBelowAverage],
          label: '개선 필요',
        }
      case 'poor':
        return {
          badge: [styles.gradeBadge, styles.gradePoor],
          text: [styles.gradeText, styles.gradeTextPoor],
          label: '부족',
        }
      default:
        return {
          badge: [styles.gradeBadge, styles.gradeAverage],
          text: [styles.gradeText, styles.gradeTextAverage],
          label: '평가 없음',
        }
    }
  }

  // Extract benchmark comparison if exists
  const benchmarkInsight = aiInsights.find((i) => i.benchmarkComparison)
  const benchmark = benchmarkInsight?.benchmarkComparison

  // Collect all extended insights
  const allInsights = aiInsights.flatMap((i) => i.insights || [])
  const allActionItems = aiInsights.flatMap((i) => i.actionItems || [])
  const allForecasts = aiInsights.flatMap((i) => i.forecast || [])

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

        {/* Executive Summary with Grade */}
        {benchmark && (
          <View style={styles.executiveSummary}>
            <Text style={styles.sectionTitle}>종합 평가</Text>
            <View style={getGradeStyles(benchmark.grade).badge}>
              <Text style={getGradeStyles(benchmark.grade).text}>
                {getGradeStyles(benchmark.grade).label}
              </Text>
            </View>
            <Text style={styles.scoreDisplay}>{benchmark.overallScore}점</Text>
            <Text style={styles.insightText}>업계: {benchmark.industry}</Text>
          </View>
        )}

        {/* Summary Metrics with Visual Indicators */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>성과 요약</Text>
          <View style={styles.metricsGrid}>
            <MetricCard label="총 노출" value={formatNumber(summaryMetrics.totalImpressions)} />
            <MetricCard label="총 클릭" value={formatNumber(summaryMetrics.totalClicks)} />
            <MetricCard label="총 전환" value={formatNumber(summaryMetrics.totalConversions)} />
            <MetricCard label="총 지출" value={formatCurrency(summaryMetrics.totalSpend)} />
            <MetricCard label="총 매출" value={formatCurrency(summaryMetrics.totalRevenue)} />
            <MetricCard label="ROAS" value={`${summaryMetrics.overallROAS.toFixed(2)}x`} />
          </View>
        </View>

        {/* Performance Comparison Chart */}
        {sections.length > 0 && (
          <View style={styles.extendedSection}>
            <BarChart
              title="캠페인별 ROAS 비교"
              data={sections
                .filter((s) => s.metrics?.spend && s.metrics.revenue)
                .map((s) => ({
                  label: s.title.substring(0, 15),
                  value: s.metrics!.spend! > 0 ? s.metrics!.revenue! / s.metrics!.spend! : 0,
                  color: colors.blue,
                }))
                .slice(0, 5)}
              formatValue={(v) => `${v.toFixed(2)}x`}
            />
          </View>
        )}

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

        {/* Extended Insights Section */}
        {allInsights.length > 0 && (
          <View style={styles.extendedSection} wrap={false}>
            <Text style={styles.sectionTitle}>상세 인사이트</Text>
            {allInsights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </View>
        )}

        {/* Action Items Section */}
        {allActionItems.length > 0 && (
          <View style={styles.extendedSection} wrap={false}>
            <Text style={styles.sectionTitle}>실행 과제</Text>
            {allActionItems.map((item, index) => (
              <ActionItemCard key={index} item={item} />
            ))}
          </View>
        )}

        {/* Forecast Section */}
        {allForecasts.length > 0 && (
          <View style={styles.extendedSection} wrap={false}>
            <Text style={styles.sectionTitle}>성과 예측</Text>
            <View style={styles.forecastTable}>
              <View style={[styles.tableRow, styles.tableHeader]}>
                <Text style={[styles.tableCell, styles.tableCellBold, { width: '25%' }]}>
                  지표
                </Text>
                <Text style={[styles.tableCell, styles.tableCellBold, { width: '20%' }]}>
                  현재
                </Text>
                <Text style={[styles.tableCell, styles.tableCellBold, { width: '20%' }]}>
                  7일 예측
                </Text>
                <Text style={[styles.tableCell, styles.tableCellBold, { width: '20%' }]}>
                  30일 예측
                </Text>
                <Text style={[styles.tableCell, styles.tableCellBold, { width: '15%' }]}>
                  신뢰도
                </Text>
              </View>
              {allForecasts.map((forecast, index) => {
                const confidenceStyle =
                  forecast.confidence === 'high'
                    ? styles.highConfidence
                    : forecast.confidence === 'medium'
                      ? styles.mediumConfidence
                      : styles.lowConfidence

                return (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, { width: '25%' }]}>{forecast.metric}</Text>
                    <Text style={[styles.tableCell, { width: '20%' }]}>
                      {formatNumber(forecast.current)}
                    </Text>
                    <Text style={[styles.tableCell, { width: '20%' }]}>
                      {formatNumber(forecast.predicted7d)}
                    </Text>
                    <Text style={[styles.tableCell, { width: '20%' }]}>
                      {formatNumber(forecast.predicted30d)}
                    </Text>
                    <Text
                      style={[
                        styles.tableCell,
                        styles.confidenceBadge,
                        confidenceStyle,
                        { width: '15%' },
                      ]}
                    >
                      {forecast.confidence}
                    </Text>
                  </View>
                )
              })}
            </View>
          </View>
        )}

        {/* Benchmark Gaps */}
        {benchmark && benchmark.gaps.length > 0 && (
          <View style={styles.benchmarkSection} wrap={false}>
            <Text style={styles.sectionTitle}>업계 대비 개선점</Text>
            {benchmark.gaps.map((gap, index) => (
              <View key={index} style={styles.gapItem}>
                <Text style={styles.gapMetric}>{gap.metric}</Text>
                <Text style={styles.gapText}>차이: {gap.gap}</Text>
                <Text style={styles.gapSuggestion}>제안: {gap.suggestion}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI Insights */}
        {aiInsights.length > 0 && (
          <View style={styles.insightsSection} wrap={false}>
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
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>생성일: {new Date().toLocaleDateString('ko-KR')}</Text>
          <Text style={styles.footerText}>바투 AI 마케팅</Text>
        </View>
      </Page>
    </Document>
  )
}
