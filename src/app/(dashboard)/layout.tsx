import { Suspense } from 'react'
import { getAuthenticatedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { MainLayout } from '@/presentation/components/common/Layout'
import { FacebookSDK } from '@/presentation/components/common/FacebookSDK'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser()

  if (!user) {
    const headersList = await headers()
    const pathname = headersList.get('x-pathname') ?? ''
    const search = headersList.get('x-search') ?? ''
    // 상대 경로만 허용 (open redirect 방지)
    const callbackPath =
      pathname && pathname.startsWith('/') ? `${pathname}${search}` : '/dashboard'
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`)
  }

  return (
    <MainLayout>
      {children}
      {/* Facebook SDK - 인증된 사용자의 Meta 통합 기능용 */}
      <Suspense fallback={null}>
        <FacebookSDK />
      </Suspense>
    </MainLayout>
  )
}
