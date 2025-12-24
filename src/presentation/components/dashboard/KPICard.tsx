'use client'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  DollarSign,
  MousePointerClick,
  Target,
  Eye,
} from 'lucide-react'

export type KPIFormat = 'number' | 'currency' | 'percentage' | 'multiplier'
export type ChangeType = 'increase' | 'decrease' | 'neutral' | 'positive' | 'negative'
export type KPIIconType = 'chart' | 'dollar' | 'click' | 'target' | 'eye'

interface KPICardProps {
  title: string
  value: number
  unit?: string
  format?: KPIFormat
  change?: number
  changeType?: ChangeType
  isLoading?: boolean
  icon?: KPIIconType
  className?: string
}

const iconMap: Record<KPIIconType, React.ComponentType<{ className?: string }>> = {
  chart: BarChart3,
  dollar: DollarSign,
  click: MousePointerClick,
  target: Target,
  eye: Eye,
}

function formatValue(value: number, format: KPIFormat, unit?: string): string {
  switch (format) {
    case 'currency':
      return `${value.toLocaleString('ko-KR')}${unit || '원'}`
    case 'percentage':
      return `${value}${unit || '%'}`
    case 'multiplier':
      return `${value}${unit || 'x'}`
    case 'number':
    default:
      return `${value.toLocaleString('ko-KR')}${unit || ''}`
  }
}

function formatChange(change: number): string {
  if (change === 0) return '0%'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change}%`
}

export function KPICard({
  title,
  value,
  unit = '',
  format = 'number',
  change = 0,
  changeType = 'neutral',
  isLoading = false,
  icon,
  className,
}: KPICardProps) {
  const Icon = icon ? iconMap[icon] : null
  const formattedValue = formatValue(value, format, unit)

  if (isLoading) {
    return (
      <Card className={cn('relative overflow-hidden', className)}>
        <CardContent className="p-6">
          <div data-testid="kpi-skeleton" className="animate-pulse space-y-3">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-8 w-32 rounded bg-gray-200" />
            <div className="h-4 w-16 rounded bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn('relative overflow-hidden', className)}
      role="article"
      aria-label={`${title}: ${formattedValue}`}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{formattedValue}</p>
            <div className="flex items-center gap-1">
              {(changeType === 'increase' || changeType === 'positive') && (
                <TrendingUp className="h-4 w-4 text-green-600" />
              )}
              {(changeType === 'decrease' || changeType === 'negative') && (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              {changeType === 'neutral' && (
                <Minus className="h-4 w-4 text-gray-500" />
              )}
              <span
                className={cn(
                  'text-sm font-medium',
                  (changeType === 'increase' || changeType === 'positive') && 'text-green-600',
                  (changeType === 'decrease' || changeType === 'negative') && 'text-red-600',
                  changeType === 'neutral' && 'text-gray-500'
                )}
              >
                {formatChange(change)}
              </span>
            </div>
          </div>
          {Icon && (
            <div
              data-testid="kpi-icon"
              className="rounded-full bg-primary/10 p-3"
            >
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
