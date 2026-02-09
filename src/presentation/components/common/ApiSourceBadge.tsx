'use client'

import { cn } from '@/lib/utils'

interface ApiSourceBadgeProps {
  endpoint: string
  permission: string
  className?: string
}

export function ApiSourceBadge({ endpoint, permission, className }: ApiSourceBadgeProps) {
  return (
    <div
      data-testid="api-source-badge"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5',
        'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800',
        'text-[10px] font-mono text-blue-700 dark:text-blue-300',
        className
      )}
    >
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
      <span>{permission}</span>
      <span className="text-blue-400">|</span>
      <span className="text-blue-500 dark:text-blue-400">{endpoint}</span>
    </div>
  )
}
