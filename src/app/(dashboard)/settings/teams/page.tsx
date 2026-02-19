import type { Metadata } from 'next'
import { TeamList } from '@/presentation/components/team'

export const metadata: Metadata = {
  title: '팀 관리 | 바투',
  description: '팀원을 초대하고 권한을 관리하세요',
}

export default function TeamsPage() {
  return (
    <div className="container py-6">
      <TeamList />
    </div>
  )
}
