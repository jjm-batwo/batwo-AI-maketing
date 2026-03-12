import { useQuery } from '@tanstack/react-query'
import type { IndustryBenchmarkData } from '@/domain/value-objects/IndustryBenchmark'

export function useBenchmark(industry: string, period: number = 30) {
  return useQuery<IndustryBenchmarkData>({
    queryKey: ['benchmark', industry, period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/benchmark?industry=${industry}&period=${period}`)
      if (!res.ok) throw new Error('벤치마크 로드 실패')
      const json = await res.json()
      return json.data
    },
    staleTime: 30 * 60 * 1000,
  })
}
