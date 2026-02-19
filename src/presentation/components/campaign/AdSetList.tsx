'use client'

import { useAdSets } from '@/presentation/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Layers } from 'lucide-react'

const statusLabels: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: '진행 중', className: 'bg-green-500/15 text-green-500' },
  PAUSED: { label: '일시정지', className: 'bg-yellow-500/15 text-yellow-500' },
  DELETED: { label: '삭제됨', className: 'bg-red-500/15 text-red-500' },
  ARCHIVED: { label: '보관됨', className: 'bg-muted text-muted-foreground' },
}

interface AdSetListProps {
  campaignId: string
}

export function AdSetList({ campaignId }: AdSetListProps) {
  const { data, isLoading } = useAdSets(campaignId)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const adSets = data?.adSets || []

  if (adSets.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-5 w-5" />
            광고 세트
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">광고 세트가 없습니다</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-5 w-5" />
          광고 세트 ({adSets.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {adSets.map((adSet) => {
            const status = statusLabels[adSet.status] || statusLabels.ACTIVE
            return (
              <div key={adSet.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="font-medium text-sm">{adSet.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {adSet.dailyBudget ? `일일 ${adSet.dailyBudget.toLocaleString()}원` : '예산 미설정'}
                    {' · '}
                    {adSet.startDate ? new Date(adSet.startDate).toLocaleDateString('ko-KR') : ''}
                    {adSet.endDate ? ` ~ ${new Date(adSet.endDate).toLocaleDateString('ko-KR')}` : ''}
                  </p>
                </div>
                <Badge className={status.className}>{status.label}</Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
