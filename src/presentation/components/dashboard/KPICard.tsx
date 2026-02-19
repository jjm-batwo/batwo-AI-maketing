'use client'

import { Card, CardContent } from '@/components/ui/card'
import { SparklineChart } from './SparklineChart'
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
  sparklineData?: number[]
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
      return `${Number(value).toFixed(1)}${unit || '%'}`
    case 'multiplier':
      return `${Number(value).toFixed(1)}${unit || 'x'}`
    case 'number':
    default:
      return `${value.toLocaleString('ko-KR')}${unit || ''}`
  }
}

function formatChange(change: number): string {
  if (change === 0) return '0%'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(2)}%`
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
  sparklineData,
}: KPICardProps) {
  const Icon = icon ? iconMap[icon] : null
  const formattedValue = formatValue(value, format, unit)

  if (isLoading) {
    return (
      <Card className={cn('relative overflow-hidden', className)}>
        <CardContent className="p-4 md:p-6">
          <div data-testid="kpi-skeleton" className="animate-pulse space-y-3">
            <div className="h-4 w-24 rounded bg-muted" />
            <div className="h-8 w-32 rounded bg-muted" />
            <div className="h-4 w-16 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/20 dark:border-white/5 bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 shadow-sm transition-all duration-300 hover:shadow-xl group',
        isLoading && 'animate-pulse',
        className
      )}
      role="article"
      aria-label={`${title}: ${formattedValue}`}
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="flex items-center justify-between space-y-0 pb-2 relative z-10">
        <h3 className="text-sm font-medium text-muted-foreground tracking-wide">{title}</h3>
        {Icon && (
          <div
            data-testid="kpi-icon"
            className={cn("p-2 rounded-lg bg-white/50 dark:bg-white/10 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-300 group-hover:rotate-12")}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="relative z-10 space-y-2">
        <div className="flex items-end justify-between gap-2">
          <div className="text-2xl font-bold tracking-tight text-foreground">
            {formattedValue}
            {unit && <span className="ml-1 text-base font-medium text-muted-foreground align-baseline">{unit}</span>}
          </div>
          {sparklineData && sparklineData.length >= 2 && (
            <SparklineChart
              data={sparklineData}
              color="var(--primary)"
              height={32}
              width={80}
            />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "flex items-center text-xs font-medium px-2 py-0.5 rounded-full ring-1 inset-ring-1",
            (changeType === 'increase' || changeType === 'positive') && "text-green-700 bg-green-50 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400 dark:ring-green-500/30",
            (changeType === 'decrease' || changeType === 'negative') && "text-red-700 bg-red-50 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400 dark:ring-red-500/30",
            changeType === 'neutral' && "text-gray-600 bg-gray-50 ring-gray-500/20 dark:bg-gray-800 dark:text-gray-400"
          )}>
            {(changeType === 'increase' || changeType === 'positive') && (
              <TrendingUp className="h-3 w-3 mr-1" />
            )}
            {(changeType === 'decrease' || changeType === 'negative') && (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {changeType === 'neutral' && (
              <Minus className="h-3 w-3 mr-1" />
            )}
            {formatChange(change)}
          </div>
          <span className="text-xs text-muted-foreground">이전 기간 대비</span>
        </div>
      </div>
    </Card>
  )
}
