'use client'

import { User, Menu, LogOut } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
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

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

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
        <NotificationCenter />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="사용자 메뉴">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name || '사용자'}</p>
              {session?.user?.email && (
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
