'use client'

import { useQuery } from '@tanstack/react-query'
import { Activity, Server, AlertTriangle, CheckCircle, Database, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrackingHealthDTO } from '@/presentation/components/pixel/PixelStatus'

interface HybridTrackingCardProps {
  pixelId: string
}

async function fetchTrackingHealth(pixelId: string): Promise<TrackingHealthDTO> {
  const response = await fetch(`/api/pixel/${pixelId}/health`)
  if (!response.ok) {
    throw new Error('Failed to fetch tracking health')
  }
  return response.json()
}

export function HybridTrackingCard({ pixelId }: HybridTrackingCardProps) {
  const {
    data: health,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['trackingHealth', pixelId],
    queryFn: () => fetchTrackingHealth(pixelId),
    refetchInterval: 60000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 rounded-lg border bg-card">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">하이브리드 트래킹 상태 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !health) {
    return (
      <div className="p-6 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="font-medium">데이터 로드 실패</h3>
        </div>
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          트래킹 상태를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      </div>
    )
  }

  const browserEvents = health.matchedEventCount + health.unmatchedEventCount
  const capiEvents = health.capiEventsSent

  // Calculate flow discrepancies (e.g. if CAPI events are less than 10% of Browser events)
  const isCapiUnderperforming = browserEvents > 0 && capiEvents < browserEvents * 0.1
  const isHealthyDeduplication =
    capiEvents > 0 && browserEvents > 0 && health.matchRate && health.matchRate >= 0.6

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            하이브리드 트래킹 (Pixel + CAPI)
          </h3>
          {isHealthyDeduplication ? (
            <span className="flex items-center gap-1 text-sm font-medium text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
              <CheckCircle className="h-4 w-4" /> 건강함
            </span>
          ) : (
            <span className="flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
              <Activity className="h-4 w-4" /> 관찰 필요
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          브라우저와 서버 양쪽에서 데이터가 얼마나 잘 수집되고 중복 제거되는지 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
        {/* Browser Pixel Section */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Activity className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-300 border-b border-transparent">
                브라우저 픽셀
              </h4>
              <p className="text-xs text-muted-foreground">클라이언트 사이드 데이터</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-4xl font-bold text-foreground">
                {browserEvents.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground ml-2">수집된 이벤트</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">매칭된 이벤트 (EMQ 추정)</span>
                <span className="font-medium text-green-600">
                  {health.matchedEventCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">매칭 실패</span>
                <span className="font-medium text-amber-600">
                  {health.unmatchedEventCount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Server CAPI Section */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-lg">
              <Server className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
            </div>
            <div>
              <h4 className="font-semibold text-indigo-900 dark:text-indigo-300">
                서버 전환 API (CAPI)
              </h4>
              <p className="text-xs text-muted-foreground">서버 사이드 방어 데이터</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-4xl font-bold text-foreground">
                {capiEvents.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground ml-2">전송된 이벤트</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">전송 실패 (에러)</span>
                <span
                  className={cn(
                    'font-medium',
                    health.capiEventsFailed > 0
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {health.capiEventsFailed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">시효 만료 (7일 초과)</span>
                <span
                  className={cn(
                    'font-medium',
                    health.capiEventsExpired > 0
                      ? 'text-amber-500 dark:text-amber-400'
                      : 'text-muted-foreground'
                  )}
                >
                  {health.capiEventsExpired.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isCapiUnderperforming && (
        <div className="mx-6 mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
          <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">CAPI 전송량이 브라우저에 비해 현저히 적습니다.</p>
            <p className="text-blue-700/80 dark:text-blue-400/80">
              만약 이 현상이 지속된다면 서버 환경(Node.js 혹은 플랫폼 환경)에서 전환 이벤트가
              올바르게 트리거되고 있는지 인프라 코드를 점검해 보세요. 정상적인 하이브리드 세팅이라면
              두 이벤트 수는 비슷하게 유지되며 Meta에서{' '}
              <code className="bg-blue-100 px-1 py-0.5 rounded text-xs">event_id</code> 기반으로
              중복을 제거합니다.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
