'use client'

import { memo } from 'react'
import type { AuditReport } from '@/domain/value-objects/AuditReport'

const GRADE_COLORS = {
  excellent: 'text-green-600 dark:text-green-400',
  good: 'text-blue-600 dark:text-blue-400',
  average: 'text-yellow-600 dark:text-yellow-400',
  poor: 'text-orange-600 dark:text-orange-400',
  critical: 'text-red-600 dark:text-red-400',
}

export const AuditScoreCard = memo(function AuditScoreCard({ report }: { report: AuditReport }) {
  return (
    <div className="bg-card rounded-xl shadow-lg p-8 text-center border border-border">
      <h2 className="text-lg font-medium text-muted-foreground mb-2">광고 계정 건강도</h2>
      <div className={`text-6xl font-bold ${GRADE_COLORS[report.overallGrade]}`}>
        {report.overallScore}점
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        지난 {report.analyzedPeriodDays}일간 {report.analyzedCampaigns}개 캠페인 분석
      </p>
      {report.totalWasteEstimate > 0 && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-300 font-semibold text-xl">
            약 {report.totalWasteEstimate.toLocaleString()}원의 예산이 낭비되고 있습니다
          </p>
          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
            AI 최적화로 이 금액을 절약하세요
          </p>
        </div>
      )}
    </div>
  )
})
