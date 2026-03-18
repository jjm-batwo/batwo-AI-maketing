import React from 'react'
import { Document, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import { BasePage, baseStyles, formatDate, formatNumber } from './BaseReportTemplate'
import { SummaryCard } from '../components/SummaryCard'
import { LineChart } from '../components/LineChart'
import { FatigueMatrix } from '../components/FatigueMatrix'
import { FunnelChart } from '../components/FunnelChart'
import { FormatComparisonChart } from '../components/FormatComparisonChart'
import { PriorityActionCard } from '../components/PriorityActionCard'

const styles = StyleSheet.create({
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
  },
  tableCell: {
    fontSize: 8,
    color: '#475569',
    padding: 4,
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
    padding: 4,
  },
  analysisCard: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  positiveCard: {
    backgroundColor: '#f0fdf4',
    borderLeftColor: '#16a34a',
  },
  negativeCard: {
    backgroundColor: '#fef2f2',
    borderLeftColor: '#dc2626',
  },
  factorTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  factorDescription: {
    fontSize: 9,
    color: '#475569',
  },
  impactBadge: {
    fontSize: 8,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryText: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.5,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 12,
  },
})

function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원'
}

interface EnhancedWeeklyReportTemplateProps {
  report: ReportDTO
}

export function EnhancedWeeklyReportTemplate({ report }: EnhancedWeeklyReportTemplateProps) {
  const {
    overallSummary,
    dailyTrend,
    campaignPerformance,
    creativePerformance,
    creativeFatigue,
    formatComparison,
    funnelPerformance,
    performanceAnalysis,
    recommendations,
    dateRange,
  } = report

  return (
    <Document>
      {/* Page 1: 표지 + 전체 성과 요약 */}
      <BasePage pageNumber={1}>
        <View style={baseStyles.header}>
          <Text style={baseStyles.title}>주간 마케팅 리포트</Text>
          <Text style={baseStyles.subtitle}>바투 AI 마케팅 솔루션</Text>
          <Text style={baseStyles.dateRange}>
            {formatDate(dateRange.startDate)} ~ {formatDate(dateRange.endDate)}
          </Text>
        </View>
        {overallSummary && (
          <View>
            <Text style={baseStyles.sectionTitle}>전체 성과 요약</Text>
            <View style={styles.summaryGrid}>
              <SummaryCard label="총 지출" value={formatCurrency(overallSummary.totalSpend)} change={overallSummary.changes.spend} />
              <SummaryCard label="총 매출" value={formatCurrency(overallSummary.totalRevenue)} change={overallSummary.changes.revenue} />
              <SummaryCard label="ROAS" value={`${overallSummary.roas.toFixed(2)}x`} change={overallSummary.changes.roas} />
              <SummaryCard label="CTR" value={`${overallSummary.ctr.toFixed(2)}%`} change={overallSummary.changes.ctr} />
              <SummaryCard label="전환" value={formatNumber(overallSummary.totalConversions)} change={overallSummary.changes.conversions} />
            </View>
          </View>
        )}
      </BasePage>

      {/* Page 2: 성과 추이 */}
      {dailyTrend && dailyTrend.days.length > 0 && (
        <BasePage pageNumber={2}>
          <Text style={baseStyles.sectionTitle}>성과 추이 (일별)</Text>
          <LineChart data={dailyTrend.days} />
          <View style={{ marginTop: 12 }}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCellHeader, { width: '15%' }]}>날짜</Text>
              <Text style={[styles.tableCellHeader, { width: '17%' }]}>지출</Text>
              <Text style={[styles.tableCellHeader, { width: '17%' }]}>매출</Text>
              <Text style={[styles.tableCellHeader, { width: '12%' }]}>ROAS</Text>
              <Text style={[styles.tableCellHeader, { width: '15%' }]}>노출</Text>
              <Text style={[styles.tableCellHeader, { width: '12%' }]}>클릭</Text>
              <Text style={[styles.tableCellHeader, { width: '12%' }]}>전환</Text>
            </View>
            {dailyTrend.days.map((d) => (
              <View key={d.date} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '15%' }]}>{d.date.slice(5)}</Text>
                <Text style={[styles.tableCell, { width: '17%' }]}>{formatCurrency(d.spend)}</Text>
                <Text style={[styles.tableCell, { width: '17%' }]}>{formatCurrency(d.revenue)}</Text>
                <Text style={[styles.tableCell, { width: '12%' }]}>{d.roas.toFixed(2)}x</Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>{formatNumber(d.impressions)}</Text>
                <Text style={[styles.tableCell, { width: '12%' }]}>{formatNumber(d.clicks)}</Text>
                <Text style={[styles.tableCell, { width: '12%' }]}>{d.conversions}</Text>
              </View>
            ))}
          </View>
        </BasePage>
      )}

      {/* Page 3: 캠페인별 성과 */}
      {campaignPerformance && campaignPerformance.campaigns.length > 0 && (
        <BasePage pageNumber={3}>
          <Text style={baseStyles.sectionTitle}>캠페인별 성과</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { width: '25%' }]}>캠페인</Text>
            <Text style={[styles.tableCellHeader, { width: '12%' }]}>목표</Text>
            <Text style={[styles.tableCellHeader, { width: '13%' }]}>지출</Text>
            <Text style={[styles.tableCellHeader, { width: '13%' }]}>매출</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>ROAS</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>CTR</Text>
            <Text style={[styles.tableCellHeader, { width: '8%' }]}>전환</Text>
            <Text style={[styles.tableCellHeader, { width: '9%' }]}>상태</Text>
          </View>
          {campaignPerformance.campaigns.map((c) => (
            <View key={c.campaignId} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '25%' }]}>{c.name}</Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>{c.objective}</Text>
              <Text style={[styles.tableCell, { width: '13%' }]}>{formatCurrency(c.spend)}</Text>
              <Text style={[styles.tableCell, { width: '13%' }]}>{formatCurrency(c.revenue)}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{c.roas.toFixed(2)}x</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{c.ctr.toFixed(1)}%</Text>
              <Text style={[styles.tableCell, { width: '8%' }]}>{c.conversions}</Text>
              <Text style={[styles.tableCell, { width: '9%' }]}>{c.status}</Text>
            </View>
          ))}
        </BasePage>
      )}

      {/* Page 4: 소재별 성과 TOP N */}
      {creativePerformance && creativePerformance.creatives.length > 0 && (
        <BasePage pageNumber={4}>
          <Text style={baseStyles.sectionTitle}>소재별 성과 TOP {creativePerformance.topN}</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { width: '22%' }]}>소재</Text>
            <Text style={[styles.tableCellHeader, { width: '12%' }]}>포맷</Text>
            <Text style={[styles.tableCellHeader, { width: '13%' }]}>지출</Text>
            <Text style={[styles.tableCellHeader, { width: '13%' }]}>매출</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>ROAS</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>CTR</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>클릭</Text>
            <Text style={[styles.tableCellHeader, { width: '10%' }]}>전환</Text>
          </View>
          {creativePerformance.creatives.map((c) => (
            <View key={c.creativeId} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: '22%' }]}>{c.name}</Text>
              <Text style={[styles.tableCell, { width: '12%' }]}>{c.format}</Text>
              <Text style={[styles.tableCell, { width: '13%' }]}>{formatCurrency(c.spend)}</Text>
              <Text style={[styles.tableCell, { width: '13%' }]}>{formatCurrency(c.revenue)}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{c.roas.toFixed(2)}x</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{c.ctr.toFixed(1)}%</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{formatNumber(c.clicks)}</Text>
              <Text style={[styles.tableCell, { width: '10%' }]}>{c.conversions}</Text>
            </View>
          ))}
        </BasePage>
      )}

      {/* Page 5: 소재 피로도 지수 */}
      {creativeFatigue && creativeFatigue.creatives.length > 0 && (
        <BasePage pageNumber={5}>
          <Text style={baseStyles.sectionTitle}>소재 피로도 지수</Text>
          <FatigueMatrix creatives={creativeFatigue.creatives} />
        </BasePage>
      )}

      {/* Page 6: 소재 포맷별 성과 */}
      {formatComparison && formatComparison.formats.length > 0 && (
        <BasePage pageNumber={6}>
          <Text style={baseStyles.sectionTitle}>소재 포맷별 성과</Text>
          <FormatComparisonChart formats={formatComparison.formats} />
        </BasePage>
      )}

      {/* Page 7: 퍼널 단계별 성과 */}
      {funnelPerformance && funnelPerformance.stages.length > 0 && (
        <BasePage pageNumber={7}>
          <Text style={baseStyles.sectionTitle}>퍼널 단계별 성과</Text>
          <FunnelChart stages={funnelPerformance.stages} totalBudget={funnelPerformance.totalBudget} />
        </BasePage>
      )}

      {/* Page 8: 성과 분석 */}
      {performanceAnalysis && (
        <BasePage pageNumber={8}>
          <Text style={baseStyles.sectionTitle}>성과 분석</Text>
          <Text style={styles.summaryText}>{performanceAnalysis.summary}</Text>

          {performanceAnalysis.positiveFactors.length > 0 && (
            <View>
              <Text style={styles.subsectionTitle}>잘된 점</Text>
              {performanceAnalysis.positiveFactors.map((f, i) => (
                <View key={i} style={[styles.analysisCard, styles.positiveCard]}>
                  <Text style={styles.factorTitle}>{f.title}</Text>
                  <Text style={styles.factorDescription}>{f.description}</Text>
                  <Text style={[styles.impactBadge, { color: '#16a34a' }]}>영향도: {f.impact}</Text>
                </View>
              ))}
            </View>
          )}

          {performanceAnalysis.negativeFactors.length > 0 && (
            <View>
              <Text style={styles.subsectionTitle}>개선 필요</Text>
              {performanceAnalysis.negativeFactors.map((f, i) => (
                <View key={i} style={[styles.analysisCard, styles.negativeCard]}>
                  <Text style={styles.factorTitle}>{f.title}</Text>
                  <Text style={styles.factorDescription}>{f.description}</Text>
                  <Text style={[styles.impactBadge, { color: '#dc2626' }]}>영향도: {f.impact}</Text>
                </View>
              ))}
            </View>
          )}
        </BasePage>
      )}

      {/* Page 9: 추천 액션 */}
      {recommendations && recommendations.actions.length > 0 && (
        <BasePage pageNumber={9}>
          <Text style={baseStyles.sectionTitle}>추천 액션</Text>
          {recommendations.actions.map((action, i) => (
            <PriorityActionCard key={i} action={action} />
          ))}
        </BasePage>
      )}
    </Document>
  )
}
