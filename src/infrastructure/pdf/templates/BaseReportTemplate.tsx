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
import type { ReportSection } from '@domain/entities/Report'
import type { ChartData, TableData, PDFGenerationOptions } from '../types'

// ========================================
// Font Registration
// ========================================

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

Font.registerHyphenationCallback((word) => [word])

// ========================================
// Base Styles
// ========================================

export const baseStyles = StyleSheet.create({
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
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
  metricCard: {
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
})

// ========================================
// Utility Functions
// ========================================

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ko-KR').format(Math.round(num))
}

export function formatCurrency(num: number, currency = 'KRW'): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(num)
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
  protected renderHeader(title: string, subtitle: string, dateRange: { startDate: string; endDate: string }): React.ReactElement {
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
        <Text style={baseStyles.footerText}>
          생성일: {new Date().toLocaleDateString('ko-KR')}
        </Text>
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
      <View style={{ marginVertical: 12 }}>
        {chartData.map((data, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 10, color: '#64748b', marginBottom: 4 }}>
              {data.label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: `${(data.value / maxValue) * 100}%`,
                  height: 20,
                  backgroundColor: data.color || '#3b82f6',
                  borderRadius: 4,
                }}
              />
              <Text style={{ fontSize: 10, marginLeft: 8, color: '#1e293b' }}>
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
      <View style={{ marginVertical: 12 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#f1f5f9',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
            paddingVertical: 6,
          }}
        >
          {tableData.headers.map((header, index) => (
            <Text
              key={index}
              style={{
                width: columnWidth,
                fontSize: 9,
                fontWeight: 'bold',
                color: '#1e293b',
                padding: 4,
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
              borderBottomColor: '#e2e8f0',
              paddingVertical: 6,
            }}
          >
            {tableData.headers.map((header, colIndex) => (
              <Text
                key={colIndex}
                style={{
                  width: columnWidth,
                  fontSize: 9,
                  color: '#475569',
                  padding: 4,
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

export function BasePage({ children, pageNumber }: { children: React.ReactNode; pageNumber?: number }) {
  return (
    <Page size="A4" style={baseStyles.page}>
      {children}
      <View style={baseStyles.footer}>
        <Text style={baseStyles.footerText}>
          생성일: {new Date().toLocaleDateString('ko-KR')}
        </Text>
        <Text style={baseStyles.footerText}>
          바투 AI 마케팅{pageNumber ? ` | 페이지 ${pageNumber}` : ''}
        </Text>
      </View>
    </Page>
  )
}
