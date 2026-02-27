'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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

interface ShareData {
  report: AuditReportDTO
  createdAt: string
  expiresAt: string
}

function LoadingSpinner() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6"
      role="status"
      aria-live="polite"
    >
      <div
        className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
        aria-hidden="true"
      />
      <p className="text-lg font-semibold text-foreground">공유 결과를 불러오는 중...</p>
    </div>
  )
}

function ExpiredView() {
  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4"
      role="alert"
    >
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
        <span className="text-2xl" aria-hidden="true">
          🔗
        </span>
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="text-xl font-bold text-foreground">공유 링크가 만료되었습니다</h2>
        <p className="text-sm text-muted-foreground">
          공유 링크는 생성 후 7일간 유효합니다. 새로운 진단을 받으시려면 아래 버튼을 클릭하세요.
        </p>
      </div>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        무료 진단 받기
      </Link>
    </div>
  )
}

export default function AuditSharedPage() {
  const params = useParams()
  const token = params.token as string

  const [data, setData] = useState<ShareData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!token) return

    const fetchSharedReport = async () => {
      try {
        const res = await fetch(`/api/audit/share/${token}`)
        if (res.status === 404) {
          setNotFound(true)
          return
        }
        if (!res.ok) {
          setNotFound(true)
          return
        }
        const json: ShareData = await res.json()
        setData(json)
      } catch {
        setNotFound(true)
      } finally {
        setLoading(false)
      }
    }

    fetchSharedReport()
  }, [token])

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <LoadingSpinner />
      </main>
    )
  }

  if (notFound || !data) {
    return (
      <main className="min-h-screen bg-background">
        <ExpiredView />
      </main>
    )
  }

  const { report } = data

  const analyzedDate = new Date(report.analyzedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const expiresDate = new Date(data.expiresAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-background">
      <div className="w-full max-w-3xl mx-auto space-y-6 py-8 px-4 md:px-6">
        {/* 공유 배너 */}
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
          <span aria-hidden="true">🔗</span>
          <span>
            공유된 진단 결과입니다. 링크 유효 기간: {expiresDate}까지
          </span>
        </div>

        {/* 제목 */}
        <div className="text-center space-y-1 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            광고 계정 무료 진단 결과
          </h1>
          <p className="text-sm text-muted-foreground">분석 완료: {analyzedDate}</p>
        </div>

        {/* 감사 결과 컴포넌트 (기존 재사용) */}
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

        {/* 바이럴 CTA */}
        <div className="text-center py-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">
            내 광고 계정도 무료로 진단해보세요
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm hover:shadow-md"
          >
            나도 무료 진단 받기
          </Link>
        </div>
      </div>
    </main>
  )
}
