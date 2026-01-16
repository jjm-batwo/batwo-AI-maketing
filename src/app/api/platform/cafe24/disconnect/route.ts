import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Cafe24Adapter } from '@infrastructure/external/platforms/cafe24/Cafe24Adapter'
import { IntegrationStatus } from '@domain/entities/PlatformIntegration'
import { PixelSetupMethod } from '@domain/entities/MetaPixel'

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID || ''
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET || ''

/**
 * DELETE /api/platform/cafe24/disconnect
 * 카페24 플랫폼 연동 해제
 */
export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  const { searchParams } = new URL(request.url)
  const pixelId = searchParams.get('pixelId')

  if (!pixelId) {
    return NextResponse.json(
      { error: '픽셀 ID가 필요합니다' },
      { status: 400 }
    )
  }

  try {
    // Get pixel with platform integration
    const pixel = await prisma.metaPixel.findFirst({
      where: {
        id: pixelId,
        userId: user.id,
      },
      include: { platformIntegration: true },
    })

    if (!pixel) {
      return NextResponse.json(
        { error: '픽셀을 찾을 수 없습니다' },
        { status: 404 }
      )
    }

    if (!pixel.platformIntegration) {
      return NextResponse.json(
        { error: '플랫폼 연동이 되어있지 않습니다' },
        { status: 400 }
      )
    }

    const integration = pixel.platformIntegration
    const adapter = new Cafe24Adapter(CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET)

    const errors: string[] = []

    // Remove script tag if exists
    if (integration.scriptTagId) {
      try {
        await adapter.removeTrackingScript(
          integration.platformStoreId,
          integration.accessToken,
          integration.scriptTagId
        )
      } catch (error) {
        console.error('Script removal warning:', error)
        errors.push('스크립트 제거 실패')
      }
    }

    // Unregister webhooks if exists
    if (integration.webhookId) {
      try {
        await adapter.unregisterWebhooks(
          integration.platformStoreId,
          integration.accessToken,
          integration.webhookId
        )
      } catch (error) {
        console.error('Webhook unregistration warning:', error)
        errors.push('웹훅 해제 실패')
      }
    }

    // Update integration status to disconnected
    await prisma.platformIntegration.update({
      where: { id: integration.id },
      data: {
        status: IntegrationStatus.DISCONNECTED,
        scriptTagId: null,
        webhookId: null,
        lastSyncAt: new Date(),
        errorMessage: errors.length > 0 ? errors.join(', ') : null,
      },
    })

    // Update pixel setup method back to manual
    await prisma.metaPixel.update({
      where: { id: pixel.id },
      data: { setupMethod: PixelSetupMethod.MANUAL },
    })

    return NextResponse.json({
      success: true,
      warnings: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Cafe24 disconnect error:', error)
    const errorMessage = error instanceof Error ? error.message : '연동 해제 중 오류가 발생했습니다'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
