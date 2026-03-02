import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { prisma } from '@/lib/prisma'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

type DatePreset = 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_30d' | 'last_90d'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const datePreset = (searchParams.get('datePreset') || 'last_7d') as DatePreset

    const metaAdsService = container.resolve<IMetaAdsService>(DI_TOKENS.MetaAdsService)

    const account = await prisma.metaAdAccount.findFirst({
      where: { userId: user.id },
      select: { accessToken: true },
    })

    if (!account?.accessToken) {
      return NextResponse.json({ message: 'Meta 계정 연결이 필요합니다' }, { status: 400 })
    }

    const accessToken = safeDecryptToken(account.accessToken)
    const insights = await metaAdsService.getAdSetInsights(accessToken, id, datePreset)

    return NextResponse.json(insights)
  } catch (error) {
    console.error('Failed to fetch ad set insights:', error)
    return NextResponse.json({ message: 'Failed to fetch ad set insights' }, { status: 500 })
  }
}
