import { NextRequest, NextResponse } from 'next/server'
import { TrackingScriptService } from '@infrastructure/external/tracking/TrackingScriptService'

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'https://batwo.ai'

/**
 * GET /api/pixel/[pixelId]/snippet
 * 스크립트 스니펫 및 설치 안내 반환
 *
 * 이 엔드포인트는 공개 API로, 인증이 필요하지 않습니다.
 * 수동 설치를 위한 스크립트 코드와 noscript 태그, 설치 안내를 제공합니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pixelId: string }> }
) {
  const { pixelId } = await params

  const service = new TrackingScriptService({ appBaseUrl: APP_BASE_URL })

  // Validate pixel ID format
  if (!service.validatePixelId(pixelId)) {
    return NextResponse.json(
      { error: 'Invalid pixel ID format. Pixel ID must be 15-16 digits.' },
      { status: 400 }
    )
  }

  try {
    const snippet = service.generateScriptSnippet(pixelId)

    // Wrap script in script tags for easy copy-paste
    const scriptWithTags = `<script>\n${snippet.script}\n</script>`

    return NextResponse.json({
      script: scriptWithTags,
      noscript: snippet.noscript,
      pixelId: snippet.pixelId,
      instructions: snippet.instructions,
      // Alternative: direct script tag using our CDN-like endpoint
      scriptTag: `<script src="${APP_BASE_URL}/api/pixel/${pixelId}/tracker.js" async></script>`,
    })
  } catch (error) {
    console.error('Failed to generate snippet:', error)
    return NextResponse.json(
      { error: 'Failed to generate script snippet' },
      { status: 500 }
    )
  }
}
