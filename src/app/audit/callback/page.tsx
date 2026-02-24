'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuditReportCard } from '@/presentation/components/audit/AuditReportCard'
import { AuditCategoryBreakdown } from '@/presentation/components/audit/AuditCategoryBreakdown'
import { AuditConversionCTA } from '@/presentation/components/audit/AuditConversionCTA'

interface AuditReportDTO {
  overall: number
  grade: string
  categories: {
    name: string
    score: number
    findings: { type: string; message: string }[]
    recommendations: { priority: string; message: string; estimatedImpact: string }[]
  }[]
  estimatedWaste: { amount: number; currency: string }
  estimatedImprovement: { amount: number; currency: string }
  totalCampaigns: number
  activeCampaigns: number
  analyzedAt: string
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" role="status" aria-live="polite">
      <div
        className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
        aria-hidden="true"
      />
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">광고 계정을 분석하고 있습니다...</p>
        <p className="text-sm text-muted-foreground">Meta 광고 데이터를 분석 중입니다. 잠시만 기다려주세요.</p>
      </div>
    </div>
  )
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4" role="alert">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10">
        <span className="text-2xl" aria-hidden="true">✕</span>
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-foreground">분석에 실패했습니다</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <button
        onClick={onRetry}
        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="무료 진단 다시 시도"
      >
        다시 시도하기
      </button>
    </div>
  )
}

function AuditCallbackContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const adAccountId = searchParams.get('adAccountId')
  const errorParam = searchParams.get('error')

  const [report, setReport] = useState<AuditReportDTO | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(errorParam)
  const analyzedRef = useRef(false)

  const handleRetry = () => {
    window.location.href = '/'
  }

  const analyze = useCallback(async () => {
    if (!sessionId || !adAccountId || analyzedRef.current) return
    analyzedRef.current = true
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/audit/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, adAccountId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || '분석에 실패했습니다')
      }
      setReport(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }, [sessionId, adAccountId])

  useEffect(() => {
    if (sessionId && adAccountId && !errorParam) {
      analyze()
    }
  }, [sessionId, adAccountId, errorParam, analyze])

  if (error) {
    return <ErrorView message={error} onRetry={handleRetry} />
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!report) {
    return null
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 py-8 px-4 md:px-6">
      <div className="text-center space-y-1 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          광고 계정 무료 진단 결과
        </h1>
        <p className="text-sm text-muted-foreground">
          분석 완료:{' '}
          {new Date(report.analyzedAt).toLocaleString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <AuditReportCard
        overall={report.overall}
        grade={report.grade}
        estimatedWaste={report.estimatedWaste}
        estimatedImprovement={report.estimatedImprovement}
        totalCampaigns={report.totalCampaigns}
        activeCampaigns={report.activeCampaigns}
      />

      <AuditCategoryBreakdown categories={report.categories} />

      <AuditConversionCTA estimatedImprovement={report.estimatedImprovement} />
    </div>
  )
}

export default function AuditCallbackPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<LoadingSpinner />}>
        <AuditCallbackContent />
      </Suspense>
    </main>
  )
}
