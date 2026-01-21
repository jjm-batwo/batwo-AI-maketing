import { auth } from '@/infrastructure/auth/auth'
import { redirect } from 'next/navigation'
import { canAccessAdminPanel, GlobalRole } from '@domain/value-objects/GlobalRole'
import { AdminSidebar, AdminHeader } from '@/presentation/components/admin/layout'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // 인증 확인
  if (!session?.user?.id) {
    redirect('/login')
  }

  // 관리자 권한 확인
  const userRole = session.user.globalRole || GlobalRole.USER
  if (!canAccessAdminPanel(userRole)) {
    redirect('/campaigns')
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar />
      <AdminHeader />
      <main className="ml-64 pt-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
