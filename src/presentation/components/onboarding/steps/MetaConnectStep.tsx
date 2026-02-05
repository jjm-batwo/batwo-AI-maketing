'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Facebook, CheckCircle2, ExternalLink, BarChart3, Zap, Building2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export function MetaConnectStep() {
  const { data: session } = useSession()
  const isMetaConnected = !!session?.user?.metaAccessToken
  const t = useTranslations('onboarding.metaConnect')
  const tMeta = useTranslations('metaConnect.whyConnect')

  const permissions = [
    {
      icon: BarChart3,
      title: tMeta('permissions.adsRead.title'),
      description: tMeta('permissions.adsRead.description'),
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      icon: Zap,
      title: tMeta('permissions.adsManagement.title'),
      description: tMeta('permissions.adsManagement.description'),
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      icon: Building2,
      title: tMeta('permissions.businessManagement.title'),
      description: tMeta('permissions.businessManagement.description'),
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      icon: Users,
      title: tMeta('permissions.pagesAccess.title'),
      description: tMeta('permissions.pagesAccess.description'),
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
  ]

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
        <Facebook className="h-8 w-8 text-blue-600" />
      </div>

      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        {t('title')}
      </h2>

      <p className="mb-6 text-gray-600">
        {t('description')}
      </p>

      {isMetaConnected ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-green-700">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{t('connected')}</span>
          </div>
          <p className="text-sm text-gray-500">
            {t('connectedNext')}
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Why Connect Section */}
          <div className="w-full rounded-lg border bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <h3 className="mb-3 font-semibold text-gray-900 text-left">{tMeta('title')}</h3>
            <div className="grid gap-3">
              {permissions.map((perm, index) => (
                <div key={index} className="flex items-start gap-3 text-left">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${perm.bg}`}>
                    <perm.icon className={`h-4 w-4 ${perm.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{perm.title}</p>
                    <p className="text-xs text-gray-600">{perm.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button asChild size="lg" className="gap-2 w-full">
            <Link href="/settings/meta-connect">
              <Facebook className="h-5 w-5" />
              {t('connectButton')}
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>

          <p className="text-sm text-gray-500">
            {t('connectLater')}
          </p>
        </div>
      )}
    </div>
  )
}
