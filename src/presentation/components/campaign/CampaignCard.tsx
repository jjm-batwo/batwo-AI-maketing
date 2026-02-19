'use client'

import { memo, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { MoreVertical, Play, Pause, BarChart3, Pencil, Trash2, Coins, TrendingUp } from 'lucide-react'

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
  ACTIVE: { label: '진행 중', className: 'bg-green-500/15 text-green-500' },
  PAUSED: { label: '일시정지', className: 'bg-yellow-500/15 text-yellow-500' },
  COMPLETED: { label: '완료', className: 'bg-muted text-muted-foreground' },
  DRAFT: { label: '초안', className: 'bg-primary/15 text-primary' },
  PENDING_REVIEW: { label: '검토 중', className: 'bg-purple-500/15 text-purple-500' },
}

const objectiveLabels: Record<string, string> = {
  TRAFFIC: '트래픽',
  CONVERSIONS: '전환',
  BRAND_AWARENESS: '브랜드 인지도',
  REACH: '도달',
  ENGAGEMENT: '참여',
}

export const CampaignCard = memo(function CampaignCard({
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
  const statusInfo = useMemo(() => statusConfig[status], [status])
  const objectiveLabel = useMemo(() => objectiveLabels[objective] || objective, [objective])

  const handlePause = useCallback(() => {
    onStatusChange?.(id, 'PAUSED')
  }, [id, onStatusChange])

  const handleResume = useCallback(() => {
    onStatusChange?.(id, 'ACTIVE')
  }, [id, onStatusChange])

  const formattedBudget = useMemo(() => dailyBudget.toLocaleString(), [dailyBudget])
  const formattedSpend = useMemo(() => spend.toLocaleString(), [spend])
  const formattedRoas = useMemo(() => roas.toFixed(2), [roas])

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
            {objectiveLabel}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/campaigns/${id}/analytics`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  분석 보기
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/campaigns/${id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  수정
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {status === 'ACTIVE' && onStatusChange && (
                <DropdownMenuItem onClick={handlePause}>
                  <Pause className="mr-2 h-4 w-4" />
                  일시정지
                </DropdownMenuItem>
              )}
              {status === 'PAUSED' && onStatusChange && (
                <DropdownMenuItem onClick={handleResume}>
                  <Play className="mr-2 h-4 w-4" />
                  재개
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md text-xs">
            <Coins className="h-3 w-3" /> {formattedBudget}원
          </span>
          <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md text-xs">
            <TrendingUp className="h-3 w-3" /> {formattedSpend}원
          </span>
          <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded-md text-xs">
            <BarChart3 className="h-3 w-3" /> {formattedRoas}x
          </span>
        </div>
      </CardContent>
    </Card>
  )
})
