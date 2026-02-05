'use client'

import { PartyPopper, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export function CompletionStep() {
  const t = useTranslations('onboarding.completion')

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <PartyPopper className="h-8 w-8 text-green-600" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        {t('title')}
      </h2>

      <p className="mb-8 text-gray-600">
        {t('description')}
      </p>

      <div className="w-full space-y-4">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <h3 className="mb-2 font-medium text-primary">{t('nextSteps.title')}</h3>
          <ul className="space-y-2 text-left text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              {t('nextSteps.item1')}
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              {t('nextSteps.item2')}
            </li>
            <li className="flex items-center gap-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              {t('nextSteps.item3')}
            </li>
          </ul>
        </div>

        <p className="text-sm text-gray-500">
          {t('helpNote')}
        </p>
      </div>
    </div>
  )
}
