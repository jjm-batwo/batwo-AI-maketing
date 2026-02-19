'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, Megaphone } from 'lucide-react'

interface Ad {
  id: string
  name: string
  status: string
  creativeId?: string
  createdAt?: string
}

const statusLabels: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: '진행 중', className: 'bg-green-500/15 text-green-500' },
  PAUSED: { label: '일시정지', className: 'bg-yellow-500/15 text-yellow-500' },
  DELETED: { label: '삭제됨', className: 'bg-red-500/15 text-red-500' },
  ARCHIVED: { label: '보관됨', className: 'bg-muted text-muted-foreground' },
}

async function fetchAds(adSetId: string): Promise<{ ads: Ad[] }> {
  const response = await fetch(`/api/adsets/${adSetId}/ads`)
  if (!response.ok) throw new Error('광고 조회에 실패했습니다')
  return response.json()
}

interface AdListProps {
  adSetId: string
}

export function AdList({ adSetId }: AdListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['ads', adSetId],
    queryFn: () => fetchAds(adSetId),
    enabled: !!adSetId,
    staleTime: 60 * 1000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const ads = data?.ads || []

  if (ads.length === 0) {
    return (
      <p className="py-2 text-xs text-muted-foreground">광고가 없습니다</p>
    )
  }

  return (
    <div className="space-y-2">
      {ads.map((ad) => {
        const status = statusLabels[ad.status] || statusLabels.ACTIVE
        return (
          <div key={ad.id} className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{ad.name}</span>
            </div>
            <Badge variant="outline" className={status.className}>{status.label}</Badge>
          </div>
        )
      })}
    </div>
  )
}
