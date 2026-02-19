import { getAuthenticatedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { ReportsClient } from './ReportsClient'

export default async function ReportsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  let reports: any[] = []
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return <ReportsClient initialReports={reports} />
}
