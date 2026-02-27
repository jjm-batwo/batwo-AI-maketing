'use client'

import { BarChart3 } from 'lucide-react'

interface EmptyAuditResultProps {
  analyzedAt: string
}

export function EmptyAuditResult({ analyzedAt }: EmptyAuditResultProps) {
  const analyzedDate = new Date(analyzedAt).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="w-full max-w-3xl mx-auto py-8 px-4 md:px-6">
      <div
        className="flex flex-col items-center justify-center min-h-[40vh] gap-6 text-center"
        role="status"
      >
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted">
          <BarChart3 className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-xl font-bold text-foreground">
            광고 계정에 캠페인이 없어 분석할 수 없습니다
          </h2>
          <p className="text-sm text-muted-foreground">
            캠페인을 생성한 후 다시 진단해보세요
          </p>
          <p className="text-xs text-muted-foreground">
            분석 시도: {analyzedDate}
          </p>
        </div>
        <a
          href="/"
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          무료 진단 다시 받기
        </a>
      </div>
    </div>
  )
}
