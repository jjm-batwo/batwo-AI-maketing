'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Users,
  PieChart,
} from 'lucide-react'
import { AccountPopover } from './AccountPopover'

export function Sidebar() {
  const pathname = usePathname()
  const t = useTranslations()

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('navigation.campaigns'), href: '/campaigns', icon: Megaphone },
    { name: t('navigation.reports'), href: '/reports', icon: FileText },
    { name: t('navigation.competitors'), href: '/competitors', icon: Users },
    { name: t('navigation.portfolio'), href: '/portfolio', icon: PieChart },
  ]

  return (
    <aside
      className="hidden w-60 flex-col border-r border-gray-200 bg-white md:flex shadow-sm z-50"
      aria-label={t('navigation.mainNav')}
    >
      <div className="flex h-20 items-center px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label={t('navigation.goToHome')}
        >
          <div
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-110 transition-transform duration-300"
            aria-hidden="true"
          >
            B
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
            {t('brand.name')}
          </span>
          <span
            className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase tracking-wider border border-primary/10"
            aria-label={t('navigation.betaVersion')}
          >
            Beta
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label={t('navigation.mainMenu')}>
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${t('navigation.goToPage', { page: item.name })}${isActive ? ' ' + t('navigation.currentPage') : ''}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                isActive
                  ? 'bg-gray-100 text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-gray-50'
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                  isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                )}
                aria-hidden="true"
              />
              <span className="relative">{item.name}</span>
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary" aria-hidden="true" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <AccountPopover />
      </div>
    </aside>
  )
}
