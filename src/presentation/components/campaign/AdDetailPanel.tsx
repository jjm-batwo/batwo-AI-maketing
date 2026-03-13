'use client'

import { useMemo, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Save,
  ExternalLink,
  Image as ImageIcon,
  Video,
  Facebook,
  Instagram,
  Loader2,
} from 'lucide-react'
import { useAdDetail, useUpdateAd, useMetaPages } from '@/presentation/hooks/useAdDetail'
import { cn } from '@/lib/utils'

const CTA_OPTIONS = [
  { value: 'SHOP_NOW', label: '지금 쇼핑하기' },
  { value: 'LEARN_MORE', label: '더 알아보기' },
  { value: 'SIGN_UP', label: '가입하기' },
  { value: 'BOOK_TRAVEL', label: '예약하기' },
  { value: 'CONTACT_US', label: '문의하기' },
  { value: 'DOWNLOAD', label: '다운로드' },
  { value: 'GET_OFFER', label: '혜택 받기' },
  { value: 'GET_QUOTE', label: '견적 받기' },
  { value: 'SUBSCRIBE', label: '구독하기' },
  { value: 'WATCH_MORE', label: '더 보기' },
] as const

interface AdDetailPanelProps {
  adId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdDetailPanel({ adId, open, onOpenChange }: AdDetailPanelProps) {
  const { data: adDetail, isLoading, error } = useAdDetail(open ? adId : null)
  const { data: pages } = useMetaPages(open)
  const updateAdMutation = useUpdateAd()

  // Derive initial form data from adDetail (avoid setState in useEffect)
  const initialFormData = useMemo(
    () => ({
      name: adDetail?.name || '',
      status: adDetail?.status || '',
      message: adDetail?.creative?.message || '',
      linkUrl: adDetail?.creative?.linkUrl || '',
      callToAction: adDetail?.creative?.callToAction || '',
    }),
    [adDetail]
  )

  // Track adDetail identity to reset form when it changes
  const adDetailId = adDetail?.id ?? null
  const [trackedId, setTrackedId] = useState(adDetailId)

  // Local form state
  const [formData, setFormData] = useState(initialFormData)
  const [isDirty, setIsDirty] = useState(false)

  // Reset form when adDetail identity changes (synchronous during render, no cascading)
  if (adDetailId !== trackedId) {
    setTrackedId(adDetailId)
    setFormData(initialFormData)
    setIsDirty(false)
  }

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  const handleSave = async () => {
    if (!adId || !isDirty) return

    try {
      await updateAdMutation.mutateAsync({
        adId,
        input: {
          name: formData.name,
          status: formData.status,
        },
      })
      setIsDirty(false)
    } catch (err) {
      console.error('Failed to save ad:', err)
    }
  }

  // Find page name
  const pageName = pages?.find((p) => p.id === adDetail?.creative?.pageId)?.name

  const statusColor =
    formData.status === 'ACTIVE'
      ? 'bg-emerald-500/15 text-emerald-600 border-emerald-200'
      : formData.status === 'PAUSED'
        ? 'bg-amber-500/15 text-amber-600 border-amber-200'
        : 'bg-red-500/15 text-red-600 border-red-200'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[520px] overflow-y-auto p-0">
        <SheetHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-semibold">광고 소재 상세</SheetTitle>
            <div className="flex items-center gap-2">
              {isDirty && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateAdMutation.isPending}
                  className="h-8 gap-1.5"
                >
                  {updateAdMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  저장
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-5 space-y-6">
          {isLoading ? (
            <AdDetailSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">광고 정보를 불러올 수 없습니다</p>
              <p className="text-xs mt-1">{(error as Error).message}</p>
            </div>
          ) : adDetail ? (
            <>
              {/* 미리보기 */}
              {(adDetail.creative?.thumbnailUrl || adDetail.creative?.imageUrl) && (
                <div className="relative rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                  <img
                    src={adDetail.creative.thumbnailUrl || adDetail.creative.imageUrl}
                    alt={adDetail.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute bottom-2 right-2">
                    <Badge variant="secondary" className="gap-1">
                      {adDetail.creative.videoUrl ? (
                        <>
                          <Video className="h-3 w-3" /> 동영상
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-3 w-3" /> 이미지
                        </>
                      )}
                    </Badge>
                  </div>
                </div>
              )}

              {/* 광고 이름 */}
              <div className="space-y-2">
                <Label
                  htmlFor="ad-name"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  광고 이름
                </Label>
                <Input
                  id="ad-name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="h-9"
                />
              </div>

              {/* 상태 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  상태
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => handleFieldChange('status', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue>
                      <Badge variant="outline" className={cn('font-normal', statusColor)}>
                        {formData.status === 'ACTIVE'
                          ? '활성'
                          : formData.status === 'PAUSED'
                            ? '일시중지'
                            : formData.status}
                      </Badge>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">
                      <Badge
                        variant="outline"
                        className="bg-emerald-500/15 text-emerald-600 border-emerald-200"
                      >
                        활성
                      </Badge>
                    </SelectItem>
                    <SelectItem value="PAUSED">
                      <Badge
                        variant="outline"
                        className="bg-amber-500/15 text-amber-600 border-amber-200"
                      >
                        일시중지
                      </Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* 페이지 & 인스타그램 */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  연결 정보
                </h4>

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Facebook className="h-3.5 w-3.5 text-[#1877F2]" />
                    Facebook 페이지
                  </Label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border text-sm">
                    {pageName || adDetail.creative?.pageId || '연결된 페이지 없음'}
                  </div>
                </div>

                {adDetail.creative?.instagramActorId && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Instagram className="h-3.5 w-3.5 text-[#E4405F]" />
                      Instagram 계정
                    </Label>
                    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md border text-sm">
                      {adDetail.creative.instagramActorId}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* 광고 문구 */}
              <div className="space-y-2">
                <Label
                  htmlFor="ad-message"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  광고 문구
                </Label>
                <Textarea
                  id="ad-message"
                  value={formData.message}
                  onChange={(e) => handleFieldChange('message', e.target.value)}
                  rows={4}
                  placeholder="광고에 표시될 메시지를 입력하세요"
                  className="resize-none text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  * 게시된 광고의 문구는 Meta 정책에 따라 새 크리에이티브 생성이 필요할 수 있습니다
                </p>
              </div>

              {/* 랜딩 URL */}
              <div className="space-y-2">
                <Label
                  htmlFor="ad-url"
                  className="text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  랜딩 URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="ad-url"
                    value={formData.linkUrl}
                    onChange={(e) => handleFieldChange('linkUrl', e.target.value)}
                    placeholder="https://"
                    className="h-9 flex-1"
                  />
                  {formData.linkUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => window.open(formData.linkUrl, '_blank')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  행동 유도 버튼 (CTA)
                </Label>
                <Select
                  value={formData.callToAction}
                  onValueChange={(v) => handleFieldChange('callToAction', v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="CTA 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {CTA_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Creative ID (읽기 전용) */}
              <div className="space-y-2 pt-2">
                <Label className="text-[11px] text-muted-foreground">Creative ID</Label>
                <p className="text-xs text-muted-foreground font-mono">{adDetail.creative?.id}</p>
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function AdDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full h-48 rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-full h-9" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-16 h-3" />
        <Skeleton className="w-full h-9" />
      </div>
      <Separator />
      <div className="space-y-2">
        <Skeleton className="w-32 h-3" />
        <Skeleton className="w-full h-10" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-24 h-3" />
        <Skeleton className="w-full h-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="w-20 h-3" />
        <Skeleton className="w-full h-9" />
      </div>
    </div>
  )
}
