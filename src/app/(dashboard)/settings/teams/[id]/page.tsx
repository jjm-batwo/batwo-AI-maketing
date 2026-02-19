import type { Metadata } from 'next'
import { auth } from '@/infrastructure/auth/auth'
import { redirect } from 'next/navigation'
import { TeamSettings } from '@/presentation/components/team'

export const metadata: Metadata = {
  title: '팀 상세 | 바투',
  description: '팀 설정과 멤버를 관리하세요',
}

interface TeamSettingsPageProps {
  params: Promise<{ id: string }>
}

export default async function TeamSettingsPage({ params }: TeamSettingsPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { id } = await params

  return (
    <div className="container py-6">
      <TeamSettings teamId={id} userId={session.user.id} />
    </div>
  )
}
