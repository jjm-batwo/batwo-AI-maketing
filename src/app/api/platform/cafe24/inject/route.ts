import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, unauthorizedResponse } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Cafe24Adapter } from '@infrastructure/external/platforms/cafe24/Cafe24Adapter'
import { IntegrationStatus } from '@domain/entities/PlatformIntegration'
import { safeDecryptToken } from '@application/utils/TokenEncryption'

const CAFE24_CLIENT_ID = process.env.CAFE24_CLIENT_ID || ''
const CAFE24_CLIENT_SECRET = process.env.CAFE24_CLIENT_SECRET || ''
const WEBHOOK_BASE_URL = process.env.NEXTAUTH_URL || ''

/**
 * POST /api/platform/cafe24/inject
 * 카페24 스토어에 픽셀 추적 스크립트 주입
 */
export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return unauthorizedResponse()

  let body: { pixelId: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: '잘못된 요청입니다' },
      { status: 400 }
    )
  }

  const { pixelId } = body

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

    // Check if already injected
    if (integration.status === IntegrationStatus.ACTIVE && integration.scriptTagId) {
      return NextResponse.json(
        { error: '이미 스크립트가 설치되어 있습니다' },
        { status: 400 }
      )
    }

    const adapter = new Cafe24Adapter(CAFE24_CLIENT_ID, CAFE24_CLIENT_SECRET)

    // Inject tracking script
    const scriptResult = await adapter.injectTrackingScript(
      integration.platformStoreId,
      safeDecryptToken(integration.accessToken),
      pixel.metaPixelId
    )

    // Register webhooks for order events
    let webhookId: string | undefined
    try {
      const webhookResult = await adapter.registerWebhooks(
        integration.platformStoreId,
        safeDecryptToken(integration.accessToken),
        `${WEBHOOK_BASE_URL}/api/webhooks/cafe24`
      )
      webhookId = webhookResult.webhookId
    } catch (error) {
      console.error('Webhook registration warning:', error)
      // Continue even if webhook registration fails
    }

    // Update integration status
    await prisma.platformIntegration.update({
      where: { id: integration.id },
      data: {
        scriptTagId: scriptResult.scriptTagId,
        webhookId,
        status: IntegrationStatus.ACTIVE,
        lastSyncAt: new Date(),
        errorMessage: null,
      },
    })

    return NextResponse.json({
      success: true,
      scriptTagId: scriptResult.scriptTagId,
      webhookId,
      injectedAt: scriptResult.injectedAt,
    })
  } catch (error) {
    console.error('Cafe24 script injection error:', error)

    // Update integration with error
    if (body.pixelId) {
      try {
        const pixel = await prisma.metaPixel.findFirst({
          where: { id: body.pixelId, userId: user.id },
          include: { platformIntegration: true },
        })

        if (pixel?.platformIntegration) {
          await prisma.platformIntegration.update({
            where: { id: pixel.platformIntegration.id },
            data: {
              status: IntegrationStatus.ERROR,
              errorMessage: error instanceof Error ? error.message : '스크립트 설치 실패',
            },
          })
        }
      } catch (updateError) {
        console.error('Error updating integration status:', updateError)
      }
    }

    const errorMessage = error instanceof Error ? error.message : '스크립트 설치 중 오류가 발생했습니다'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
