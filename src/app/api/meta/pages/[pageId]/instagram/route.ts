import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { getMetaAccountForUser } from '@/lib/meta/metaAccountHelper'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { pageId } = await params
    const metaAdsService = container.resolve<IMetaAdsService>(DI_TOKENS.MetaAdsService)

    const metaAccount = await getMetaAccountForUser(user.id)
    if (!metaAccount) {
      return NextResponse.json({ message: 'Meta 계정 연결이 필요합니다' }, { status: 400 })
    }

    const accounts = await metaAdsService.listInstagramAccounts(metaAccount.accessToken, pageId)

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('Failed to fetch Instagram accounts:', error)
    return NextResponse.json({ message: 'Failed to fetch Instagram accounts' }, { status: 500 })
  }
}
