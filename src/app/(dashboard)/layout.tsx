import { MainLayout } from '@/presentation/components/common/Layout'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MainLayout>{children}</MainLayout>
}
