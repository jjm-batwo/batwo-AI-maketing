import { auth } from '@/infrastructure/auth/auth'
import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { ReportDetailClient } from './ReportDetailClient'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface ReportDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function ReportDetailPage({ params }: ReportDetailPageProps) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login')
  }

  const { id: reportId } = await params

  const cookieStore = await cookies()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  let report = null
  let error = null

  try {
    const res = await fetch(`${baseUrl}/api/reports/${reportId}`, {
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 0 }
    })

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      } else {
        error = '보고서를 불러오는데 실패했습니다'
      }
    } else {
      report = await res.json()
    }
  } catch {
    error = '보고서를 불러오는데 실패했습니다'
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로가기
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" asChild>
          <Link href="/reports">
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로가기
          </Link>
        </Button>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">보고서를 찾을 수 없습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/reports">
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Link>
      </Button>
      <ReportDetailClient report={report} reportId={reportId} />
    </div>
  )
}
