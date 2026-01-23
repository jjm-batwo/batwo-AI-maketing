'use client'

import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Radio,
  Zap,
  Code,
  Activity,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PixelStatus } from '@/presentation/components/pixel/PixelStatus'
import { UniversalScriptCopy } from '@/presentation/components/pixel/UniversalScriptCopy'

interface Pixel {
  id: string
  metaPixelId: string
  name: string
  isActive: boolean
  setupMethod: 'MANUAL' | 'PLATFORM_API'
  createdAt: string
  updatedAt: string
}

async function fetchPixels(): Promise<Pixel[]> {
  const response = await fetch('/api/pixel')
  if (!response.ok) {
    throw new Error('Failed to fetch pixels')
  }
  const data = await response.json()
  return data.data
}

async function createPixel(data: { metaPixelId: string; name: string }): Promise<Pixel> {
  const response = await fetch('/api/pixel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create pixel')
  }
  return response.json()
}

export default function PixelSettingsPage() {
  const queryClient = useQueryClient()
  const [selectedPixel, setSelectedPixel] = useState<Pixel | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPixelName, setNewPixelName] = useState('')
  const [newPixelId, setNewPixelId] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)

  const { data: pixels, isLoading, error } = useQuery({
    queryKey: ['pixels'],
    queryFn: fetchPixels,
  })

  const createMutation = useMutation({
    mutationFn: createPixel,
    onSuccess: (newPixel) => {
      queryClient.invalidateQueries({ queryKey: ['pixels'] })
      setIsCreateDialogOpen(false)
      setNewPixelName('')
      setNewPixelId('')
      setCreateError(null)
      setSelectedPixel(newPixel)
    },
    onError: (error: Error) => {
      setCreateError(error.message)
    },
  })

  const handleCreatePixel = useCallback(() => {
    setCreateError(null)
    createMutation.mutate({
      metaPixelId: newPixelId.trim(),
      name: newPixelName.trim(),
    })
  }, [createMutation, newPixelId, newPixelName])

  const handleSelectPixel = useCallback((pixel: Pixel) => {
    setSelectedPixel(pixel)
  }, [])

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">픽셀 설치</h1>
        <p className="text-muted-foreground mt-1">
          Meta 픽셀을 설치하여 웹사이트 전환을 추적하세요
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span>픽셀을 불러오는데 실패했습니다</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pixel List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">픽셀 목록</h2>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              새 픽셀 등록
            </Button>
          </div>

          {!pixels || pixels.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Radio className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium">등록된 픽셀이 없습니다</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Meta 픽셀을 등록하면 웹사이트 전환을 추적할 수 있습니다
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    첫 픽셀 등록하기
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pixels.map((pixel) => {
                const isSelected = selectedPixel?.id === pixel.id

                return (
                  <Card
                    key={pixel.id}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-muted/50',
                      isSelected && 'ring-2 ring-primary'
                    )}
                    onClick={() => handleSelectPixel(pixel)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
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
                              pixel.isActive
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {pixel.isActive ? '활성' : '비활성'}
                          </span>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Pixel Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">픽셀 상세</h2>

          {!selectedPixel ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Zap className="mx-auto h-12 w-12" />
                  <p className="mt-4">픽셀을 선택하면 상세 정보가 표시됩니다</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pixel Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    픽셀 상태
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PixelStatus pixelId={selectedPixel.id} />
                </CardContent>
              </Card>

              {/* Installation Script */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    설치 코드
                  </CardTitle>
                  <CardDescription>
                    아래 코드를 웹사이트의 &lt;head&gt; 태그 안에 추가하세요
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UniversalScriptCopy
                    pixel={{
                      id: selectedPixel.id,
                      metaPixelId: selectedPixel.metaPixelId,
                      name: selectedPixel.name,
                    }}
                    baseUrl={typeof window !== 'undefined' ? window.location.origin : ''}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Permission Usage Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">사용 중인 권한</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground">business_management:</span>
              Meta 비즈니스 자산(픽셀 포함)을 관리합니다
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Features */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">픽셀 설치 후 가능한 기능</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              웹사이트 방문자 추적 (PageView)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              전환 이벤트 추적 (Purchase, AddToCart 등)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              리타겟팅 캠페인 생성
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              전환 최적화 광고 운영
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Create Pixel Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 픽셀 등록</DialogTitle>
            <DialogDescription>
              Meta Business Suite에서 생성한 픽셀 ID를 입력해주세요
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pixelName">픽셀 이름</Label>
              <Input
                id="pixelName"
                placeholder="예: 메인 쇼핑몰 픽셀"
                value={newPixelName}
                onChange={(e) => setNewPixelName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pixelId">Meta 픽셀 ID</Label>
              <Input
                id="pixelId"
                placeholder="예: 1234567890123456"
                value={newPixelId}
                onChange={(e) => setNewPixelId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                15-16자리 숫자로 구성된 픽셀 ID를 입력하세요
              </p>
            </div>

            {createError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{createError}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false)
                setCreateError(null)
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleCreatePixel}
              disabled={!newPixelName.trim() || !newPixelId.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  등록 중...
                </>
              ) : (
                '등록'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
