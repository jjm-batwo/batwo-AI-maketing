import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import { baseStyles, formatNumber, formatCurrency, formatDate, formatPercent } from './BaseReportTemplate'
import { MetricCard } from '../components/MetricCard'
import { BarChart } from '../components/BarChart'
import { InsightCard } from '../components/InsightCard'

// ========================================
// Monthly Report Specific Styles
// ========================================

const styles = StyleSheet.create({
  ...baseStyles,
  executiveSummary: {
    marginBottom: 24,
    backgroundColor: '#f8fafc',
    padding: 20,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  summarySection: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  goalSection: {
    marginBottom: 24,
    backgroundColor: '#fef3c7',
    padding: 16,
    borderRadius: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 12,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalLabel: {
    fontSize: 10,
    color: '#78350f',
    width: '40%',
  },
  goalBar: {
    flex: 1,
    height: 16,
    backgroundColor: '#fed7aa',
    borderRadius: 4,
    marginRight: 8,
    position: 'relative',
  },
  goalProgress: {
    height: 16,
    backgroundColor: '#f59e0b',
    borderRadius: 4,
  },
  goalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#92400e',
    width: '15%',
    textAlign: 'right',
  },
  trendSection: {
    marginBottom: 24,
  },
  weeklyBreakdown: {
    marginBottom: 24,
  },
  weekCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weekTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  weekMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekMetric: {
    width: '22%',
  },
  weekMetricLabel: {
    fontSize: 8,
    color: '#64748b',
  },
  weekMetricValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
  },
})

// ========================================
// Monthly Report Template
// ========================================

interface MonthlyReportTemplateProps {
  report: ReportDTO
}

