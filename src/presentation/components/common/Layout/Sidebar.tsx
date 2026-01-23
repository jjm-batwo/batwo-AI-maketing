'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Settings,
  HelpCircle,
} from 'lucide-react'

const navigation = [
  { name: '대시보드', href: '/dashboard', icon: LayoutDashboard },
  { name: '캠페인', href: '/campaigns', icon: Megaphone },
  { name: '보고서', href: '/reports', icon: FileText },
  { name: '설정', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-72 flex-col border-r border-white/20 dark:border-white/5 bg-white/50 dark:bg-black/20 backdrop-blur-xl md:flex shadow-sm z-50">
      <div className="flex h-20 items-center px-8">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform duration-300">
            B
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            바투
          </span>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider border border-primary/10">
            Beta
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1.5 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/50 dark:hover:bg-white/5'
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-50" />
              )}
              <item.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span className="relative">{item.name}</span>
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-4">
        <Link
          href="/help"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
        >
          <HelpCircle className="h-5 w-5" />
          도움말
        </Link>
      </div>
    </aside>
  )
}
