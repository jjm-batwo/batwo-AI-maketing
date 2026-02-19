'use client'

import { cn } from '@/lib/utils'
import { Sparkles, ArrowRight, Settings } from 'lucide-react'

interface GuideRecommendationCardProps {
  recommendation: {
    campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
    formData: {
      objective: string
      dailyBudget: number
      campaignMode: 'ADVANTAGE_PLUS' | 'MANUAL'
    }
    reasoning: string
    experienceLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  }
  onAccept: () => void
  onManual: () => void
}

const OBJECTIVE_LABELS: Record<string, string> = {
  CONVERSIONS: '전환 (매출)',
  BRAND_AWARENESS: '브랜드 인지도',
  TRAFFIC: '트래픽',
  ENGAGEMENT: '참여',
  REACH: '도달',
}

const MODE_LABELS: Record<string, string> = {
  ADVANTAGE_PLUS: 'Advantage+ (AI 자동 최적화)',
  MANUAL: '수동 모드 (세부 설정)',
}

const LEVEL_LABELS: Record<string, string> = {
  BEGINNER: '입문자',
  INTERMEDIATE: '중급자',
  ADVANCED: '전문가',
}

export function GuideRecommendationCard({
  recommendation,
  onAccept,
  onManual,
}: GuideRecommendationCardProps) {
  const { formData, reasoning, experienceLevel } = recommendation

  return (
    <div
      data-testid="guide-recommendation-card"
      className="mx-4 my-2 rounded-xl border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30 overflow-hidden"
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 bg-green-100/50 dark:bg-green-900/30 border-b border-green-200 dark:border-green-800">
        <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-sm font-medium text-green-700 dark:text-green-300">
          AI 캠페인 추천
        </span>
      </div>

      {/* 설정 요약 테이블 */}
      <div className="px-4 py-3">
        <div className="rounded-lg border border-border overflow-hidden">
          {[
            { label: '경험 수준', value: LEVEL_LABELS[experienceLevel] || experienceLevel },
            { label: '캠페인 모드', value: MODE_LABELS[formData.campaignMode] || formData.campaignMode },
            { label: '목표', value: OBJECTIVE_LABELS[formData.objective] || formData.objective },
            { label: '일일 예산', value: `₩${formData.dailyBudget.toLocaleString()}` },
          ].map((item, index, arr) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center justify-between px-3 py-2 text-xs',
                index !== arr.length - 1 && 'border-b border-border'
              )}
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 추천 이유 */}
      <div className="px-4 pb-3">
        <p className="text-xs text-muted-foreground leading-relaxed">{reasoning}</p>
      </div>

      {/* 버튼 */}
      <div className="flex gap-2 px-4 py-3 border-t border-green-200 dark:border-green-800">
        <button
          data-testid="guide-accept-button"
          onClick={onAccept}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium',
            'bg-green-600 text-white hover:bg-green-700',
            'transition-colors'
          )}
        >
          <ArrowRight className="h-4 w-4" />
          이 설정으로 시작하기
        </button>
        <button
          data-testid="guide-manual-button"
          onClick={onManual}
          className={cn(
            'flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium',
            'border border-border text-muted-foreground hover:bg-muted',
            'transition-colors'
          )}
        >
          <Settings className="h-4 w-4" />
          직접 설정
        </button>
      </div>
    </div>
  )
}
