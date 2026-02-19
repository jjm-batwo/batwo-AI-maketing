import type { Metadata } from 'next'
import { auth } from '@/infrastructure/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { AnalyticsClient } from './AnalyticsClient'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '캠페인 분석 | 바투',
  description: '캠페인 성과 데이터를 분석하세요',
}

interface CampaignAnalyticsPageProps {
  params: Promise<{ id: string }>
}

export default async function CampaignAnalyticsPage({ params }: CampaignAnalyticsPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { id } = await params

  // 서버에서 캠페인 데이터 fetch
  const cookieStore = await cookies()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  let campaign = null
  let error = null

  try {
    const res = await fetch(`${baseUrl}/api/campaigns/${id}`, {
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 60, tags: ['campaigns'] }
    })

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      } else {
        error = '캠페인을 불러오는데 실패했습니다'
      }
    } else {
      campaign = await res.json()
    }
  } catch {
    error = '캠페인을 불러오는데 실패했습니다'
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <h2 className="text-xl font-semibold text-red-600">
          캠페인을 찾을 수 없습니다
        </h2>
        <p className="mt-2 text-muted-foreground">
          {error || '캠페인을 불러오는데 실패했습니다'}
        </p>
        <Button asChild className="mt-4">
          <Link href="/campaigns">
            <ArrowLeft className="mr-2 h-4 w-4" />
            캠페인 목록으로
          </Link>
        </Button>
      </div>
    )
  }

  return <AnalyticsClient campaign={campaign} />
}
