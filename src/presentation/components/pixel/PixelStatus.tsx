'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle, AlertCircle, Clock, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PixelStatusData {
  pixelId: string
  metaPixelId: string
  name: string
  isActive: boolean
  setupMethod: string
  operationalStatus: string
  hasReceivedEvents: boolean
  eventCount: number
  lastEventAt: string | null
  errorMessage?: string
  platformStatus?: string
}

interface PixelStatusProps {
  pixelId: string
  compact?: boolean
}

async function fetchPixelStatus(pixelId: string): Promise<PixelStatusData> {
  const response = await fetch(`/api/pixel/${pixelId}/status`)
  if (!response.ok) {
    throw new Error('Failed to fetch pixel status')
  }
  return response.json()
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return '방금 전'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}일 전`
  return date.toLocaleDateString('ko-KR')
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'ACTIVE':
    case 'RECEIVING_EVENTS':
      return {
        label: '활성',
        color: 'bg-green-500',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
        Icon: CheckCircle,
      }
    case 'PENDING':
    case 'AWAITING_PLATFORM_CONNECT':
    case 'PLATFORM_CONNECTED':
      return {
        label: '대기중',
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
        Icon: Clock,
      }
    case 'ERROR':
    case 'DISCONNECTED':
      return {
        label: '오류',
        color: 'bg-red-500',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
        Icon: AlertCircle,
      }
    default:
      return {
        label: status,
        color: 'bg-gray-500',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
        Icon: Activity,
      }
  }
}

export function PixelStatus({ pixelId, compact = false }: PixelStatusProps) {
  const { data: status, isLoading, error } = useQuery({
    queryKey: ['pixelStatus', pixelId],
    queryFn: () => fetchPixelStatus(pixelId),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div
        data-testid="pixel-status"
        className={cn('flex items-center gap-2', compact && 'compact')}
        role="status"
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">상태 확인 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div
        data-testid="pixel-status"
        className={cn('flex items-center gap-2', compact && 'compact')}
        role="status"
      >
        <AlertCircle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600">상태를 불러올 수 없습니다</span>
      </div>
    )
  }

  if (!status) return null

  const statusConfig = getStatusConfig(status.operationalStatus)
  const { label, color, bgColor, textColor, Icon } = statusConfig

  if (compact) {
    return (
      <div
        data-testid="pixel-status"
        className="compact flex items-center gap-2"
        role="status"
      >
        <div
          data-testid="status-indicator"
          className={cn('h-2 w-2 rounded-full', color)}
        />
        <span className={cn('text-sm', textColor)}>{label}</span>
      </div>
    )
  }

  return (
    <div
      data-testid="pixel-status"
      className="rounded-lg border p-4"
      role="status"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            data-testid="status-indicator"
            className={cn('flex h-10 w-10 items-center justify-center rounded-full', bgColor)}
          >
            <Icon className={cn('h-5 w-5', textColor)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={cn('rounded-full px-2 py-0.5 text-sm font-medium', bgColor, textColor)}>
                {label}
              </span>
              <div className={cn('h-2 w-2 rounded-full', color)} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {status.name}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-2xl font-bold">{status.eventCount}</p>
          <p className="text-sm text-muted-foreground">이벤트</p>
        </div>
        <div className="rounded-lg bg-muted p-3">
          {status.lastEventAt ? (
            <>
              <p className="text-2xl font-bold">{formatRelativeTime(status.lastEventAt)}</p>
              <p className="text-sm text-muted-foreground">마지막 이벤트</p>
            </>
          ) : (
            <>
              <p className="text-xl font-medium text-muted-foreground">-</p>
              <p className="text-sm text-muted-foreground">마지막 이벤트</p>
            </>
          )}
        </div>
      </div>

      {!status.hasReceivedEvents && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3">
          <p className="text-sm text-yellow-800">
            아직 이벤트가 수신되지 않았습니다. 스크립트 설치 후 5-10분 정도 기다려주세요.
          </p>
        </div>
      )}

      {status.errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm font-medium text-red-800">오류 상세</p>
          <p className="mt-1 text-sm text-red-600">{status.errorMessage}</p>
        </div>
      )}
    </div>
  )
}
