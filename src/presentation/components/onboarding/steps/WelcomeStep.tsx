'use client'

import { Sparkles, BarChart3, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function WelcomeStep() {
  const t = useTranslations('onboarding.welcome')

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        {t('title')}
      </h2>

      <p className="mb-8 text-gray-600">
        {t('description')}
      </p>

      <div className="grid w-full gap-4">
        <div className="flex items-start gap-4 rounded-lg border p-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t('feature1.title')}</h3>
            <p className="text-sm text-gray-500">
              {t('feature1.description')}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-lg border p-4 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-100">
            <Zap className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{t('feature2.title')}</h3>
            <p className="text-sm text-gray-500">
              {t('feature2.description')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
