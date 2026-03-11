'use client'

import { Menu, Sun, Moon, Monitor } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
  const { setTheme, theme } = useTheme()

  return (
    <header className="flex h-20 items-center justify-between px-6 md:px-8 border-b border-border bg-background sticky top-0 z-40">
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
        {/* Dark Mode Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('common.toggleTheme')}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">{t('common.toggleTheme')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')} className={theme === 'light' ? 'bg-accent' : ''}>
              <Sun className="mr-2 h-4 w-4" />
              {t('common.themeLight')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')} className={theme === 'dark' ? 'bg-accent' : ''}>
              <Moon className="mr-2 h-4 w-4" />
              {t('common.themeDark')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')} className={theme === 'system' ? 'bg-accent' : ''}>
              <Monitor className="mr-2 h-4 w-4" />
              {t('common.themeSystem')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <LanguageToggle />
        <NotificationCenter />
      </div>
    </header>
  )
}

