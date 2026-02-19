'use client'

import { useFormContext } from 'react-hook-form'
import { ImageIcon, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ExtendedCampaignFormData } from '../CampaignCreateForm/types'

const ctaLabels: Record<string, string> = {
  SHOP_NOW: '지금 구매하기',
  LEARN_MORE: '자세히 알아보기',
  SIGN_UP: '가입하기',
  CONTACT_US: '문의하기',
  GET_OFFER: '할인 받기',
  BOOK_NOW: '지금 예약하기',
  APPLY_NOW: '지금 신청하기',
}

export function AdPreview() {
  const { watch } = useFormContext<ExtendedCampaignFormData>()
  const creative = watch('creative')
  const campaignName = watch('name')

  const hasContent = creative?.headline || creative?.primaryText

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">광고 미리보기</p>
      <div className="rounded-lg border bg-white shadow-sm">
        {/* 페이지 헤더 */}
        <div className="flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-bold text-primary">B</span>
          </div>
          <div>
            <p className="text-sm font-semibold">바투 마케팅</p>
            <p className="text-xs text-muted-foreground">Sponsored</p>
          </div>
        </div>

        {/* 본문 */}
        <div className="px-3 pb-2">
          <p className="text-sm whitespace-pre-wrap">
            {creative?.primaryText || '광고 본문이 여기에 표시됩니다'}
          </p>
        </div>

        {/* 이미지 영역 */}
        <div className="flex aspect-[1.91/1] items-center justify-center bg-gray-100">
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-2 text-xs text-gray-400">
              {creative?.assetIds?.length
                ? `${creative.assetIds.length}개 에셋 선택됨`
                : '이미지가 여기에 표시됩니다'}
            </p>
          </div>
        </div>

        {/* 하단 영역 */}
        {hasContent && (
          <div className="flex items-center justify-between border-t p-3">
            <div className="flex-1 min-w-0">
              {creative?.linkUrl && (
                <p className="truncate text-xs text-muted-foreground uppercase">
                  {(() => {
                    try {
                      return new URL(creative.linkUrl).hostname
                    } catch {
                      return creative.linkUrl
                    }
                  })()}
                </p>
              )}
              <p className="truncate text-sm font-semibold">
                {creative?.headline || '헤드라인'}
              </p>
              {creative?.description && (
                <p className="truncate text-xs text-muted-foreground">
                  {creative.description}
                </p>
              )}
            </div>
            {creative?.callToAction && (
              <Button variant="outline" size="sm" className="ml-3 shrink-0 gap-1">
                {ctaLabels[creative.callToAction] || creative.callToAction}
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        {!hasContent && (
          <div className="border-t p-3 text-center">
            <p className="text-xs text-muted-foreground">
              카피를 입력하면 미리보기가 업데이트됩니다
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
