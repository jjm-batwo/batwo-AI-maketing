'use client'

import { Menu } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { QuotaStatusBadge } from '@/presentation/components/quota/QuotaStatusBadge'
import { NotificationCenter } from '@/presentation/components/alerts/NotificationCenter'
import { LanguageToggle } from '@/presentation/components/common/LanguageToggle'
import { useUIStore } from '@presentation/stores/uiStore'

interface HeaderProps {
  quotaStatus?: {
    campaignCreate: { used: number; limit: number }
    aiCopyGen: { used: number; limit: number }
    aiAnalysis: { used: number; limit: number }
  }
}

export function Header({ quotaStatus }: HeaderProps) {
  const { toggleMobileMenu } = useUIStore()
  const t = useTranslations()

  return (
    <header className="flex h-20 items-center justify-between px-6 md:px-8 border-b border-gray-200 bg-white sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileMenu}
          aria-label={t('common.openMenu')}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {quotaStatus && (
          <div className="flex items-center gap-2">
            <QuotaStatusBadge
              used={quotaStatus.campaignCreate.used}
              limit={quotaStatus.campaignCreate.limit}
              label={t('header.campaign')}
            />
            <QuotaStatusBadge
              used={quotaStatus.aiCopyGen.used}
              limit={quotaStatus.aiCopyGen.limit}
              label={t('header.aiCopy')}
              period={t('header.today')}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <LanguageToggle />
        <NotificationCenter />
      </div>
    </header>
  )
}
