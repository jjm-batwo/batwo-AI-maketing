import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import { formatDate, formatNumber, PDF_FONT_FAMILY } from './BaseReportTemplate'
import { SummaryCard } from '../components/SummaryCard'
import { LineChart } from '../components/LineChart'
import { FatigueMatrix } from '../components/FatigueMatrix'
import { FunnelChart } from '../components/FunnelChart'
import { FormatComparisonChart } from '../components/FormatComparisonChart'
import { PriorityActionCard } from '../components/PriorityActionCard'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 24,
    paddingBottom: 40,
    fontFamily: PDF_FONT_FAMILY,
  },
  header: {
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
  },
  dateRange: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    marginTop: 4,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  section: {
    marginBottom: 12,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 4,
  },
  tableCell: {
    fontSize: 8,
    color: '#475569',
    padding: 3,
  },
  tableCellHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e293b',
    padding: 3,
  },
  analysisCard: {
    marginBottom: 6,
    padding: 8,
    borderRadius: 4,
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
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  factorDescription: {
    fontSize: 8,
    color: '#475569',
  },
  impactBadge: {
    fontSize: 7,
    fontWeight: 'bold',
    marginTop: 2,
  },
  summaryText: {
    fontSize: 9,
    color: '#475569',
    lineHeight: 1.5,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 6,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 24,
    right: 24,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
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

  const Footer = () => (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>생성일: {new Date().toLocaleDateString('ko-KR')}</Text>
      <Text style={styles.footerText}>바투 AI 마케팅</Text>
    </View>
  )

  return (
    <Document>
      {/* ===== Page 1: 표지 + 전체 성과 요약 ===== */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>주간 마케팅 리포트</Text>
          <Text style={styles.subtitle}>바투 AI 마케팅 솔루션</Text>
          <Text style={styles.dateRange}>
            {formatDate(dateRange.startDate)} ~ {formatDate(dateRange.endDate)}
          </Text>
        </View>

        {overallSummary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>전체 성과 요약</Text>
            <View style={styles.summaryGrid}>
              <SummaryCard label="총 지출" value={formatCurrency(overallSummary.totalSpend)} change={overallSummary.changes.spend} />
              <SummaryCard label="총 매출" value={formatCurrency(overallSummary.totalRevenue)} change={overallSummary.changes.revenue} />
              <SummaryCard label="ROAS" value={`${overallSummary.roas.toFixed(2)}x`} change={overallSummary.changes.roas} />
              <SummaryCard label="CTR" value={`${overallSummary.ctr.toFixed(2)}%`} change={overallSummary.changes.ctr} />
              <SummaryCard label="전환" value={formatNumber(overallSummary.totalConversions)} change={overallSummary.changes.conversions} />
            </View>
          </View>
        )}
        <Footer />
      </Page>

      {/* ===== Page 2: 성과 추이 (일별) ===== */}
      {dailyTrend && dailyTrend.days.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>성과 추이 (일별)</Text>
          <LineChart data={dailyTrend.days} />
          <View style={{ marginTop: 6 }}>
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
          <Footer />
        </Page>
      )}

      {/* ===== Page 3: 캠페인별 성과 + 소재별 성과 ===== */}
      {(campaignPerformance?.campaigns.length || creativePerformance?.creatives.length) && (
        <Page size="A4" style={styles.page} wrap>
          {/* 캠페인별 성과 */}
          {campaignPerformance && campaignPerformance.campaigns.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>캠페인별 성과</Text>
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
            </View>
          )}

          {/* 구분선 */}
          {campaignPerformance?.campaigns.length && creativePerformance?.creatives.length && (
            <View style={styles.divider} />
          )}

          {/* 소재별 성과 */}
          {creativePerformance && creativePerformance.creatives.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>소재별 성과 TOP {creativePerformance.topN}</Text>
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
            </View>
          )}
          <Footer />
        </Page>
      )}

      {/* ===== Page 4: 소재 분석 (피로도 + 포맷 + 퍼널) ===== */}
      {(creativeFatigue?.creatives.length || formatComparison?.formats.length || funnelPerformance?.stages.length) && (
        <Page size="A4" style={styles.page} wrap>
          {/* 소재 피로도 */}
          {creativeFatigue && creativeFatigue.creatives.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>소재 피로도 지수</Text>
              <FatigueMatrix creatives={creativeFatigue.creatives} />
            </View>
          )}

          {/* 구분선 */}
          {creativeFatigue?.creatives.length && formatComparison?.formats.length && (
            <View style={styles.divider} />
          )}

          {/* 포맷별 성과 */}
          {formatComparison && formatComparison.formats.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>소재 포맷별 성과</Text>
              <FormatComparisonChart formats={formatComparison.formats} />
            </View>
          )}

          {/* 구분선 */}
          {(creativeFatigue?.creatives.length || formatComparison?.formats.length) && funnelPerformance?.stages.length && (
            <View style={styles.divider} />
          )}

          {/* 퍼널 단계별 */}
          {funnelPerformance && funnelPerformance.stages.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>퍼널 단계별 성과</Text>
              <FunnelChart stages={funnelPerformance.stages} totalBudget={funnelPerformance.totalBudget} />
            </View>
          )}
          <Footer />
        </Page>
      )}

      {/* ===== Page 5: 성과 분석 + 추천 액션 ===== */}
      {(performanceAnalysis || recommendations?.actions.length) && (
        <Page size="A4" style={styles.page} wrap>
          {/* 성과 분석 */}
          {performanceAnalysis && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>성과 분석</Text>
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
            </View>
          )}

          {/* 구분선 */}
          {performanceAnalysis && recommendations?.actions.length && (
            <View style={styles.divider} />
          )}

          {/* 추천 액션 */}
          {recommendations && recommendations.actions.length > 0 && (
            <View style={styles.section} wrap={false}>
              <Text style={styles.sectionTitle}>추천 액션</Text>
              {recommendations.actions.map((action, i) => (
                <PriorityActionCard key={i} action={action} />
              ))}
            </View>
          )}
          <Footer />
        </Page>
      )}
    </Document>
  )
}
