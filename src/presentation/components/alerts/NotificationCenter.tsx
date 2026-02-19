'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAlerts, Alert, AnomalySeverity } from '@/presentation/hooks/useAlerts'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'
import { useTranslations, useLocale } from 'next-intl'

const severityStyles: Record<
  AnomalySeverity,
  { icon: typeof AlertCircle; color: string; bgColor: string }
> = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
}

const typeIcons = {
  spike: TrendingUp,
  drop: TrendingDown,
  trend_change: TrendingUp,
  budget_anomaly: DollarSign,
}

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const { data, isLoading } = useAlerts()
  const t = useTranslations()
  const locale = useLocale()

  const alerts = data?.alerts ?? []
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length
  const warningCount = alerts.filter((a) => a.severity === 'warning').length
  const totalCount = alerts.length

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('relative', className)}
          aria-label={t('notifications.open')}
        >
          <Bell className="h-5 w-5" />
          {totalCount > 0 && (
            <span
              className={cn(
                'absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium text-white',
                criticalCount > 0 ? 'bg-red-500' : 'bg-yellow-500'
              )}
            >
              {totalCount > 99 ? '99+' : totalCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            {t('notifications.title')}
            {totalCount > 0 && (
              <div className="flex gap-1">
                {criticalCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {t('notifications.severity.critical')} {criticalCount}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">
                    {t('notifications.severity.warning')} {warningCount}
                  </Badge>
                )}
              </div>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="mt-4 h-[calc(100vh-120px)]">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 font-medium text-gray-900">{t('notifications.empty.title')}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('notifications.empty.description')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onNavigate={() => setOpen(false)}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

interface AlertItemProps {
  alert: Alert
  onNavigate: () => void
  locale: string
}

function AlertItem({ alert, onNavigate, locale }: AlertItemProps) {
  const t = useTranslations()
  const severityStyle = severityStyles[alert.severity]
  const SeverityIcon = severityStyle.icon
  const TypeIcon = typeIcons[alert.type]

  const timeAgo = formatDistanceToNow(new Date(alert.detectedAt), {
    addSuffix: true,
    locale: locale === 'ko' ? ko : enUS,
  })

  const formatValue = (value: number, metric: string) => {
    if (metric === 'ROAS') return value.toFixed(2)
    if (metric === 'CTR' || metric === t('notifications.metrics.conversionRate')) return `${value.toFixed(2)}%`
    if (metric === 'CPA' || metric === t('notifications.metrics.spend')) return `${value.toLocaleString()}${t('currency.suffix')}`
    return value.toLocaleString()
  }

  return (
    <Link
      href={`/campaigns/${alert.campaignId}`}
      onClick={onNavigate}
      className={cn(
        'block rounded-lg border p-4 transition-colors hover:bg-gray-50',
        severityStyle.bgColor
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full bg-white',
            severityStyle.color
          )}
        >
          <TypeIcon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                alert.severity === 'critical' && 'border-red-300 text-red-700',
                alert.severity === 'warning' && 'border-yellow-300 text-yellow-700',
                alert.severity === 'info' && 'border-blue-300 text-blue-700'
              )}
            >
              <SeverityIcon className="mr-1 h-3 w-3" />
              {t(`notifications.severity.${alert.severity}`)}
            </Badge>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <h4 className="mt-1 font-medium text-sm truncate">
            {alert.campaignName}
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            {alert.message}
          </p>
          <div className="mt-2 flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              {t('notifications.metrics.previous')}: {formatValue(alert.previousValue, alert.metric)}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className={cn(
              alert.changePercent > 0 && alert.metric === 'ROAS' && 'text-green-600',
              alert.changePercent < 0 && alert.metric === 'ROAS' && 'text-red-600',
              alert.changePercent > 0 && alert.metric !== 'ROAS' && alert.type !== 'drop' && 'text-red-600',
              alert.changePercent < 0 && alert.metric !== 'ROAS' && alert.type === 'drop' && 'text-red-600',
            )}>
              {t('notifications.metrics.current')}: {formatValue(alert.currentValue, alert.metric)}
            </span>
            <span className={cn(
              'font-medium',
              alert.changePercent > 0 ? 'text-green-600' : 'text-red-600'
            )}>
              ({alert.changePercent > 0 ? '+' : ''}{alert.changePercent.toFixed(1)}%)
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
