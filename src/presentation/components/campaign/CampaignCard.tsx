'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MoreVertical, Play, Pause, BarChart3 } from 'lucide-react'

interface CampaignCardProps {
  id: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'DRAFT' | 'PENDING_REVIEW'
  objective: string
  dailyBudget: number
  spend?: number
  roas?: number
  onStatusChange?: (id: string, status: string) => void
  className?: string
}

const statusConfig = {
  ACTIVE: { label: '진행 중', className: 'bg-green-100 text-green-700' },
  PAUSED: { label: '일시정지', className: 'bg-yellow-100 text-yellow-700' },
  COMPLETED: { label: '완료', className: 'bg-gray-100 text-gray-700' },
  DRAFT: { label: '초안', className: 'bg-blue-100 text-blue-700' },
  PENDING_REVIEW: { label: '검토 중', className: 'bg-purple-100 text-purple-700' },
}

const objectiveLabels: Record<string, string> = {
  TRAFFIC: '트래픽',
  CONVERSIONS: '전환',
  BRAND_AWARENESS: '브랜드 인지도',
  REACH: '도달',
  ENGAGEMENT: '참여',
}

export function CampaignCard({
  id,
  name,
  status,
  objective,
  dailyBudget,
  spend = 0,
  roas = 0,
  onStatusChange,
  className,
}: CampaignCardProps) {
  const statusInfo = statusConfig[status]

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">
            <Link href={`/campaigns/${id}`} className="hover:underline">
              {name}
            </Link>
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {objectiveLabels[objective] || objective}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'rounded-full px-2 py-1 text-xs font-medium',
              statusInfo.className
            )}
          >
            {statusInfo.label}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">일일 예산</p>
            <p className="font-medium">{dailyBudget.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-muted-foreground">지출</p>
            <p className="font-medium">{spend.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-muted-foreground">ROAS</p>
            <p className="font-medium">{roas.toFixed(2)}x</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {status === 'ACTIVE' && onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(id, 'PAUSED')}
            >
              <Pause className="mr-1 h-4 w-4" />
              일시정지
            </Button>
          )}
          {status === 'PAUSED' && onStatusChange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStatusChange(id, 'ACTIVE')}
            >
              <Play className="mr-1 h-4 w-4" />
              재개
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/campaigns/${id}/analytics`}>
              <BarChart3 className="mr-1 h-4 w-4" />
              분석
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
