import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { ReportDTO } from '@application/dto/report/ReportDTO'
import type { ReportSection } from '@domain/entities/Report'
import type { ChartData, TableData, PDFGenerationOptions } from '../types'
import { PDF_FONT_FAMILY, PDF_MONO_FONT_FAMILY, colors, spacing, radius, fontSize, letterSpacing } from '../design-tokens'

// Re-export for backward compatibility
export { PDF_FONT_FAMILY } from '../design-tokens'

// ========================================
// Base Styles
// ========================================

export const baseStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: colors.bgCard,
    padding: spacing.xxl,
    fontFamily: PDF_FONT_FAMILY,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: colors.blue,
    paddingBottom: 20,
  },
  title: {
    fontSize: fontSize['7xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
  },
  dateRange: {
    fontSize: fontSize['2xl'],
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize['4xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: spacing.xxl,
    right: spacing.xxl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  metricCard: {
    backgroundColor: colors.bgCard,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricLabel: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: PDF_MONO_FONT_FAMILY,
    letterSpacing: letterSpacing.wide,
  },
})

// ========================================
// Utility Functions
// ========================================

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num))
}

export function formatCurrency(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num)) + '원'
}

export function formatPercent(num: number, decimals = 2): string {
  return `${num.toFixed(decimals)}%`
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

// ========================================
// Base Template Abstract Class
// ========================================

export interface BaseReportTemplateProps {
  report: ReportDTO
  options?: PDFGenerationOptions
}

export abstract class BaseReportTemplate {
  protected abstract templateName: string
  protected abstract sections: ReportSection[]

  // Abstract methods to be implemented by subclasses
  abstract generate(report: ReportDTO, options?: PDFGenerationOptions): React.ReactElement

  // Protected helper methods
  protected renderHeader(
    title: string,
    subtitle: string,
    dateRange: { startDate: string; endDate: string }
  ): React.ReactElement {
    return (
      <View style={baseStyles.header}>
        <Text style={baseStyles.title}>{title}</Text>
        <Text style={baseStyles.subtitle}>{subtitle}</Text>
        <Text style={baseStyles.dateRange}>
          {formatDate(dateRange.startDate)} ~ {formatDate(dateRange.endDate)}
        </Text>
      </View>
    )
  }

  protected renderFooter(pageNumber?: number): React.ReactElement {
    return (
      <View style={baseStyles.footer}>
        <Text style={baseStyles.footerText}>생성일: {new Date().toLocaleDateString('ko-KR')}</Text>
        <Text style={baseStyles.footerText}>
          바투 AI 마케팅{pageNumber ? ` | 페이지 ${pageNumber}` : ''}
        </Text>
      </View>
    )
  }

  protected renderChart(chartData: ChartData[]): React.ReactElement {
    // Simple bar representation (can be enhanced with actual chart library)
    const maxValue = Math.max(...chartData.map((d) => d.value))

    return (
      <View style={{ marginVertical: spacing.md }}>
        {chartData.map((data, index) => (
          <View key={index} style={{ marginBottom: spacing.sm }}>
            <Text style={{ fontSize: fontSize.base, color: colors.textSecondary, marginBottom: spacing.xs }}>{data.label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: `${(data.value / maxValue) * 100}%`,
                  height: 20,
                  backgroundColor: data.color || colors.blue,
                  borderRadius: radius.sm,
                }}
              />
              <Text style={{ fontSize: fontSize.base, marginLeft: spacing.sm, color: colors.textPrimary }}>
                {formatNumber(data.value)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    )
  }

  protected renderTable(tableData: TableData): React.ReactElement {
    const columnWidth = `${100 / tableData.headers.length}%`

    return (
      <View style={{ marginVertical: spacing.md }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.slate100,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingVertical: 6,
          }}
        >
          {tableData.headers.map((header, index) => (
            <Text
              key={index}
              style={{
                width: columnWidth,
                fontSize: fontSize.sm,
                fontWeight: 'bold',
                color: colors.textPrimary,
                padding: spacing.xs,
              }}
            >
              {header}
            </Text>
          ))}
        </View>

        {/* Rows */}
        {tableData.rows.map((row, rowIndex) => (
          <View
            key={rowIndex}
            style={{
              flexDirection: 'row',
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              paddingVertical: 6,
            }}
          >
            {tableData.headers.map((header, colIndex) => (
              <Text
                key={colIndex}
                style={{
                  width: columnWidth,
                  fontSize: fontSize.sm,
                  color: colors.textSecondary,
                  padding: spacing.xs,
                }}
              >
                {row[header]}
              </Text>
            ))}
          </View>
        ))}
      </View>
    )
  }
}

// ========================================
// Base Document Wrapper
// ========================================

export function BaseDocument({ children }: { children: React.ReactNode }) {
  return <Document>{children}</Document>
}

export function BasePage({
  children,
  pageNumber,
}: {
  children: React.ReactNode
  pageNumber?: number
}) {
  return (
    <Page size="A4" style={baseStyles.page}>
      {children}
      <View style={baseStyles.footer}>
        <Text style={baseStyles.footerText}>생성일: {new Date().toLocaleDateString('ko-KR')}</Text>
        <Text style={baseStyles.footerText}>
          바투 AI 마케팅{pageNumber ? ` | 페이지 ${pageNumber}` : ''}
        </Text>
      </View>
    </Page>
  )
}
