'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const locale = useLocale()
  const router = useRouter()

  const toggleLocale = () => {
    const newLocale = locale === 'ko' ? 'en' : 'ko'
    document.cookie = `locale=${newLocale};path=/;max-age=31536000`
    router.refresh()
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className="gap-1.5"
      aria-label={locale === 'ko' ? 'Switch to English' : '한국어로 전환'}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">{locale.toUpperCase()}</span>
    </Button>
  )
}
