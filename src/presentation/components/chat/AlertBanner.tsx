'use client'

import { cn } from '@/lib/utils'
import { AlertTriangle, Info, AlertCircle, X, MessageSquare } from 'lucide-react'

interface AlertBannerItem {
  id: string
  type: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  title: string
  message: string
  data: Record<string, unknown> | null
}

interface AlertBannerProps {
  alerts: AlertBannerItem[]
  onDismiss: (id: string) => void
  onAnalyze: (message: string) => void
}

export function AlertBanner({ alerts, onDismiss, onAnalyze }: AlertBannerProps) {
  if (alerts.length === 0) return null

  return (
    <div className="space-y-1 px-3 py-2">
      {alerts.slice(0, 3).map((alert) => (
        <AlertBannerItem
          key={alert.id}
          alert={alert}
          onDismiss={() => onDismiss(alert.id)}
          onAnalyze={() => {
            const campaignName = (alert.data?.campaignName as string) || ''
            onAnalyze(`${campaignName} ${alert.title} 자세히 분석해줘`)
          }}
        />
      ))}
    </div>
  )
}

function AlertBannerItem({
  alert,
  onDismiss,
  onAnalyze,
}: {
  alert: AlertBannerItem
  onDismiss: () => void
  onAnalyze: () => void
}) {
  const severityConfig = {
    INFO: {
      icon: Info,
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-300',
      iconColor: 'text-blue-500',
    },
    WARNING: {
      icon: AlertTriangle,
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
      text: 'text-yellow-700 dark:text-yellow-300',
      iconColor: 'text-yellow-500',
    },
    CRITICAL: {
      icon: AlertCircle,
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      text: 'text-red-700 dark:text-red-300',
      iconColor: 'text-red-500',
    },
  }

  const config = severityConfig[alert.severity]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        config.bg,
        config.border
      )}
    >
      <div className="flex items-start gap-2">
        <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.iconColor)} />
        <div className="flex-1 min-w-0">
          <div className={cn('text-xs font-medium', config.text)}>
            {alert.title}
          </div>
          <div className={cn('text-[10px] mt-0.5 line-clamp-2', config.text, 'opacity-80')}>
            {alert.message}
          </div>
          <button
            onClick={onAnalyze}
            className={cn(
              'flex items-center gap-1 mt-1.5 text-[10px] font-medium',
              config.text,
              'hover:underline'
            )}
          >
            <MessageSquare className="h-3 w-3" />
            자세히 분석하기
          </button>
        </div>
        <button
          onClick={onDismiss}
          className={cn(
            'shrink-0 rounded p-0.5',
            'hover:bg-black/5 dark:hover:bg-white/5',
            'transition-colors'
          )}
        >
          <X className={cn('h-3.5 w-3.5', config.text, 'opacity-60')} />
        </button>
      </div>
    </div>
  )
}
