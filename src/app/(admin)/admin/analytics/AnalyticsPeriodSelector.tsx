'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AnalyticsPeriodSelector() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const period = searchParams.get('period') || 'month'

  const handlePeriodChange = (value: string) => {
    router.push(`/admin/analytics?period=${value}`)
  }

  return (
    <Select value={period} onValueChange={handlePeriodChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="week">이번 주</SelectItem>
        <SelectItem value="month">이번 달</SelectItem>
        <SelectItem value="quarter">이번 분기</SelectItem>
      </SelectContent>
    </Select>
  )
}
