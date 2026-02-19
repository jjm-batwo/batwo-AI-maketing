'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'

interface FormatDistribution {
  format: string
  percentage: number
}

interface TrendChartProps {
  formatDistribution: FormatDistribution[]
  popularHooks: string[]
  commonOffers: string[]
}

const formatLabels: Record<string, string> = {
  carousel: '캐러셀',
  single_image_long_copy: '싱글 이미지',
  video: '동영상',
  collection: '컬렉션',
  instant_experience: '인스턴트 경험',
}

const BAR_COLORS = [
  'bg-blue-500',
  'bg-violet-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
]

export function TrendChart({ formatDistribution, popularHooks, commonOffers }: TrendChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4" />
          광고 트렌드
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-3">포맷 분포</p>
          <div className="space-y-2">
            {formatDistribution.map((item, index) => (
              <div key={item.format} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatLabels[item.format] ?? item.format}</span>
                  <span>{item.percentage}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${BAR_COLORS[index % BAR_COLORS.length]}`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">인기 광고 훅</p>
          <div className="flex flex-wrap gap-1.5">
            {popularHooks.map((hook) => (
              <Badge key={hook} variant="secondary" className="text-xs">
                {hook}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">주요 오퍼</p>
          <div className="flex flex-wrap gap-1.5">
            {commonOffers.map((offer) => (
              <Badge key={offer} variant="outline" className="text-xs">
                {offer}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
