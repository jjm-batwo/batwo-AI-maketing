'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileSidebar } from './MobileSidebar'
import { ChatPanel } from '@/presentation/components/chat/ChatPanel'
import { useUIStore } from '@/presentation/stores/uiStore'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isChatPanelOpen, toggleChatPanel, unreadAlertCount, ariaLiveMessage } = useUIStore()
  const t = useTranslations()

  return (
    <div className="flex h-screen bg-background overflow-hidden relative selection:bg-primary/20">
      {/* UX-02: Skip to content link (WCAG 2.4.1) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all"
      >
        {t('accessibility.skipToContent')}
      </a>

      {/* UX-08: Global aria-live region for status announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {ariaLiveMessage}
      </div>

      {/* Desktop sidebar - hidden on mobile */}
      <Sidebar />
      {/* Mobile sidebar - Sheet component */}
      <MobileSidebar />
      <div className="flex flex-1 flex-col overflow-hidden relative z-10">
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          {children}
        </main>
      </div>

      {/* Chat Panel - 우측 사이드바 */}
      <ChatPanel />

      {/* Floating Chat Button */}
      {!isChatPanelOpen && (
        <button
          type="button"
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
