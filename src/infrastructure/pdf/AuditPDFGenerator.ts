/**
 * 감사 결과 PDF 생성기
 *
 * @react-pdf/renderer를 활용해 감사 결과 데이터를 PDF로 변환한다.
 * 외부 라이브러리 추가 없이 기존 PDF 인프라를 재사용한다.
 */
import React from 'react'
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { AuditReportDTO } from '@/lib/cache/auditShareCache'

// =============================================================================
// Styles
// =============================================================================

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    borderBottom: '2px solid #1a1a1a',
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#6b7280',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
    marginBottom: 8,
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 10,
    color: '#374151',
    width: 120,
  },
  scoreValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  gradeBadge: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  summaryBox: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  categoryBox: {
    marginBottom: 12,
    padding: 10,
    border: '1px solid #e5e7eb',
    borderRadius: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1a1a1a',
  },
  categoryScore: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  findingRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  findingBullet: {
    fontSize: 9,
    color: '#6b7280',
    marginRight: 4,
    width: 8,
  },
  findingText: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
  },
  recommendationRow: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 8,
  },
  recommendationPriority: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    width: 30,
    marginRight: 4,
  },
  recommendationText: {
    fontSize: 9,
    color: '#374151',
    flex: 1,
  },
  recommendationImpact: {
    fontSize: 8,
    color: '#059669',
    marginTop: 1,
    paddingLeft: 34,
  },
  subLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    marginTop: 6,
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
})

// =============================================================================
// Helper Functions
// =============================================================================

function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    A: '#059669',
    B: '#2563eb',
    C: '#d97706',
    D: '#dc2626',
    F: '#7f1d1d',
  }
  return colors[grade] || '#374151'
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#059669'
  if (score >= 60) return '#2563eb'
  if (score >= 40) return '#d97706'
  return '#dc2626'
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    high: '[긴급]',
    medium: '[중간]',
    low: '[낮음]',
  }
  return labels[priority] || `[${priority}]`
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'KRW') {
    return `${amount.toLocaleString('ko-KR')}원`
  }
  return `${currency} ${amount.toLocaleString()}`
}

// =============================================================================
// PDF Document Component
// =============================================================================

interface AuditPDFDocumentProps {
  report: AuditReportDTO
}

function AuditPDFDocument({ report }: AuditPDFDocumentProps) {
  const analyzedDate = new Date(report.analyzedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return React.createElement(
    Document,
    { title: '바투 광고 계정 무료 진단 결과', author: '바투 AI 마케팅' },
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.headerTitle }, '광고 계정 무료 진단 결과'),
        React.createElement(
          Text,
          { style: styles.headerSubtitle },
          `분석 완료: ${analyzedDate} | 바투 AI 마케팅 솔루션`
        )
      ),

      // Overall Score Section
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, '종합 진단 점수'),
        React.createElement(
          View,
          { style: styles.summaryBox },
          React.createElement(
            Text,
            { style: { ...styles.gradeBadge, color: getGradeColor(report.grade) } },
            `${report.grade}등급  ${report.overall}점`
          ),
          React.createElement(
            View,
            { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, '전체 캠페인'),
            React.createElement(
              Text,
              { style: styles.summaryValue },
              `${report.totalCampaigns}개`
            )
          ),
          React.createElement(
            View,
            { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, '활성 캠페인'),
            React.createElement(
              Text,
              { style: styles.summaryValue },
              `${report.activeCampaigns}개`
            )
          ),
          React.createElement(
            View,
            { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, '예상 낭비 비용'),
            React.createElement(
              Text,
              { style: { ...styles.summaryValue, color: '#dc2626' } },
              formatAmount(report.estimatedWaste.amount, report.estimatedWaste.currency)
            )
          ),
          React.createElement(
            View,
            { style: styles.summaryRow },
            React.createElement(Text, { style: styles.summaryLabel }, '개선 시 기대 효과'),
            React.createElement(
              Text,
              { style: { ...styles.summaryValue, color: '#059669' } },
              formatAmount(
                report.estimatedImprovement.amount,
                report.estimatedImprovement.currency
              )
            )
          )
        )
      ),

      // Category Breakdown
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, '카테고리별 상세 분석'),
        ...report.categories.map((category, idx) =>
          React.createElement(
            View,
            { key: idx, style: styles.categoryBox },
            // Category Header
            React.createElement(
              View,
              { style: styles.categoryHeader },
              React.createElement(Text, { style: styles.categoryName }, category.name),
              React.createElement(
                Text,
                { style: { ...styles.categoryScore, color: getScoreColor(category.score) } },
                `${category.score}점`
              )
            ),
            // Findings
            category.findings.length > 0
              ? React.createElement(
                  View,
                  null,
                  React.createElement(Text, { style: styles.subLabel }, '발견된 문제'),
                  ...category.findings.map((finding, fIdx) =>
                    React.createElement(
                      View,
                      { key: fIdx, style: styles.findingRow },
                      React.createElement(Text, { style: styles.findingBullet }, '•'),
                      React.createElement(Text, { style: styles.findingText }, finding.message)
                    )
                  )
                )
              : null,
            // Recommendations
            category.recommendations.length > 0
              ? React.createElement(
                  View,
                  null,
                  React.createElement(Text, { style: styles.subLabel }, '개선 권고사항'),
                  ...category.recommendations.map((rec, rIdx) =>
                    React.createElement(
                      View,
                      { key: rIdx },
                      React.createElement(
                        View,
                        { style: styles.recommendationRow },
                        React.createElement(
                          Text,
                          {
                            style: {
                              ...styles.recommendationPriority,
                              color:
                                rec.priority === 'high'
                                  ? '#dc2626'
                                  : rec.priority === 'medium'
                                    ? '#d97706'
                                    : '#6b7280',
                            },
                          },
                          getPriorityLabel(rec.priority)
                        ),
                        React.createElement(
                          Text,
                          { style: styles.recommendationText },
                          rec.message
                        )
                      ),
                      React.createElement(
                        Text,
                        { style: styles.recommendationImpact },
                        `기대 효과: ${rec.estimatedImpact}`
                      )
                    )
                  )
                )
              : null
          )
        )
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(
          Text,
          { style: styles.footerText },
          '바투 AI 마케팅 솔루션 — 광고 계정 무료 진단'
        ),
        React.createElement(
          Text,
          { style: styles.footerText, render: ({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          },
          ''
        )
      )
    )
  )
}

// =============================================================================
// Public API
// =============================================================================

export async function generateAuditPDF(report: AuditReportDTO): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const document = React.createElement(AuditPDFDocument, { report }) as any
  const buffer = await renderToBuffer(document)
  return Buffer.from(buffer)
}
