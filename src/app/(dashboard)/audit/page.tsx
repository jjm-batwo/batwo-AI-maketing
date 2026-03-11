'use client'

import { useAccountAudit } from '@/presentation/hooks/useAccountAudit'
import { AuditScoreCard } from '@/presentation/components/audit/AuditScoreCard'
import { AuditCategoryBreakdown } from '@/presentation/components/audit/AuditCategoryBreakdown'
import { AuditUpgradeCTA } from '@/presentation/components/audit/AuditUpgradeCTA'
import { Loader2 } from 'lucide-react'

export default function AuditPage() {
  const { data: report, isLoading, error } = useAccountAudit()

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>무료 광고 계정 진단을 수행하고 있습니다...</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-gray-500">
        <p className="text-red-500 mb-2">진단 보고서를 생성하는 중 오류가 발생했습니다.</p>
        <p className="text-sm">{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
      </div>
    )
  }

  const mappedCategories = report.categories.map((c) => ({
    name:
      {
        inefficient_campaigns: '비효율 캠페인',
        target_overlap: '타겟 중복도',
        creative_fatigue: '크리에이티브 피로도',
        bid_strategy: '입찰 전략',
        budget_allocation: '예산 분배',
      }[c.category] || c.category,
    score: c.score,
    findings: c.findings.map((f) => ({ type: 'warning', message: f })),
    recommendations: c.recommendations.map((r) => ({
      priority: 'medium',
      message: r,
      estimatedImpact: `예상 낭비액 절감: ${c.wasteEstimate.toLocaleString()}원`,
    })),
  }))

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-8 px-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">광고 계정 진단 리포트</h1>
        <p className="text-gray-500">현재 광고 계정의 핵심 지표와 최적화 가능성을 무료로 분석해 드립니다.</p>
      </div>
      
      <AuditScoreCard report={report} />
      
      <AuditCategoryBreakdown categories={mappedCategories} />
      
      <AuditUpgradeCTA wasteEstimate={report.totalWasteEstimate} />
    </div>
  )
}
