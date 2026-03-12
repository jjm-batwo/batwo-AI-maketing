'use client'

import { useConversionFunnel } from '@/presentation/hooks/useConversionFunnel'
import { FunnelChart } from './FunnelChart'
import { Skeleton } from '@/components/ui/skeleton'

// pixelId should ideally come from a global store or context
export function FunnelChartWidget({
  pixelId,
  period = '30d',
}: {
  pixelId?: string | null
  period?: string
}) {
  // If pixelId is not provided, we might want to skip or use a default one
  const { data, isLoading, error } = useConversionFunnel(pixelId || null, period)

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full rounded-xl" />
  }

  if (error || !data) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-6 flex items-center justify-center h-[300px]">
        <p className="text-muted-foreground">퍼널 데이터를 불러오지 못했습니다.</p>
      </div>
    )
  }

  return <FunnelChart data={data} />
}
