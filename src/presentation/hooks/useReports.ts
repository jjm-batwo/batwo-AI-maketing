'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface ReportSummary {
  id: string
  type: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  status: 'PENDING' | 'GENERATED' | 'SENT'
  dateRange: {
    startDate: string
    endDate: string
  }
  generatedAt?: string
  campaignCount: number
}

interface ReportDetail {
  id: string
  type: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  status: 'PENDING' | 'GENERATED' | 'SENT'
  dateRange: {
    startDate: string
    endDate: string
  }
  summaryMetrics: {
    totalImpressions: number
    totalClicks: number
    totalConversions: number
    totalSpend: number
    totalRevenue: number
    averageRoas: number
    averageCtr: number
    averageCpa: number
  }
  aiInsights: Array<{
    type: 'POSITIVE' | 'NEGATIVE' | 'SUGGESTION'
    message: string
    confidence: number
  }>
  sections: Array<{
    title: string
    content: string
  }>
  campaigns: Array<{
    id: string
    name: string
    metrics: {
      spend: number
      impressions: number
      clicks: number
      conversions: number
      roas: number
    }
  }>
  generatedAt: string
}

interface ReportsResponse {
  reports: ReportSummary[]
  total: number
  page: number
  pageSize: number
}

interface GenerateReportInput {
  type: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  startDate: string
  endDate: string
  campaignIds?: string[]
}

const REPORTS_QUERY_KEY = ['reports'] as const

async function fetchReports(params?: {
  page?: number
  pageSize?: number
  type?: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
}): Promise<ReportsResponse> {
  const searchParams = new URLSearchParams()
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize))
  if (params?.type) searchParams.set('type', params.type)

  const response = await fetch(`/api/reports?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch reports')
  }
  return response.json()
}

async function fetchReport(id: string): Promise<ReportDetail> {
  const response = await fetch(`/api/reports/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch report')
  }
  return response.json()
}

async function generateReport(input: GenerateReportInput): Promise<ReportSummary> {
  const response = await fetch('/api/reports/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to generate report')
  }
  return response.json()
}

async function downloadReport(id: string): Promise<Blob> {
  const response = await fetch(`/api/reports/${id}/download`)
  if (!response.ok) {
    throw new Error('Failed to download report')
  }
  return response.blob()
}

async function shareReport(id: string, email: string): Promise<void> {
  const response = await fetch(`/api/reports/${id}/share`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!response.ok) {
    throw new Error('Failed to share report')
  }
}

export function useReports(params?: {
  page?: number
  pageSize?: number
  type?: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
}) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, params],
    queryFn: () => fetchReports(params),
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useReport(id: string) {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, id],
    queryFn: () => fetchReport(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useGenerateReport() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: generateReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY })
    },
  })
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: downloadReport,
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `report-${Date.now()}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    },
  })
}

export function useShareReport() {
  return useMutation({
    mutationFn: ({ id, email }: { id: string; email: string }) => shareReport(id, email),
  })
}
