'use client'

import { Play, Pause, CheckCircle, Trash2, FlaskConical, TrendingUp, Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { ABTest } from '@/presentation/hooks/useABTests'

interface ABTestCardProps {
  abTest: ABTest
  onStart?: (id: string) => void
  onPause?: (id: string) => void
  onComplete?: (id: string) => void
  onDelete?: (id: string) => void
  isLoading?: boolean
}

const statusConfig = {
  DRAFT: {
    label: '초안',
    color: 'bg-muted text-muted-foreground',
  },
  RUNNING: {
    label: '실행 중',
    color: 'bg-green-500/15 text-green-500',
  },
  PAUSED: {
    label: '일시정지',
    color: 'bg-yellow-500/15 text-yellow-500',
  },
  COMPLETED: {
    label: '완료',
    color: 'bg-blue-500/15 text-blue-500',
  },
}

export function ABTestCard({
  abTest,
  onStart,
  onPause,
  onComplete,
  onDelete,
  isLoading,
}: ABTestCardProps) {
  const status = statusConfig[abTest.status]
  const { statisticalResult } = abTest
  const control = abTest.variants.find((v) => v.isControl)
  const treatment = abTest.variants.find((v) => !v.isControl)

  const totalSamples = abTest.variants.reduce((sum, v) => sum + v.clicks, 0)
  const sampleProgress = Math.min((totalSamples / abTest.minimumSampleSize) * 100, 100)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">{abTest.name}</CardTitle>
          </div>
          <Badge className={status.color}>{status.label}</Badge>
        </div>
        {abTest.description && (
          <p className="text-sm text-muted-foreground mt-1">{abTest.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Variants comparison */}
        <div className="grid grid-cols-2 gap-4">
          {control && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">컨트롤</Badge>
                <span className="text-sm font-medium">{control.name}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">클릭</span>
                  <span>{control.clicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">전환</span>
                  <span>{control.conversions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">전환율</span>
                  <span>{control.conversionRate.toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}
          {treatment && (
            <div className={cn(
              'p-3 rounded-lg',
              statisticalResult.winner?.id === treatment.id
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50'
            )}>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs bg-purple-50">변형</Badge>
                <span className="text-sm font-medium">{treatment.name}</span>
                {statisticalResult.winner?.id === treatment.id && (
                  <Award className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">클릭</span>
                  <span>{treatment.clicks.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">전환</span>
                  <span>{treatment.conversions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-medium">
                  <span className="text-muted-foreground">전환율</span>
                  <span className={cn(
                    statisticalResult.uplift > 0 && 'text-green-600'
                  )}>
                    {treatment.conversionRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistical significance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">샘플 수</span>
            <span>{totalSamples.toLocaleString()} / {abTest.minimumSampleSize.toLocaleString()}</span>
          </div>
          <Progress value={sampleProgress} className="h-2" />
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">통계적 유의성</div>
            <div className="flex items-center gap-2">
              {statisticalResult.isSignificant ? (
                <>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-medium">
                    유의미 (신뢰도 {statisticalResult.confidence.toFixed(1)}%)
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  아직 유의미하지 않음 ({statisticalResult.confidence.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
          {statisticalResult.uplift !== 0 && (
            <div className="text-right">
              <div className="text-sm text-muted-foreground">개선율</div>
              <div className={cn(
                'font-semibold',
                statisticalResult.uplift > 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {statisticalResult.uplift > 0 ? '+' : ''}{statisticalResult.uplift.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {abTest.status === 'DRAFT' && (
            <Button
              size="sm"
              onClick={() => onStart?.(abTest.id)}
              disabled={isLoading}
              className="flex-1"
            >
              <Play className="h-4 w-4 mr-1" />
              시작
            </Button>
          )}
          {abTest.status === 'RUNNING' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPause?.(abTest.id)}
                disabled={isLoading}
                className="flex-1"
              >
                <Pause className="h-4 w-4 mr-1" />
                일시정지
              </Button>
              <Button
                size="sm"
                onClick={() => onComplete?.(abTest.id)}
                disabled={isLoading}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                완료
              </Button>
            </>
          )}
          {abTest.status === 'PAUSED' && (
            <>
              <Button
                size="sm"
                onClick={() => onStart?.(abTest.id)}
                disabled={isLoading}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-1" />
                재시작
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onComplete?.(abTest.id)}
                disabled={isLoading}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                완료
              </Button>
            </>
          )}
          {(abTest.status === 'DRAFT' || abTest.status === 'COMPLETED') && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete?.(abTest.id)}
              disabled={isLoading}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
