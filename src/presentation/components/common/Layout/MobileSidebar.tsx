'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  LayoutDashboard,
  Megaphone,
  FileText,
  Users,
  PieChart,
} from 'lucide-react'
import { useUIStore } from '@presentation/stores/uiStore'
import { AccountPopover } from './AccountPopover'

export function MobileSidebar() {
  const pathname = usePathname()
  const { isMobileMenuOpen, closeMobileMenu } = useUIStore()
  const t = useTranslations()

  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('navigation.campaigns'), href: '/campaigns', icon: Megaphone },
    { name: t('navigation.reports'), href: '/reports', icon: FileText },
    { name: t('navigation.competitors'), href: '/competitors', icon: Users },
    { name: t('navigation.portfolio'), href: '/portfolio', icon: PieChart },
  ]

  return (
    <Sheet open={isMobileMenuOpen} onOpenChange={closeMobileMenu}>
      <SheetContent side="left" className="w-60 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle asChild>
            <Link
              href="/"
              className="flex items-center gap-2"
              onClick={closeMobileMenu}
            >
              <span className="text-xl font-bold text-primary">{t('brand.name')}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Beta
              </span>
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="border-t p-3">
          <AccountPopover />
        </div>
      </SheetContent>
    </Sheet>
  )
}
