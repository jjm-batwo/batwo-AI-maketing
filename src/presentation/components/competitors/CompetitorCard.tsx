'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Megaphone, Star, StarOff, Loader2 } from 'lucide-react'

interface CompetitorCardProps {
  pageName: string
  pageId: string
  adCount: number
  dominantFormats: string[]
  commonHooks: string[]
  averageAdLifespan: number
  isTracked?: boolean
  isTrackLoading?: boolean
  onTrack?: () => void
  onUntrack?: () => void
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
  isTracked = false,
  isTrackLoading = false,
  onTrack,
  onUntrack,
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
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">ID: {pageId}</p>
          {(onTrack || onUntrack) && (
            <Button
              variant={isTracked ? 'outline' : 'secondary'}
              size="sm"
              className="h-7 text-xs"
              disabled={isTrackLoading}
              onClick={isTracked ? onUntrack : onTrack}
            >
              {isTrackLoading ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : isTracked ? (
                <StarOff className="h-3 w-3 mr-1" />
              ) : (
                <Star className="h-3 w-3 mr-1" />
              )}
              {isTracked ? '추적 해제' : '추적'}
            </Button>
          )}
        </div>
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
