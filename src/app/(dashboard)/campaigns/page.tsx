import { getAuthenticatedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { CampaignsClient } from './CampaignsClient'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2 } from 'lucide-react'
import Link from 'next/link'

export default async function CampaignsPage() {
  const user = await getAuthenticatedUser()
  if (!user) {
    redirect('/login')
  }

  const cookieStore = await cookies()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // Meta 연결 상태 확인
  let isConnected = false
  try {
    const metaRes = await fetch(`${baseUrl}/api/meta/connection`, {
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 0 }
    })
    const metaData = await metaRes.json()
    isConnected = metaData.isConnected || false
  } catch {
    isConnected = false
  }

  // Meta 미연결 시 안내 UI
  if (!isConnected) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-end justify-between border-b border-border/10 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">캠페인</h1>
            <p className="text-muted-foreground mt-2">Meta 광고 캠페인을 관리하세요</p>
          </div>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <Link2 className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Meta 계정을 연결하세요</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              캠페인을 생성하고 관리하려면 먼저 Meta 광고 계정을 연결해야 합니다.
            </p>
            <Button asChild className="bg-[#1877F2] hover:bg-[#1877F2]/90">
              <Link href="/settings/meta-connect">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Meta 계정 연결
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 캠페인 목록 및 KPI 데이터 fetch
  let campaigns: any[] = []
  let kpiData = null

  try {
    const [campaignsRes, kpiRes] = await Promise.all([
      fetch(`${baseUrl}/api/campaigns?pageSize=100`, {
        headers: { Cookie: cookieStore.toString() },
        next: { revalidate: 60, tags: ['campaigns'] }
      }),
      fetch(`${baseUrl}/api/dashboard/kpi?period=today&includeBreakdown=true`, {
        headers: { Cookie: cookieStore.toString() },
        next: { revalidate: 60, tags: ['kpi'] }
      })
    ])

    if (campaignsRes.ok) {
      const data = await campaignsRes.json()
      campaigns = data.campaigns || []
    }

    if (kpiRes.ok) {
      kpiData = await kpiRes.json()
    }
  } catch (error) {
    console.error('Failed to fetch campaigns:', error)
  }

  return <CampaignsClient initialCampaigns={campaigns} initialKpiData={kpiData} />
}
