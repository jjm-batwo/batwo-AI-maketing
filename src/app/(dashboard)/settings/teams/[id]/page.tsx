import { auth } from '@/infrastructure/auth/auth'
import { redirect } from 'next/navigation'
import { TeamSettings } from '@/presentation/components/team'

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
