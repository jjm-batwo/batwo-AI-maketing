/**
 * TEST-10: MSW 핸들러 - Toss Payments API
 *
 * Toss Payments HTTP 모킹을 MSW로 전환
 */

import { http, HttpResponse } from 'msw'

const TOSS_API_BASE = 'https://api.tosspayments.com/v1'

export const tossPaymentsHandlers = [
  // Confirm payment
  http.post(`${TOSS_API_BASE}/payments/confirm`, async ({ request }) => {
    const body = await request.json() as {
      paymentKey: string
      orderId: string
      amount: number
    }

    // 결제 금액 불일치 시뮬레이션
    if (body.amount === 0) {
      return HttpResponse.json(
        {
          code: 'INVALID_REQUEST',
          message: '결제 금액이 올바르지 않습니다',
        },
        { status: 400 }
      )
    }

    // 이미 처리된 결제
    if (body.orderId === 'order_duplicate') {
      return HttpResponse.json(
        {
          code: 'ALREADY_PROCESSED_PAYMENT',
          message: '이미 처리된 결제입니다',
        },
        { status: 409 }
      )
    }

    // 성공 응답
    return HttpResponse.json({
      paymentKey: body.paymentKey,
      orderId: body.orderId,
      status: 'DONE',
      totalAmount: body.amount,
      method: '카드',
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
      card: {
        issuerCode: '11',
        acquirerCode: '11',
        number: '4330****1234',
        installmentPlanMonths: 0,
        isInterestFree: false,
        approveNo: '12345678',
        cardType: '신용',
        ownerType: '개인',
      },
      receipt: {
        url: 'https://dashboard.tosspayments.com/receipt/test',
      },
    })
  }),

  // Get billing key (자동결제 등록)
  http.post(`${TOSS_API_BASE}/billing/authorizations/issue`, async ({ request }) => {
    const body = await request.json() as {
      authKey: string
      customerKey: string
    }

    return HttpResponse.json({
      billingKey: `billing_key_${Date.now()}`,
      customerKey: body.customerKey,
      authenticatedAt: new Date().toISOString(),
      method: '카드',
      card: {
        issuerCode: '11',
        number: '4330****1234',
        cardType: '신용',
        ownerType: '개인',
      },
    })
  }),

  // Auto-pay with billing key
  http.post(`${TOSS_API_BASE}/billing/:billingKey`, async ({ request }) => {
    const body = await request.json() as {
      customerKey: string
      amount: number
      orderId: string
      orderName: string
    }

    return HttpResponse.json({
      paymentKey: `payment_auto_${Date.now()}`,
      orderId: body.orderId,
      status: 'DONE',
      totalAmount: body.amount,
      method: '카드',
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    })
  }),

  // Cancel payment
  http.post(`${TOSS_API_BASE}/payments/:paymentKey/cancel`, async ({ params, request }) => {
    const body = await request.json() as { cancelReason: string }

    return HttpResponse.json({
      paymentKey: params.paymentKey,
      status: 'CANCELED',
      cancels: [
        {
          cancelAmount: 49000,
          cancelReason: body.cancelReason || '고객 요청',
          canceledAt: new Date().toISOString(),
          receiptKey: `receipt_cancel_${Date.now()}`,
        },
      ],
    })
  }),

  // Get payment by paymentKey
  http.get(`${TOSS_API_BASE}/payments/:paymentKey`, ({ params }) => {
    return HttpResponse.json({
      paymentKey: params.paymentKey,
      orderId: 'order_test_001',
      status: 'DONE',
      totalAmount: 49000,
      method: '카드',
      requestedAt: new Date().toISOString(),
      approvedAt: new Date().toISOString(),
    })
  }),

  // Get payment by orderId
  http.get(`${TOSS_API_BASE}/payments/orders/:orderId`, ({ params }) => {
    return HttpResponse.json({
      paymentKey: 'pk_test_query',
      orderId: params.orderId,
      status: 'DONE',
      totalAmount: 49000,
      method: '카드',
    })
  }),

  // Webhook simulation - 결제 상태 변경
  http.post(`${TOSS_API_BASE}/webhook-test`, async () => {
    return HttpResponse.json({
      eventType: 'PAYMENT_STATUS_CHANGED',
      data: {
        paymentKey: 'pk_webhook_test',
        orderId: 'order_webhook_test',
        status: 'DONE',
        totalAmount: 49000,
      },
    })
  }),
]
