'use client'

import { memo, Suspense } from 'react'
import type { DashboardWidget } from '@domain/value-objects/DashboardWidget'
import { Skeleton } from '@/components/ui/skeleton'
import dynamic from 'next/dynamic'
import { useBenchmark } from '@/presentation/hooks/useBenchmark'
import { useSavings } from '@/presentation/hooks/useSavings'

// Lazy load widget components for better performance
const KPICard = dynamic(
  () => import('@/presentation/components/dashboard/KPICard').then(m => ({ default: m.KPICard })),
  { loading: () => <WidgetSkeleton /> },
)

const KPIChart = dynamic(
  () => import('@/presentation/components/dashboard/KPIChart').then(m => ({ default: m.KPIChart })),
  { loading: () => <WidgetSkeleton /> },
)

const AIInsights = dynamic(
  () => import('@/presentation/components/dashboard/AIInsights').then(m => ({ default: m.AIInsights })),
  { loading: () => <WidgetSkeleton /> },
)

const CampaignSummaryTable = dynamic(
  () =>
    import('@/presentation/components/dashboard/CampaignSummaryTable').then(m => ({
      default: m.CampaignSummaryTable,
    })),
  { loading: () => <WidgetSkeleton /> },
)

const SavingsWidget = dynamic(
  () =>
    import('@/presentation/components/dashboard/SavingsWidget').then(m => ({
      default: m.SavingsWidget,
    })),
  { loading: () => <WidgetSkeleton /> },
)

const AnomalyAlert = dynamic(
  () =>
    import('@/presentation/components/dashboard/AnomalyAlert').then(m => ({
      default: m.AnomalyAlert,
    })),
  { loading: () => <WidgetSkeleton /> },
)

const DonutChart = dynamic(
  () =>
    import('@/presentation/components/dashboard/DonutChart').then(m => ({
      default: m.DonutChart,
    })),
  { loading: () => <WidgetSkeleton /> },
)

const FunnelChartWidget = dynamic(
  () =>
    import('@/presentation/components/analytics/FunnelChartWidget').then(m => ({
      default: m.FunnelChartWidget,
    })),
  { loading: () => <WidgetSkeleton /> },
)

const BenchmarkCard = dynamic(
  () =>
    import('@/presentation/components/analytics/BenchmarkCard').then(m => ({
      default: m.BenchmarkCard,
    })),
  { loading: () => <WidgetSkeleton /> },
)

const METRIC_CONFIG: Record<string, { title: string; format: 'number' | 'currency' | 'percentage' | 'multiplier'; icon: 'chart' | 'dollar' | 'click' | 'target' | 'eye' }> = {
  roas: { title: 'ROAS', format: 'multiplier', icon: 'target' },
  ctr: { title: 'CTR', format: 'percentage', icon: 'click' },
  cpa: { title: 'CPA', format: 'currency', icon: 'dollar' },
  spend: { title: '광고비', format: 'currency', icon: 'dollar' },
  impressions: { title: '노출수', format: 'number', icon: 'eye' },
  clicks: { title: '클릭수', format: 'number', icon: 'click' },
  conversions: { title: '전환수', format: 'number', icon: 'target' },
}

function WidgetSkeleton() {
  return <Skeleton className="h-full w-full rounded-xl" />
}

function WidgetErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<WidgetSkeleton />}>
      {children}
    </Suspense>
  )
}

/** BenchmarkCard wrapper that fetches its own data */
function BenchmarkWidgetWrapper() {
  const { data, isLoading } = useBenchmark('전자상거래')

  if (isLoading) return <WidgetSkeleton />
  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        벤치마크 데이터를 불러오지 못했습니다
      </div>
    )
  }
  return <BenchmarkCard data={data} />
}

/** SavingsWidget wrapper that fetches its own data */
function SavingsWidgetWrapper() {
  const { data, isLoading } = useSavings()

  return (
    <SavingsWidget
      totalSavings={data?.totalSavings ?? { amount: 0, currency: 'KRW' }}
      totalOptimizations={data?.totalOptimizations ?? 0}
      topSavingEvent={data?.topSavingEvent ?? null}
      isLoading={isLoading}
    />
  )
}

interface WidgetRendererProps {
  widget: DashboardWidget
}

export const WidgetRenderer = memo(function WidgetRenderer({ widget }: WidgetRendererProps) {
  return (
    <WidgetErrorBoundary>
      <div className="h-full w-full overflow-auto p-1">
        <WidgetContent widget={widget} />
      </div>
    </WidgetErrorBoundary>
  )
})

function WidgetContent({ widget }: { widget: DashboardWidget }) {
  switch (widget.type) {
    case 'kpi_card': {
      const metric = widget.config.metric ?? 'roas'
      const metricConfig = METRIC_CONFIG[metric] ?? METRIC_CONFIG.roas
      return (
        <KPICard
          title={widget.config.title ?? metricConfig.title}
          value={0}
          format={metricConfig.format}
          icon={metricConfig.icon}
          className="h-full border-0 shadow-none"
        />
      )
    }

    case 'kpi_chart':
      return (
        <KPIChart
          data={[]}
          chartType={(widget.config.chartType as 'bar' | 'line' | 'area') ?? 'area'}
          className="border-0 shadow-none h-full"
        />
      )

    case 'funnel':
      return <FunnelChartWidget />

    case 'benchmark':
      return <BenchmarkWidgetWrapper />

    case 'ai_insights':
      return <AIInsights className="border-0 shadow-none h-full" />

    case 'campaign_table':
      return <CampaignSummaryTable />

    case 'donut_chart':
      return (
        <DonutChart
          segments={[
            { label: '활성', value: 0, color: '#22c55e' },
            { label: '일시정지', value: 0, color: '#f59e0b' },
            { label: '완료', value: 0, color: '#6b7280' },
          ]}
          centerLabel="캠페인 상태"
          centerValue={0}
        />
      )

    case 'savings':
      return <SavingsWidgetWrapper />

    case 'anomaly_alert':
      return <AnomalyAlert className="border-0 shadow-none h-full" />

    default:
      return (
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          알 수 없는 위젯 타입
        </div>
      )
  }
}
