'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Megaphone } from 'lucide-react'

interface CompetitorCardProps {
  pageName: string
  pageId: string
  adCount: number
  dominantFormats: string[]
  commonHooks: string[]
  averageAdLifespan: number
}

const formatLabels: Record<string, string> = {
  carousel: '캐러셀',
  single_image_long_copy: '싱글 이미지',
  video: '동영상',
  collection: '컬렉션',
  instant_experience: '인스턴트 경험',
}

export function CompetitorCard({
  pageName,
  pageId,
  adCount,
  dominantFormats,
  commonHooks,
  averageAdLifespan,
}: CompetitorCardProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-semibold leading-tight">
            {pageName}
          </CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
            <Megaphone className="h-3.5 w-3.5" />
            <span>{adCount}개 광고</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">ID: {pageId}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">주요 포맷</p>
          <div className="flex flex-wrap gap-1">
            {dominantFormats.map((format) => (
              <Badge key={format} variant="secondary" className="text-xs">
                {formatLabels[format] ?? format}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">주요 훅</p>
          <div className="flex flex-wrap gap-1">
            {commonHooks.map((hook) => (
              <Badge key={hook} variant="outline" className="text-xs">
                {hook}
              </Badge>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>평균 광고 수명 <strong className="text-foreground">{averageAdLifespan}일</strong></span>
        </div>
      </CardContent>
    </Card>
  )
}
