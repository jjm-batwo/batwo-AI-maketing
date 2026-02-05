import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
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

    // Always return 200 to acknowledge receipt (Toss retries on non-200)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    console.error('[Toss Webhook] Error processing webhook:', error)
    // Still return 200 to prevent retries for malformed payloads
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
