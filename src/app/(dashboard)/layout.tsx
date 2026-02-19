import { Suspense } from 'react'
import { getAuthenticatedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MainLayout } from '@/presentation/components/common/Layout'
import { FacebookSDK } from '@/presentation/components/common/FacebookSDK'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAuthenticatedUser()

  if (!user) {
    redirect('/login')
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
