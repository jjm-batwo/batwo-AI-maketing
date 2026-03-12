import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { container, DI_TOKENS } from '@/lib/di/container'
import type { IMetaAdsService } from '@application/ports/IMetaAdsService'
import { getMetaAccountForUser } from '@/lib/meta/metaAccountHelper'

export async function GET(request: NextRequest, { params }: { params: Promise<{ adId: string }> }) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { adId } = await params
    const metaAdsService = container.resolve<IMetaAdsService>(DI_TOKENS.MetaAdsService)

    const metaAccount = await getMetaAccountForUser(user.id)
    if (!metaAccount) {
      return NextResponse.json({ message: 'Meta 계정 연결이 필요합니다' }, { status: 400 })
    }

    // getMetaAccountForUser가 내부적으로 safeDecryptToken 적용
    const decryptedToken = metaAccount.accessToken
    const adDetail = await metaAdsService.getAdDetail(decryptedToken, adId)

    return NextResponse.json({ ad: adDetail })
  } catch (error) {
    console.error('Failed to fetch ad detail:', error)
    return NextResponse.json({ message: 'Failed to fetch ad detail' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ adId: string }> }
) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  try {
    const { adId } = await params
    const body = await request.json()
    const metaAdsService = container.resolve<IMetaAdsService>(DI_TOKENS.MetaAdsService)

    const metaAccount = await getMetaAccountForUser(user.id)
    if (!metaAccount) {
      return NextResponse.json({ message: 'Meta 계정 연결이 필요합니다' }, { status: 400 })
    }

    // getMetaAccountForUser가 내부적으로 safeDecryptToken 적용
    const decryptedToken = metaAccount.accessToken
    await metaAdsService.updateAd(decryptedToken, adId, {
      name: body.name,
      status: body.status,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update ad:', error)
    return NextResponse.json({ message: 'Failed to update ad' }, { status: 500 })
  }
}
