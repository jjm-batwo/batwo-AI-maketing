import { useQuery } from '@tanstack/react-query';
import type { FunnelData } from '@/domain/value-objects/FunnelStage';

export function useConversionFunnel(pixelId: string | null, period: string = '30d') {
  return useQuery<FunnelData>({
    queryKey: ['conversion-funnel', pixelId, period],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/funnel?pixelId=${pixelId}&period=${period}`);
      if (!res.ok) throw new Error('퍼널 데이터 로드 실패');
      const json = await res.json();
      return json.data;
    },
    enabled: !!pixelId,
    staleTime: 5 * 60 * 1000,
  });
}
