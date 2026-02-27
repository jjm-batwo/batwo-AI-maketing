import type { Metadata } from 'next'
import { getAuthenticatedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ReportsClient } from './ReportsClient'

export const metadata: Metadata = {
  title: '보고서 | 바투',
  description: '마케팅 성과 보고서를 확인하고 관리하세요',
}

export default async function ReportsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  type ReportsClientProps = Parameters<typeof ReportsClient>[0]
  let reports: ReportsClientProps['initialReports'] = []
  let error = null

  try {
    const res = await fetch(`${baseUrl}/api/reports`, {
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 120, tags: ['reports'] }
    })

    if (res.ok) {
      const data = await res.json()
      reports = data.reports || []
    } else {
      error = '보고서를 불러오는데 실패했습니다'
    }
  } catch {
    error = '보고서를 불러오는데 실패했습니다'
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="border-b border-border/10 pb-6">
          <h1 className="text-3xl font-bold tracking-tight">보고서</h1>
          <p className="text-muted-foreground mt-2">
            AI가 분석한 주간 성과 보고서를 확인하세요
          </p>
        </div>
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return <ReportsClient initialReports={reports} />
}