export function MonthlyReportTemplate({ report }: MonthlyReportTemplateProps) {
  const { summaryMetrics, sections, aiInsights, dateRange } = report

  // Mock monthly goals (in real implementation, fetch from database)
  const monthlyGoals = {
    revenue: 10000000,
    conversions: 500,
    roas: 3.0,
    spend: 3000000,
  }

  const goalAchievement = {
    revenue: (summaryMetrics.totalRevenue / monthlyGoals.revenue) * 100,
    conversions: (summaryMetrics.totalConversions / monthlyGoals.conversions) * 100,
    roas: (summaryMetrics.overallROAS / monthlyGoals.roas) * 100,
    spend: (summaryMetrics.totalSpend / monthlyGoals.spend) * 100,
  }

  // Break down by weeks (simplified)
  const weeksInMonth = Math.ceil(sections.length / 4)
  const weeklyData = Array.from({ length: Math.min(weeksInMonth, 4) }, (_, i) => ({
    week: i + 1,
    sections: sections.slice(i * Math.ceil(sections.length / 4), (i + 1) * Math.ceil(sections.length / 4)),
  }))

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>월간 분석 보고서</Text>
          <Text style={styles.subtitle}>바투 AI 마케팅 솔루션 | 월간 리포트</Text>
          <Text style={styles.dateRange}>
            {formatDate(dateRange.startDate)} ~ {formatDate(dateRange.endDate)}
          </Text>
        </View>

        {/* Executive Summary */}
        <View style={styles.executiveSummary}>
          <Text style={styles.sectionTitle}>경영진 요약</Text>
          <Text style={{ fontSize: 11, color: '#475569', lineHeight: 1.6, marginBottom: 12 }}>
            {new Date(dateRange.startDate).toLocaleDateString('ko-KR', { month: 'long' })} 한 달간 총{' '}
            {formatCurrency(summaryMetrics.totalRevenue)}의 매출을 달성했으며, ROAS{' '}
            {summaryMetrics.overallROAS.toFixed(2)}x로 목표 대비{' '}
            {goalAchievement.roas > 100 ? '초과' : '미달'} 달성했습니다.
          </Text>
          <Text style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
            • 총 전환: {formatNumber(summaryMetrics.totalConversions)}건 (목표 대비{' '}
            {formatPercent(goalAchievement.conversions - 100, 1)}){'\n'}
            • 총 지출: {formatCurrency(summaryMetrics.totalSpend)} (예산 대비{' '}
            {formatPercent(goalAchievement.spend - 100, 1)}){'\n'}
            • 활성 캠페인: {sections.length}개
          </Text>
        </View>

        {/* Monthly Summary Metrics */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>월간 성과</Text>
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
            <MetricCard label="평균 CTR" value={formatPercent(summaryMetrics.averageCTR)} />
            <MetricCard label="평균 CVR" value={formatPercent(summaryMetrics.averageCVR)} />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </Text>
          <Text style={styles.footerText}>바투 AI 마케팅 | 월간 보고서 (1/3)</Text>
        </View>
      </Page>

      {/* Page 2: Goal Achievement & Trends */}
      <Page size="A4" style={styles.page}>
        {/* Goal Achievement */}
        <View style={styles.goalSection}>
          <Text style={styles.goalTitle}>월간 목표 달성률</Text>

          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>매출 목표</Text>
            <View style={styles.goalBar}>
              <View
                style={[
                  styles.goalProgress,
                  { width: `${Math.min(goalAchievement.revenue, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.goalValue}>{formatPercent(goalAchievement.revenue, 0)}</Text>
          </View>

          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>전환 목표</Text>
            <View style={styles.goalBar}>
              <View
                style={[
                  styles.goalProgress,
                  { width: `${Math.min(goalAchievement.conversions, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.goalValue}>{formatPercent(goalAchievement.conversions, 0)}</Text>
          </View>

          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>ROAS 목표</Text>
            <View style={styles.goalBar}>
              <View
                style={[
                  styles.goalProgress,
                  { width: `${Math.min(goalAchievement.roas, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.goalValue}>{formatPercent(goalAchievement.roas, 0)}</Text>
          </View>
        </View>

        {/* Campaign Performance Trend */}
        <View style={styles.trendSection}>
          <Text style={styles.sectionTitle}>캠페인별 성과 분석</Text>
          <BarChart
            title=""
            data={sections
              .filter((s) => s.metrics?.revenue)
              .sort((a, b) => (b.metrics?.revenue || 0) - (a.metrics?.revenue || 0))
              .slice(0, 8)
              .map((s) => ({
                label: s.title.substring(0, 15),
                value: s.metrics?.revenue || 0,
                color: '#3b82f6',
              }))}
            formatValue={(v) => formatCurrency(v)}
          />
        </View>

        {/* Weekly Breakdown */}
        <View style={styles.weeklyBreakdown}>
          <Text style={styles.sectionTitle}>주차별 성과</Text>
          {weeklyData.map((week) => {
            const weekMetrics = week.sections.reduce(
              (acc, section) => ({
                impressions: acc.impressions + (section.metrics?.impressions || 0),
                clicks: acc.clicks + (section.metrics?.clicks || 0),
                conversions: acc.conversions + (section.metrics?.conversions || 0),
                spend: acc.spend + (section.metrics?.spend || 0),
              }),
              { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
            )

            return (
              <View key={week.week} style={styles.weekCard}>
                <Text style={styles.weekTitle}>{week.week}주차</Text>
                <View style={styles.weekMetrics}>
                  <View style={styles.weekMetric}>
                    <Text style={styles.weekMetricLabel}>노출</Text>
                    <Text style={styles.weekMetricValue}>
                      {formatNumber(weekMetrics.impressions)}
                    </Text>
                  </View>
                  <View style={styles.weekMetric}>
                    <Text style={styles.weekMetricLabel}>클릭</Text>
                    <Text style={styles.weekMetricValue}>
                      {formatNumber(weekMetrics.clicks)}
                    </Text>
                  </View>
                  <View style={styles.weekMetric}>
                    <Text style={styles.weekMetricLabel}>전환</Text>
                    <Text style={styles.weekMetricValue}>
                      {formatNumber(weekMetrics.conversions)}
                    </Text>
                  </View>
                  <View style={styles.weekMetric}>
                    <Text style={styles.weekMetricLabel}>지출</Text>
                    <Text style={styles.weekMetricValue}>
                      {formatCurrency(weekMetrics.spend)}
                    </Text>
                  </View>
                </View>
              </View>
            )
          })}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </Text>
          <Text style={styles.footerText}>바투 AI 마케팅 | 월간 보고서 (2/3)</Text>
        </View>
      </Page>

      {/* Page 3: AI Insights */}
      {aiInsights.length > 0 && (
        <Page size="A4" style={styles.page}>
          <View style={{ marginBottom: 24 }}>
            <Text style={styles.sectionTitle}>AI 월간 인사이트</Text>
            {aiInsights.flatMap((i) => i.insights || []).slice(0, 6).map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              생성일: {new Date().toLocaleDateString('ko-KR')}
            </Text>
            <Text style={styles.footerText}>바투 AI 마케팅 | 월간 보고서 (3/3)</Text>
          </View>
        </Page>
      )}
    </Document>
  )
}
