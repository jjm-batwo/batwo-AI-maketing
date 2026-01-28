'use client'

import { useState, useEffect } from 'react'
import { Brain, Heart, Users, Target, Palette, PenTool, type LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type KnowledgeDomain = 'neuromarketing' | 'marketing_psychology' | 'crowd_psychology' | 'meta_best_practices' | 'color_psychology' | 'copywriting_psychology'
type ScienceGrade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F'

interface ScoringFactor {
  description: string
  weight: number
  score: number
}

interface Citation {
  text: string
  source: string
  url?: string
}

interface DomainRecommendation {
  domain: string
  priority: string
  recommendation: string
  impact: string
  evidence: string[]
  actionable: boolean
}

interface DomainScore {
  domain: string  // Changed from KnowledgeDomain to string for flexibility
  score: number
  grade?: string  // Make optional - compute from score if missing
  weight?: number
  factors?: ScoringFactor[]
  evidence?: string[]
  citations?: Citation[]
  recommendations?: DomainRecommendation[]
}

interface DomainBreakdownProps {
  domainScores: DomainScore[]
  analyzedDomains: number
  totalDomains: number
  isLoading?: boolean
  className?: string
}

const DOMAIN_LABELS: Record<KnowledgeDomain, string> = {
  neuromarketing: '신경 마케팅',
  marketing_psychology: '마케팅 심리학',
  crowd_psychology: '군중 심리학',
  meta_best_practices: 'Meta 모범 사례',
  color_psychology: '색채 심리학',
  copywriting_psychology: '카피라이팅 심리학',
}

const DOMAIN_ICONS: Record<KnowledgeDomain, LucideIcon> = {
  neuromarketing: Brain,
  marketing_psychology: Heart,
  crowd_psychology: Users,
  meta_best_practices: Target,
  color_psychology: Palette,
  copywriting_psychology: PenTool,
}

const getGradeFromScore = (score: number): ScienceGrade => {
  if (score >= 95) return 'A+'
  if (score >= 90) return 'A'
  if (score >= 85) return 'B+'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C+'
  if (score >= 60) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

const getDomainLabel = (domain: string): string => {
  return DOMAIN_LABELS[domain as KnowledgeDomain] ?? domain
}

const getDomainIcon = (domain: string): LucideIcon => {
  return DOMAIN_ICONS[domain as KnowledgeDomain] ?? Brain
}

const getScoreColor = (score: number): string => {
  if (score >= 90) return 'bg-gradient-to-r from-emerald-500 to-green-500'
  if (score >= 80) return 'bg-gradient-to-r from-emerald-400 to-green-400'
  if (score >= 70) return 'bg-gradient-to-r from-blue-500 to-cyan-500'
  if (score >= 60) return 'bg-gradient-to-r from-blue-400 to-cyan-400'
  if (score >= 50) return 'bg-gradient-to-r from-yellow-500 to-amber-500'
  if (score >= 40) return 'bg-gradient-to-r from-yellow-400 to-amber-400'
  if (score >= 30) return 'bg-gradient-to-r from-orange-500 to-red-500'
  return 'bg-gradient-to-r from-red-600 to-red-700'
}

const getGradeBadgeColor = (grade: ScienceGrade): string => {
  if (grade === 'A+' || grade === 'A') return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
  if (grade === 'B+' || grade === 'B') return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
  if (grade === 'C+' || grade === 'C') return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30'
  if (grade === 'D') return 'bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30'
  return 'bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30'
}

export function DomainBreakdown({
  domainScores,
  analyzedDomains,
  totalDomains,
  isLoading = false,
  className,
}: DomainBreakdownProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-md',
          className
        )}
      >
        <CardHeader>
          <CardTitle className="text-lg font-semibold">도메인별 분석</CardTitle>
          <p className="text-sm text-muted-foreground">분석 중...</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4" role="status" aria-label="로딩 중">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-6 bg-muted rounded" />
                </div>
                <div className="w-16 h-6 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (domainScores.length === 0) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-md',
          className
        )}
      >
        <CardHeader>
          <CardTitle className="text-lg font-semibold">도메인별 분석</CardTitle>
          <p className="text-sm text-muted-foreground">0/{totalDomains} 도메인 분석 완료</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Brain className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">분석 데이터가 없습니다</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-md',
        className
      )}
    >
      <CardHeader>
        <CardTitle className="text-lg font-semibold">도메인별 분석</CardTitle>
        <p className="text-sm text-muted-foreground">
          {analyzedDomains}/{totalDomains} 도메인 분석 완료
        </p>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4" role="list" aria-label="도메인 점수 목록">
            {domainScores.map((domainScore, index) => {
              const Icon = getDomainIcon(domainScore.domain)
              const grade = domainScore.grade ?? getGradeFromScore(domainScore.score)
              const label = getDomainLabel(domainScore.domain)

              // Get tooltip content from available sources
              const tooltipContent =
                domainScore.factors?.[0]?.description ??
                domainScore.evidence?.[0] ??
                domainScore.recommendations?.[0]?.recommendation

              return (
                <Tooltip key={domainScore.domain}>
                  <TooltipTrigger asChild>
                    <div
                      className="flex items-center gap-3 group cursor-help"
                      role="listitem"
                      style={{
                        transitionDelay: `${index * 100}ms`,
                      }}
                    >
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 group-hover:bg-muted transition-colors">
                        <Icon className="w-5 h-5 text-foreground/70" aria-hidden="true" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-foreground">
                            {label}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-sm font-semibold text-foreground"
                              aria-label={`점수 ${domainScore.score}점`}
                            >
                              {domainScore.score}
                            </span>
                            <Badge
                              variant="outline"
                              className={cn('text-xs font-semibold', getGradeBadgeColor(grade as ScienceGrade))}
                              aria-label={`등급 ${grade}`}
                            >
                              {grade}
                            </Badge>
                          </div>
                        </div>

                        <div className="relative h-2 rounded-full bg-muted/50 overflow-hidden">
                          <div
                            className={cn(
                              'absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out',
                              getScoreColor(domainScore.score)
                            )}
                            style={{
                              width: mounted ? `${domainScore.score}%` : '0%',
                            }}
                            role="progressbar"
                            aria-valuenow={domainScore.score}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${label} 점수`}
                          />
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  {tooltipContent && (
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-sm font-medium mb-1">주요 요인</p>
                      <p className="text-xs text-muted-foreground">{tooltipContent}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  )
}
