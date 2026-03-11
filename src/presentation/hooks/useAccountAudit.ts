import { useQuery } from '@tanstack/react-query'
import type { AuditReport } from '@/domain/value-objects/AuditReport'

export function useAccountAudit() {
  return useQuery<AuditReport>({
    queryKey: ['account-audit'],
    queryFn: async () => {
      const res = await fetch('/api/audit/account')
      if (!res.ok) {
        let errorMsg = '진단 실패'
        try {
          const errData = await res.json()
          errorMsg = errData.error || errorMsg
        } catch (e) {}
        throw new Error(errorMsg)
      }
      const json = await res.json()
      return json.data
    },
    staleTime: 30 * 60 * 1000, // 30분 캐시
  })
}
