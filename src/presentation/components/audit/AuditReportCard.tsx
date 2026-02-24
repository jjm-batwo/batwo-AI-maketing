'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface AuditReportCardProps {
  overall: number
  grade: string
  estimatedWaste: { amount: number; currency: string }
  estimatedImprovement: { amount: number; currency: string }
  totalCampaigns: number
  activeCampaigns: number
}

const gradeColors: Record<string, {
  bg: string
  text: string
  border: string
  stroke: string
  badgeBg: string
}> = {
  A: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    border: 'border-emerald-200',
    stroke: 'stroke-emerald-500',
    badgeBg: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  },
  B: {
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    stroke: 'stroke-blue-500',
    badgeBg: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  C: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    border: 'border-amber-200',
    stroke: 'stroke-amber-500',
    badgeBg: 'bg-amber-100 text-amber-700 border-amber-200',
  },
  D: {
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    stroke: 'stroke-orange-500',
    badgeBg: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  F: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    stroke: 'stroke-red-500',
    badgeBg: 'bg-red-100 text-red-700 border-red-200',
  },
}

function formatAmount(amount: number, currency: string): string {
  if (currency === 'KRW') {
    return `₩${amount.toLocaleString('ko-KR')}`
  }
  return `${currency} ${amount.toLocaleString()}`
}

// SVG 원형 게이지 컴포넌트
function ScoreGauge({ score, grade }: { score: number; grade: string }) {
  const colors = gradeColors[grade] ?? gradeColors['C']
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" aria-hidden="true">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* 배경 트랙 */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          className="text-muted/20"
        />
        {/* 점수 게이지 */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={`${colors.stroke} transition-all duration-700 ease-out`}
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold leading-none ${colors.text}`}>{score}</span>
        <span className="text-xs text-muted-foreground mt-1">/ 100</span>
      </div>
    </div>
  )
}

export function AuditReportCard({
  overall,
  grade,
  estimatedWaste,
  estimatedImprovement,
  totalCampaigns,
  activeCampaigns,
}: AuditReportCardProps) {
  const colors = gradeColors[grade] ?? gradeColors['C']

  return (
    <Card className={`w-full border-2 ${colors.border} ${colors.bg}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-foreground">광고 계정 종합 진단</CardTitle>
          <Badge
            variant="outline"
            className={`text-lg font-bold px-3 py-1 ${colors.badgeBg} border`}
            aria-label={`등급 ${grade}`}
          >
            {grade}등급
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 점수 게이지 + 요약 */}
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <ScoreGauge score={overall} grade={grade} />
            <p className={`text-sm font-semibold ${colors.text}`}>종합 점수</p>
          </div>

          {/* 주요 지표 */}
          <div className="flex-1 grid grid-cols-2 gap-4 w-full">
            <div className="rounded-lg bg-white/80 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">낭비 예상 비용</p>
              <p className="text-lg font-bold text-destructive">
                {formatAmount(estimatedWaste.amount, estimatedWaste.currency)}
              </p>
              <p className="text-xs text-muted-foreground">월 추정</p>
            </div>

            <div className="rounded-lg bg-white/80 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">개선 가능 효과</p>
              <p className="text-lg font-bold text-emerald-600">
                +{formatAmount(estimatedImprovement.amount, estimatedImprovement.currency)}
              </p>
              <p className="text-xs text-muted-foreground">월 추정</p>
            </div>

            <div className="rounded-lg bg-white/80 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">전체 캠페인</p>
              <p className="text-2xl font-bold text-foreground">{totalCampaigns}</p>
              <p className="text-xs text-muted-foreground">개</p>
            </div>

            <div className="rounded-lg bg-white/80 border border-border p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">활성 캠페인</p>
              <p className="text-2xl font-bold text-foreground">{activeCampaigns}</p>
              <p className="text-xs text-muted-foreground">개</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
