'use client'

import { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { MobileSidebar } from './MobileSidebar'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background overflow-hidden relative selection:bg-primary/20">
      {/* Premium Gradient Background */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[80px] opacity-20 mix-blend-multiply dark:mix-blend-screen animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[80px] opacity-20 mix-blend-multiply dark:mix-blend-screen animate-pulse delay-1000" />
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
    </div>
  )
}
