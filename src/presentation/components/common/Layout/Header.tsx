'use client'

import { User, Menu, LogOut } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const { data: session } = useSession()
  const t = useTranslations()

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="flex h-20 items-center justify-between px-6 md:px-8 border-b border-white/20 dark:border-white/5 bg-white/30 dark:bg-black/10 backdrop-blur-md sticky top-0 z-40">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t('header.userMenu')}>
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name || t('common.user')}</p>
              {session?.user?.email && (
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              {t('navigation.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
