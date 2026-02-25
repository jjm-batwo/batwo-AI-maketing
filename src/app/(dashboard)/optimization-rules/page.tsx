import type { Metadata } from 'next'
import { getAuthenticatedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { OptimizationRulesClient } from './OptimizationRulesClient'

export const metadata: Metadata = {
  title: '최적화 규칙 | 바투',
  description: '캠페인 자동 최적화 규칙을 관리하세요',
}

export default async function OptimizationRulesPage() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  // 캠페인 목록 fetch (규칙 필터용)
  let campaigns: { id: string; name: string; status: string }[] = []
  try {
    const res = await fetch(`${baseUrl}/api/campaigns?pageSize=100`, {
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 60, tags: ['campaigns'] },
    })
    if (res.ok) {
      const data = await res.json()
      campaigns = (data.campaigns || []).map((c: { id: string; name: string; status: string }) => ({
        id: c.id,
        name: c.name,
        status: c.status,
      }))
    }
  } catch {
    // silent fail — show empty campaigns list
  }

  // 전체 규칙 fetch
  let rules: {
    id: string
    campaignId: string
    userId: string
    name: string
    ruleType: 'CPA_THRESHOLD' | 'ROAS_FLOOR' | 'BUDGET_PACE' | 'CREATIVE_FATIGUE'
    conditions: { metric: string; operator: string; value: number }[]
    actions: { type: string; params: Record<string, unknown> }[]
    isEnabled: boolean
    lastTriggeredAt: string | null
    triggerCount: number
    cooldownMinutes: number
    createdAt: string
    updatedAt: string
  }[] = []
  try {
    const res = await fetch(`${baseUrl}/api/optimization-rules`, {
      headers: { Cookie: cookieStore.toString() },
      next: { revalidate: 60, tags: ['optimization-rules'] },
    })
    if (res.ok) {
      const data = await res.json()
      rules = data.rules || []
    }
  } catch {
    // silent fail — show empty rules list
  }

  return <OptimizationRulesClient initialRules={rules} campaigns={campaigns} />
}
