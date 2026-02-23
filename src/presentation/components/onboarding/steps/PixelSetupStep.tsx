'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Code2, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PixelSelector } from '@presentation/components/pixel/PixelSelector'
import { PlatformSelector, CustomSiteGuide, NaverGuide } from '@presentation/components/pixel'
import { EcommercePlatform } from '@domain/entities/PlatformIntegration'
import { useTranslations } from 'next-intl'

interface SelectedPixel {
  id: string
  metaPixelId: string
  name: string
}

export function PixelSetupStep() {
  const { data: session } = useSession()
  const isMetaConnected = !!session?.user?.metaAccessToken
  const [selectedPixel, setSelectedPixel] = useState<SelectedPixel | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<EcommercePlatform | null>(null)
  const t = useTranslations('onboarding.pixelSetup')

  // 픽셀 선택 핸들러 — 플랫폼 상태도 초기화
  const handlePixelSelect = (pixel: SelectedPixel) => {
    setSelectedPixel(pixel)
    setSelectedPlatform(null)
  }

  // 플랫폼 선택 핸들러
  const handlePlatformSelect = (platform: EcommercePlatform) => {
    setSelectedPlatform(platform)
  }

  // 다른 픽셀 선택 시 모든 선택 초기화
  const handleReset = () => {
    setSelectedPixel(null)
    setSelectedPlatform(null)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://batwo.ai'
  const scriptCode = selectedPixel
    ? `<script src="${baseUrl}/api/pixel/${selectedPixel.id}/tracker.js" async></script>`
    : ''

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
        <Code2 className="h-8 w-8 text-purple-600" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        {t('title')}
      </h2>

      <p className="mb-6 text-gray-600">
        {t('description')}
      </p>

      {/* 분기 1: Meta 미연결 */}
      {!isMetaConnected ? (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left">
            <p className="text-sm text-yellow-800">
              {t('connectFirst')}
            </p>
          </div>
        </div>
      ) : !selectedPixel ? (
        /* 분기 2: 픽셀 미선택 → PixelSelector 표시 */
        <div className="w-full max-w-md">
          <PixelSelector
            onSelect={handlePixelSelect}
            showCreateButton={false}
          />
        </div>
      ) : !selectedPlatform ? (
        /* 분기 3: 픽셀 선택 + 플랫폼 미선택 → PlatformSelector 표시 */
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{selectedPixel.name} {t('selected')}</span>
          </div>

          <PlatformSelector
            onSelect={handlePlatformSelect}
            selectedPlatform={selectedPlatform ?? undefined}
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-500"
          >
            {t('selectOther')}
          </Button>
        </div>
      ) : (
        /* 분기 4: 플랫폼까지 선택 → 플랫폼별 가이드 표시 */
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{selectedPixel.name} {t('selected')}</span>
          </div>

          {/* 카페24: 기존 스크립트 코드 표시 */}
          {selectedPlatform === EcommercePlatform.CAFE24 && (
            <div className="rounded-lg border bg-gray-50 p-4 text-left">
              <h4 className="mb-2 font-medium text-gray-900">{t('installation.title')}</h4>
              <p className="mb-3 text-sm text-gray-600">
                {t('installation.description')}
              </p>
              <div className="relative">
                <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
                  <code>{scriptCode}</code>
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute right-2 top-2"
                  onClick={() => navigator.clipboard.writeText(scriptCode)}
                  aria-label={t('copyCode')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* 자체몰: CustomSiteGuide 렌더링 */}
          {selectedPlatform === EcommercePlatform.CUSTOM && (
            <div className="text-left">
              <CustomSiteGuide pixelId={selectedPixel.id} />
            </div>
          )}

          {/* 네이버: NaverGuide 렌더링 */}
          {selectedPlatform === EcommercePlatform.NAVER_SMARTSTORE && (
            <div className="text-left">
              <NaverGuide pixelId={selectedPixel.id} />
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-gray-500"
          >
            {t('selectOther')}
          </Button>
        </div>
      )}

      <div className="mt-6 rounded-lg bg-gray-50 p-4 text-left">
        <h4 className="mb-2 font-medium text-gray-900">{t('benefits.title')}</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• {t('benefits.item1')}</li>
          <li>• {t('benefits.item2')}</li>
          <li>• {t('benefits.item3')}</li>
          <li>• {t('benefits.item4')}</li>
        </ul>
      </div>

      <p className="mt-4 text-sm text-gray-500">
        {t('installation.skipMessage')}
      </p>
    </div>
  )
}
