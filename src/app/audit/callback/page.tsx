'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuditReportCard } from '@/presentation/components/audit/AuditReportCard'
import { AuditCategoryBreakdown } from '@/presentation/components/audit/AuditCategoryBreakdown'
import { AuditConversionCTA } from '@/presentation/components/audit/AuditConversionCTA'
import { AccountSelector } from '@/presentation/components/audit/AccountSelector'
import { EmptyAuditResult } from '@/presentation/components/audit/EmptyAuditResult'
import type { AdAccount } from '@/presentation/components/audit/AccountSelector'
import { isActiveAccount } from '@/presentation/utils/accountStatus'
import { Share2, Download } from 'lucide-react'
import { toast } from 'sonner'

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

type Phase = 'loading' | 'select' | 'analyzing' | 'result' | 'error'

// 분석 단계별 메시지 정의
const ANALYSIS_STEPS = [
  { message: 'Meta 계정 연결 확인 중...', duration: 5 },
  { message: '캠페인 데이터 수집 중...', duration: 15 },
  { message: 'AI가 광고 성과를 분석하고 있습니다...', duration: 30 },
  { message: '최적화 제안을 생성하고 있습니다...', duration: 45 },
] as const

function AnalyzingProgress() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 경과 시간에 따라 현재 단계 결정
  const currentStepIndex = ANALYSIS_STEPS.findIndex((step) => elapsed < step.duration)
  const activeStep = currentStepIndex === -1 ? ANALYSIS_STEPS.length - 1 : currentStepIndex

  // 전체 예상 시간 대비 프로그레스 (최대 95%까지)
  const progressPercent = Math.min(95, Math.round((elapsed / 60) * 100))

  // 경과 시간 포맷
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4" role="status" aria-live="polite">
      {/* 스피너 */}
      <div
        className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
        aria-hidden="true"
      />

      {/* 현재 단계 메시지 */}
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">
          {ANALYSIS_STEPS[activeStep].message}
        </p>
        <p className="text-sm text-muted-foreground">
          예상 소요 시간: 30초~1분 · 경과: {formatTime(elapsed)}
        </p>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full max-w-xs space-y-3">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`분석 진행률 ${progressPercent}%`}
          />
        </div>

        {/* 단계별 체크리스트 */}
        <ul className="space-y-1.5 text-sm" aria-label="분석 단계">
          {ANALYSIS_STEPS.map((step, index) => (
            <li
              key={step.message}
              className={`flex items-center gap-2 transition-colors duration-300 ${
                index < activeStep
                  ? 'text-primary'
                  : index === activeStep
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground'
              }`}
            >
              <span aria-hidden="true" className="shrink-0 text-xs">
                {index < activeStep ? '\u2713' : index === activeStep ? '\u25CB' : '\u00B7'}
              </span>
              {step.message}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Suspense fallback용 간단 스피너 (분석 전 초기 로딩)
function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6" role="status" aria-live="polite">
      <div
        className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
        aria-hidden="true"
      />
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-foreground">불러오는 중...</p>
        <p className="text-sm text-muted-foreground">잠시만 기다려주세요.</p>
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
  const errorParam = searchParams.get('error')
  // 하위 호환: 기존 URL에 adAccountId가 있으면 사용
  const legacyAdAccountId = searchParams.get('adAccountId')

  const [phase, setPhase] = useState<Phase>(errorParam ? 'error' : 'loading')
  const [accounts, setAccounts] = useState<AdAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(legacyAdAccountId)
  const [report, setReport] = useState<AuditReportDTO | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(errorParam)
  const analyzedRef = useRef(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)

  const handleRetry = () => {
    window.location.href = '/'
  }

  const handleShare = async () => {
    if (!report) return
    setShareLoading(true)
    try {
      const res = await fetch('/api/audit/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, signature }),
      })
      if (!res.ok) throw new Error('공유 링크 생성 실패')
      const data = await res.json()
      setShareUrl(data.shareUrl)
      await navigator.clipboard.writeText(data.shareUrl)
      toast.success('공유 링크가 클립보드에 복사되었습니다!')
    } catch {
      toast.error('공유 링크 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setShareLoading(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!report) return
    setPdfLoading(true)
    try {
      const accountName = accounts.find(a => a.id === selectedAccountId)?.name
      const res = await fetch('/api/audit/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report, signature, accountName }),
      })
      if (!res.ok) throw new Error('PDF 생성 실패')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const analyzedDate = new Date(report.analyzedAt)
        .toISOString()
        .split('T')[0]
        .replace(/-/g, '')
      const safeName = accountName?.replace(/[^a-zA-Z0-9가-힣_-]/g, '_').slice(0, 30) || ''
      a.download = safeName
        ? `바투_광고계정진단_${safeName}_${analyzedDate}.pdf`
        : `바투_광고계정진단_${analyzedDate}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('PDF 다운로드에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setPdfLoading(false)
    }
  }

  const analyze = useCallback(async (adAccountId: string) => {
    if (!sessionId || analyzedRef.current) return
    analyzedRef.current = true
    setPhase('analyzing')
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
      // analyze 응답에서 signature를 분리 — report에는 포함하지 않음
      const data = await res.json()
      const { signature: sig, ...reportData } = data
      setSignature(sig)
      setReport(reportData)
      setPhase('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다')
      setPhase('error')
    }
  }, [sessionId])

  // 계정 목록 조회 및 자동 선택 로직
  useEffect(() => {
    if (!sessionId || errorParam) return

    // 하위 호환: URL에 adAccountId가 있으면 바로 분석
    if (legacyAdAccountId) {
      analyze(legacyAdAccountId)
      return
    }

    // 계정 목록 조회
    const fetchAccounts = async () => {
      try {
        const res = await fetch(`/api/audit/accounts?session=${sessionId}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.message || '계정 목록을 불러올 수 없습니다')
        }
        const data = await res.json()
        const accountList: AdAccount[] = data.accounts

        setAccounts(accountList)

        // 활성 계정 필터링
        const activeAccounts = accountList.filter((a) => isActiveAccount(a.accountStatus))

        if (activeAccounts.length === 1) {
          // 활성 계정 1개 → 자동 선택 후 즉시 분석
          setSelectedAccountId(activeAccounts[0].id)
          analyze(activeAccounts[0].id)
        } else {
          // 활성 계정 0개 또는 2개+ → 선택 UI 표시
          setPhase('select')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '계정 목록을 불러올 수 없습니다')
        setPhase('error')
      }
    }

    fetchAccounts()
  }, [sessionId, errorParam, legacyAdAccountId, analyze])

  // 세션 만료 사전 경고 (select phase에서만 동작)
  useEffect(() => {
    if (phase !== 'select') return

    const warningTimer = setTimeout(() => {
      toast.warning('세션이 3분 후 만료됩니다. 계정을 선택해주세요.', { duration: 10000 })
    }, 12 * 60 * 1000)

    const expiryTimer = setTimeout(() => {
      toast.error('세션이 만료되었습니다. 다시 시도해주세요.', { duration: Infinity })
      setError('세션이 만료되었습니다. 처음부터 다시 시도해주세요.')
      setPhase('error')
    }, 15 * 60 * 1000)

    return () => {
      clearTimeout(warningTimer)
      clearTimeout(expiryTimer)
    }
  }, [phase])

  const handleAccountSelect = (adAccountId: string) => {
    setSelectedAccountId(adAccountId)
    analyze(adAccountId)
  }

  // 에러 상태
  if (phase === 'error' && error) {
    return <ErrorView message={error} onRetry={handleRetry} />
  }

  // 계정 선택 상태
  if (phase === 'select') {
    return <AccountSelector accounts={accounts} onSelect={handleAccountSelect} />
  }

  // 분석 중 → 단계별 프로그레스
  if (phase === 'analyzing') {
    return <AnalyzingProgress />
  }

  // 초기 로딩 (계정 목록 조회)
  if (phase === 'loading') {
    return <LoadingSpinner />
  }

  // 결과 — 캠페인 0개일 때 전용 안내 UI
  if (phase === 'result' && report && report.totalCampaigns === 0) {
    return <EmptyAuditResult analyzedAt={report.analyzedAt} />
  }

  // 결과
  if (phase === 'result' && report) {
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

        {/* 공유 / PDF 다운로드 버튼 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button
            onClick={handleShare}
            disabled={shareLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="진단 결과 공유 링크 복사"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {shareLoading ? '링크 생성 중...' : shareUrl ? '링크 복사됨' : '결과 공유하기'}
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-border bg-background text-foreground font-medium text-sm hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="진단 결과 PDF 다운로드"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            {pdfLoading ? 'PDF 생성 중...' : 'PDF 다운로드'}
          </button>
        </div>
      </div>
    )
  }

  return null
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
