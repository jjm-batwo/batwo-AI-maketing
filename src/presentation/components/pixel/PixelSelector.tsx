'use client'

import { useQuery } from '@tanstack/react-query'
import { Plus, Radio } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Pixel {
  id: string
  metaPixelId: string
  name: string
  isActive: boolean
  setupMethod: 'MANUAL' | 'PLATFORM_API'
  createdAt: string
  updatedAt: string
}

interface PixelSelectorProps {
  onSelect: (pixel: Pixel) => void
  selectedPixelId?: string
  showCreateButton?: boolean
  onCreate?: () => void
}

async function fetchPixels(): Promise<Pixel[]> {
  const response = await fetch('/api/pixel')
  if (!response.ok) {
    throw new Error('Failed to fetch pixels')
  }
  const data = await response.json()
  return data.data
}

export function PixelSelector({
  onSelect,
  selectedPixelId,
  showCreateButton = false,
  onCreate,
}: PixelSelectorProps) {
  const { data: pixels, isLoading, error } = useQuery({
    queryKey: ['pixels'],
    queryFn: fetchPixels,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-2 text-sm text-muted-foreground">픽셀을 불러오는 중...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-600">픽셀을 불러오는데 실패했습니다</p>
        <p className="mt-1 text-xs text-red-500">{error instanceof Error ? error.message : '알 수 없는 오류'}</p>
      </div>
    )
  }

  if (!pixels || pixels.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm text-muted-foreground">등록된 픽셀이 없습니다</p>
        {showCreateButton && (
          <Button onClick={onCreate} className="mt-4" variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            새 픽셀 등록
          </Button>
        )}
      </div>
    )
  }

  const setupMethodLabel = (method: string) => {
    switch (method) {
      case 'MANUAL':
        return '수동 설치'
      case 'PLATFORM_API':
        return '플랫폼 연동'
      default:
        return method
    }
  }

  return (
    <div>
      <ul
        role="list"
        aria-label="픽셀 목록"
        className="space-y-2"
      >
        {pixels.map((pixel) => {
          const isSelected = pixel.id === selectedPixelId

          return (
            <li key={pixel.id}>
              <button
                type="button"
                onClick={() => onSelect(pixel)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelect(pixel)
                  }
                }}
                data-selected={isSelected}
                className={cn(
                  'flex w-full items-center justify-between rounded-lg border p-4 text-left transition-colors',
                  'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  isSelected && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{pixel.name}</p>
                    <p className="text-sm text-muted-foreground">{pixel.metaPixelId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full px-2 py-1 text-xs font-medium',
                      pixel.setupMethod === 'MANUAL'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {setupMethodLabel(pixel.setupMethod)}
                  </span>
                  {isSelected && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>

      {showCreateButton && (
        <Button
          onClick={onCreate}
          variant="outline"
          className="mt-4 w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          새 픽셀 등록
        </Button>
      )}
    </div>
  )
}
