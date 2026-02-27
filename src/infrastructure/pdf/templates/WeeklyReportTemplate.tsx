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
import { BarChart } from '../components/BarChart'
import { MetricCard } from '../components/MetricCard'
import { InsightCard } from '../components/InsightCard'
import { ActionItemCard } from '../components/ActionItemCard'
import { PDF_FONT_FAMILY } from './BaseReportTemplate'

const shouldUseRemotePdfFont =
  process.env.NODE_ENV !== 'test' &&
  process.env.DISABLE_REMOTE_PDF_FONT !== 'true'

if (shouldUseRemotePdfFont) {
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
}

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    fontFamily: PDF_FONT_FAMILY,
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
  executiveSummary: {
    marginBottom: 30,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  gradeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  gradeExcellent: {
    backgroundColor: '#dcfce7',
  },
  gradeGood: {
    backgroundColor: '#dbeafe',
  },
  gradeAverage: {
    backgroundColor: '#fef3c7',
  },
  gradeBelowAverage: {
    backgroundColor: '#fed7aa',
  },
  gradePoor: {
    backgroundColor: '#fee2e2',
  },
  gradeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  gradeTextExcellent: {
    color: '#16a34a',
  },
  gradeTextGood: {
    color: '#2563eb',
  },
  gradeTextAverage: {
    color: '#ca8a04',
  },
  gradeTextBelowAverage: {
    color: '#ea580c',
  },
  gradeTextPoor: {
    color: '#dc2626',
  },
  extendedSection: {
    marginBottom: 24,
  },
  benchmarkSection: {
    marginBottom: 24,
    backgroundColor: '#f0f9ff',
    padding: 20,
    borderRadius: 8,
  },
  scoreDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563eb',
    textAlign: 'center',
    marginVertical: 12,
  },
  gapItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  gapMetric: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  gapText: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 4,
  },
  gapSuggestion: {
    fontSize: 9,
    color: '#3b82f6',
  },
  forecastTable: {
    marginTop: 12,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
  },
  tableCell: {
    fontSize: 9,
    color: '#475569',
    padding: 4,
  },
  tableCellBold: {
    fontWeight: 'bold',
    color: '#1e293b',
  },
  confidenceBadge: {
    fontSize: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
  },
  highConfidence: {
    backgroundColor: '#dcfce7',
    color: '#16a34a',
  },
  mediumConfidence: {
    backgroundColor: '#fef3c7',
    color: '#ca8a04',
  },
  lowConfidence: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
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
                  value:
                    s.metrics!.spend! > 0 ? s.metrics!.revenue! / s.metrics!.spend! : 0,
                  color: '#3b82f6',
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </Text>
          <Text style={styles.footerText}>바투 AI 마케팅</Text>
        </View>
      </Page>

      {/* Page 2: Extended Insights */}
      {(allInsights.length > 0 || allActionItems.length > 0 || allForecasts.length > 0) && (
        <Page size="A4" style={styles.page}>
          {/* Extended Insights Section */}
          {allInsights.length > 0 && (
            <View style={styles.extendedSection}>
              <Text style={styles.sectionTitle}>상세 인사이트</Text>
              {allInsights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </View>
          )}

          {/* Action Items Section */}
          {allActionItems.length > 0 && (
            <View style={styles.extendedSection}>
              <Text style={styles.sectionTitle}>실행 과제</Text>
              {allActionItems.map((item, index) => (
                <ActionItemCard key={index} item={item} />
              ))}
            </View>
          )}

          {/* Forecast Section */}
          {allForecasts.length > 0 && (
            <View style={styles.extendedSection}>
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
                      <Text style={[styles.tableCell, { width: '25%' }]}>
                        {forecast.metric}
                      </Text>
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
            <View style={styles.benchmarkSection}>
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

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              생성일: {new Date().toLocaleDateString('ko-KR')}
            </Text>
            <Text style={styles.footerText}>바투 AI 마케팅</Text>
          </View>
        </Page>
      )}

      {/* Page 3: AI Insights (Legacy) */}
      {aiInsights.length > 0 && (
        <Page size="A4" style={styles.page}>
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

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              생성일: {new Date().toLocaleDateString('ko-KR')}
            </Text>
            <Text style={styles.footerText}>바투 AI 마케팅</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
