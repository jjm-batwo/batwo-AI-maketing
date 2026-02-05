import { auth } from '@/infrastructure/auth'
import { redirect } from 'next/navigation'
import { MainLayout } from '@/presentation/components/common/Layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  return <MainLayout>{children}</MainLayout>
}
