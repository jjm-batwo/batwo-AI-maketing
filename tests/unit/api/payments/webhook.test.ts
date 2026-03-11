/**
 * 결제 웹훅 서명 검증 테스트
 *
 * HMAC-SHA256 + timingSafeEqual을 사용한 서명 검증 로직을 테스트합니다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHmac } from 'crypto'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/payments/webhook/route'

describe('POST /api/payments/webhook', () => {
    const WEBHOOK_SECRET = 'test_webhook_secret_key_for_testing'

    beforeEach(() => {
        vi.stubEnv('TOSS_WEBHOOK_SECRET', WEBHOOK_SECRET)
    })

    afterEach(() => {
        vi.unstubAllEnvs()
    })

    function generateSignature(body: string, secret: string = WEBHOOK_SECRET): string {
        return createHmac('sha256', secret).update(body).digest('base64')
    }

    function createWebhookRequest(
        body: object,
        options?: { signature?: string | null; withSignatureHeader?: boolean }
    ): NextRequest {
        const rawBody = JSON.stringify(body)
        const signature =
            options?.signature !== undefined
                ? options.signature
                : options?.withSignatureHeader === false
                    ? null
                    : generateSignature(rawBody)

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        }
        if (signature !== null) {
            headers['x-tosspayments-signature'] = signature
        }

        return new NextRequest('http://localhost:3000/api/payments/webhook', {
            method: 'POST',
            headers,
            body: rawBody,
        })
    }

    describe('서명 검증', () => {
        it('유효한 서명이면 200을 반환한다', async () => {
            const body = { eventType: 'PAYMENT_STATUS_CHANGED', data: { orderId: 'order_1' } }
            const request = createWebhookRequest(body)

            const response = await POST(request)

            expect(response.status).toBe(200)
            const data = await response.json()
            expect(data.received).toBe(true)
        })

        it('서명 헤더가 없으면 401을 반환한다', async () => {
            const body = { eventType: 'PAYMENT_STATUS_CHANGED', data: {} }
            const request = createWebhookRequest(body, { withSignatureHeader: false })

            const response = await POST(request)

            expect(response.status).toBe(401)
        })

        it('서명이 불일치하면 401을 반환한다', async () => {
            const body = { eventType: 'PAYMENT_STATUS_CHANGED', data: {} }
            const wrongSignature = generateSignature(JSON.stringify(body), 'wrong_secret')
            const request = createWebhookRequest(body, { signature: wrongSignature })

            const response = await POST(request)

            expect(response.status).toBe(401)
        })

        it('TOSS_WEBHOOK_SECRET이 설정되지 않으면 401을 반환한다', async () => {
            vi.stubEnv('TOSS_WEBHOOK_SECRET', '')
            const body = { eventType: 'test', data: {} }
            const request = createWebhookRequest(body)

            const response = await POST(request)

            expect(response.status).toBe(401)
        })
    })

    describe('PAYMENT_STATUS_CHANGED 이벤트', () => {
        it('결제 상태 변경 이벤트를 처리한다', async () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

            const body = {
                eventType: 'PAYMENT_STATUS_CHANGED',
                data: {
                    orderId: 'order_test_001',
                    status: 'DONE',
                    amount: 9900,
                },
            }
            const request = createWebhookRequest(body)

            const response = await POST(request)

            expect(response.status).toBe(200)
            expect(consoleSpy).toHaveBeenCalledWith(
                '[Toss Webhook] Payment status changed:',
                expect.objectContaining({
                    orderId: 'order_test_001',
                    status: 'DONE',
                    amount: 9900,
                })
            )

            consoleSpy.mockRestore()
        })
    })
})
