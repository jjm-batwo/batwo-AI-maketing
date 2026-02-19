'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileSidebar } from './MobileSidebar'
import { ChatPanel } from '@/presentation/components/chat/ChatPanel'
import { useUIStore } from '@/presentation/stores/uiStore'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isChatPanelOpen, toggleChatPanel, unreadAlertCount } = useUIStore()

  return (
    <div className="flex h-screen bg-background overflow-hidden relative selection:bg-primary/20">
      {/* Premium Gradient Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[360px] h-[360px] bg-primary/10 rounded-full blur-[80px] opacity-10 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute bottom-0 right-1/4 w-[360px] h-[360px] bg-purple-500/10 rounded-full blur-[80px] opacity-10 mix-blend-multiply dark:mix-blend-screen" />
        <div className="absolute inset-0 bg-grid-slate-900/[0.02] dark:bg-grid-slate-400/[0.02] [mask-image:linear-gradient(to_bottom_right,white,transparent,transparent)]" />
      </div>

      {/* Desktop sidebar - hidden on mobile */}
      <Sidebar />
      {/* Mobile sidebar - Sheet component */}
      <MobileSidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">{children}</main>
      </div>

      {/* Chat Panel - 우측 사이드바 */}
      <ChatPanel />

      {/* Floating Chat Button */}
      {!isChatPanelOpen && (
        <button
          data-testid="chat-trigger-button"
          onClick={toggleChatPanel}
          className={cn(
            'fixed bottom-6 right-6 z-40',
            'flex h-14 w-14 items-center justify-center rounded-full',
            'bg-primary text-primary-foreground shadow-lg shadow-primary/25',
            'hover:bg-primary/90 hover:scale-105',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
          )}
          title="AI 어시스턴트"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadAlertCount > 9 ? '9+' : unreadAlertCount}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
