'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import type { ScienceGrade } from '@/domain/value-objects/MarketingScience'

interface ScienceScoreProps {
  score: number
  grade: ScienceGrade
  analyzedDomains?: number
  totalDomains?: number
  isLoading?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const GRADE_COLORS: Record<ScienceGrade, { gradient: string; ring: string; glow: string; badge: string }> = {
  'A+': {
    gradient: 'from-emerald-500 via-green-400 to-emerald-600',
    ring: 'stroke-emerald-500',
    glow: 'shadow-emerald-500/50',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  },
  'A': {
    gradient: 'from-emerald-500 via-green-400 to-emerald-600',
    ring: 'stroke-emerald-500',
    glow: 'shadow-emerald-500/50',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  },
  'B+': {
    gradient: 'from-blue-500 via-cyan-400 to-blue-600',
    ring: 'stroke-blue-500',
    glow: 'shadow-blue-500/50',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
  },
  'B': {
    gradient: 'from-blue-500 via-cyan-400 to-blue-600',
    ring: 'stroke-blue-500',
    glow: 'shadow-blue-500/50',
    badge: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
  },
  'C+': {
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    ring: 'stroke-amber-500',
    glow: 'shadow-amber-500/50',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
  },
  'C': {
    gradient: 'from-amber-500 via-yellow-400 to-amber-600',
    ring: 'stroke-amber-500',
    glow: 'shadow-amber-500/50',
    badge: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
  },
  'D': {
    gradient: 'from-orange-500 via-amber-400 to-orange-600',
    ring: 'stroke-orange-500',
    glow: 'shadow-orange-500/50',
    badge: 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30'
  },
  'F': {
    gradient: 'from-red-500 via-rose-400 to-red-600',
    ring: 'stroke-red-500',
    glow: 'shadow-red-500/50',
    badge: 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30'
  }
} as const

const SIZE_CONFIG = {
  sm: {
    circle: 80,
    strokeWidth: 6,
    scoreText: 'text-lg',
    gradeText: 'text-xs',
    labelText: 'text-xs',
    badgeSize: 'text-[10px] px-1.5 py-0.5'
  },
  md: {
    circle: 120,
    strokeWidth: 8,
    scoreText: 'text-3xl',
    gradeText: 'text-sm',
    labelText: 'text-sm',
    badgeSize: 'text-xs px-2 py-1'
  },
  lg: {
    circle: 160,
    strokeWidth: 10,
    scoreText: 'text-4xl',
    gradeText: 'text-base',
    labelText: 'text-base',
    badgeSize: 'text-sm px-3 py-1.5'
  }
}

export function ScienceScore({
  score,
  grade,
  analyzedDomains,
  totalDomains,
  isLoading = false,
  size = 'md',
  className
}: ScienceScoreProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const normalizedGrade = (grade in GRADE_COLORS ? grade : 'F') as ScienceGrade
  const colors = GRADE_COLORS[normalizedGrade]
  const config = SIZE_CONFIG[size]

  const radius = (config.circle - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedProgress / 100) * circumference

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setAnimatedProgress(Math.min(Math.max(score, 0), 100))
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [score, isLoading])

  if (isLoading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 shadow-sm',
          className
        )}
        role="status"
        aria-label="과학 신뢰도 점수 로딩 중"
      >
        <CardContent className="flex flex-col items-center justify-center p-0">
          <div className={cn(
            'rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse',
            size === 'sm' && 'w-20 h-20',
            size === 'md' && 'w-[120px] h-[120px]',
            size === 'lg' && 'w-40 h-40'
          )} />
          <div className="mt-4 h-4 w-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 shadow-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] group',
        colors.glow,
        className
      )}
      role="article"
      aria-label={`과학 신뢰도 점수 ${score}점, 등급 ${grade}`}
    >
      {/* Background Glow */}
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none',
        colors.gradient,
        'blur-3xl'
      )} style={{ opacity: 0.1 }} />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <CardContent className="relative flex flex-col items-center justify-center p-0 gap-4">
        {/* Circular Progress Ring */}
        <div className="relative">
          {/* Outer Glow Ring */}
          <div className={cn(
            'absolute inset-0 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-500',
            `bg-gradient-to-br ${colors.gradient}`
          )} />

          <svg
            width={config.circle}
            height={config.circle}
            className="transform -rotate-90"
            role="img"
            aria-label={`진행률 ${score}%`}
          >
            {/* Background Circle */}
            <circle
              cx={config.circle / 2}
              cy={config.circle / 2}
              r={radius}
              className="stroke-gray-200 dark:stroke-gray-700/50"
              strokeWidth={config.strokeWidth}
              fill="none"
              opacity={0.3}
            />

            {/* Progress Circle */}
            <circle
              cx={config.circle / 2}
              cy={config.circle / 2}
              r={radius}
              className={cn(colors.ring, 'transition-all duration-1000 ease-out drop-shadow-lg')}
              strokeWidth={config.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              role="progressbar"
              aria-valuenow={score}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className={cn(
              'font-bold bg-gradient-to-br bg-clip-text text-transparent',
              colors.gradient,
              config.scoreText
            )}>
              {Math.round(animatedProgress)}
            </div>
            <Badge
              variant="outline"
              className={cn(
                'font-semibold border backdrop-blur-sm',
                colors.badge,
                config.badgeSize
              )}
            >
              {grade}
            </Badge>
          </div>
        </div>

        {/* Label */}
        <div className="flex flex-col items-center gap-1">
          <div className={cn(
            'font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5',
            config.labelText
          )}>
            <Sparkles className={cn(
              size === 'sm' && 'w-3 h-3',
              size === 'md' && 'w-4 h-4',
              size === 'lg' && 'w-5 h-5',
              'text-yellow-500'
            )} />
            과학 신뢰도 점수
          </div>

          {analyzedDomains !== undefined && totalDomains !== undefined && (
            <div className={cn(
              'text-gray-500 dark:text-gray-400',
              size === 'sm' ? 'text-[10px]' : size === 'md' ? 'text-xs' : 'text-sm'
            )}>
              {analyzedDomains}/{totalDomains} 영역 분석 완료
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
