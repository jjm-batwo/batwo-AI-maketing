import type { Metadata } from 'next'
import { auth } from '@/infrastructure/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { CampaignEditClient } from './CampaignEditClient'

export const metadata: Metadata = {
  title: '캠페인 수정 | 바투',
  description: '캠페인 설정을 수정하세요',
}

interface CampaignEditPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignEditPage({ params }: CampaignEditPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { id: campaignId } = await params

  // 서버에서 캠페인 데이터 fetch
  const cookieStore = await cookies()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  let campaign = null
  let fetchError = null

  try {
    const res = await fetch(`${baseUrl}/api/campaigns/${campaignId}`, {
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 60, tags: ['campaigns'] }
    })

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      } else {
        fetchError = '캠페인을 불러오는데 실패했습니다'
      }
    } else {
      campaign = await res.json()
    }
  } catch {
    fetchError = '캠페인을 불러오는데 실패했습니다'
  }

  return <CampaignEditClient campaign={campaign} campaignId={campaignId} fetchError={fetchError} />
}
