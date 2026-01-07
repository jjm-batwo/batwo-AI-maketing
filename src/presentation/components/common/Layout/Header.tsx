'use client'

import { Bell, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { QuotaStatusBadge } from '@/presentation/components/quota/QuotaStatusBadge'
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

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={toggleMobileMenu}
          aria-label="메뉴 열기"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {quotaStatus && (
          <div className="flex items-center gap-2">
            <QuotaStatusBadge
              used={quotaStatus.campaignCreate.used}
              limit={quotaStatus.campaignCreate.limit}
              label="캠페인"
            />
            <QuotaStatusBadge
              used={quotaStatus.aiCopyGen.used}
              limit={quotaStatus.aiCopyGen.limit}
              label="AI 카피"
              period="오늘"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  )
}
