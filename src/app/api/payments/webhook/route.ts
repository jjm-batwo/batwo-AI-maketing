import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Toss Payments 결제 웹훅
 *
 * HMAC-SHA256 서명을 검증한 후 이벤트를 처리합니다.
 * - TOSS_WEBHOOK_SECRET 환경변수 필수
 * - 서명 없는 요청 → 401 거부
 * - 서명 불일치 → 401 거부
 */

function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.TOSS_WEBHOOK_SECRET
  if (!secret) {
    console.error('[Toss Webhook] TOSS_WEBHOOK_SECRET is not set')
    return false
  }

  if (!signature) {
    return false
  }

  const expectedSignature = createHmac('sha256', secret).update(rawBody).digest('base64')

  try {
    const sigBuffer = Buffer.from(signature, 'base64')
    const expectedSigBuffer = Buffer.from(expectedSignature, 'base64')

    if (sigBuffer.length !== expectedSigBuffer.length) {
      return false
    }

    return timingSafeEqual(sigBuffer, expectedSigBuffer)
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  // 1. Read raw body for signature verification
  const rawBody = await request.text()

  // 2. Verify HMAC-SHA256 signature (timing-safe)
  const signature = request.headers.get('x-tosspayments-signature')
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[Toss Webhook] Signature verification failed')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Parse and process the event
  try {
    const body = JSON.parse(rawBody)
    const { eventType, data } = body

    console.log('[Toss Webhook]', eventType, data)

    // Handle specific event types
    if (eventType === 'PAYMENT_STATUS_CHANGED') {
      console.log('[Toss Webhook] Payment status changed:', {
        orderId: data?.orderId,
        status: data?.status,
        amount: data?.amount,
      })
    }

    // Return 200 to acknowledge receipt (Toss retries on non-200)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[Toss Webhook] Error processing webhook:', error)
    // Return 400 for malformed payloads (signature was valid but body is broken)
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
