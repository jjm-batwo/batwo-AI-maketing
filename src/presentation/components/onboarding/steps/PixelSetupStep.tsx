'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Code2, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PixelSelector } from '@presentation/components/pixel/PixelSelector'
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
  const [showScript, setShowScript] = useState(false)
  const t = useTranslations('onboarding.pixelSetup')

  const handlePixelSelect = (pixel: SelectedPixel) => {
    setSelectedPixel(pixel)
    setShowScript(true)
  }

  const scriptCode = selectedPixel
    ? `<script src="https://batwo.ai/api/pixel/${selectedPixel.id}/tracker.js" async></script>`
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

      {!isMetaConnected ? (
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-left">
            <p className="text-sm text-yellow-800">
              {t('connectFirst')}
            </p>
          </div>
        </div>
      ) : !selectedPixel ? (
        <div className="w-full max-w-md">
          <PixelSelector
            onSelect={handlePixelSelect}
            showCreateButton={false}
          />
        </div>
      ) : (
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{selectedPixel.name} {t('selected')}</span>
          </div>

          {showScript && (
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

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedPixel(null)
              setShowScript(false)
            }}
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
