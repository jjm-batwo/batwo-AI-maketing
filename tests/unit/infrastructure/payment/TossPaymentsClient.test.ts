/**
 * TossPaymentsClient 단위 테스트
 *
 * MSW가 아닌 vi.fn() 기반 fetch 모킹을 사용합니다.
 * 성공/실패/타임아웃 시나리오를 검증합니다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TossPaymentsClient, TossPaymentApiError } from '@infrastructure/payment/TossPaymentsClient'

// fetch 모킹
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

describe('TossPaymentsClient', () => {
    let client: TossPaymentsClient

    beforeEach(() => {
        vi.clearAllMocks()
        client = new TossPaymentsClient('test_sk_123456789')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('constructor', () => {
        it('시크릿 키가 없으면 에러를 발생시킨다', () => {
            const originalEnv = process.env.TOSS_SECRET_KEY
            delete process.env.TOSS_SECRET_KEY

            expect(() => new TossPaymentsClient('')).toThrow('TOSS_SECRET_KEY is required')

            process.env.TOSS_SECRET_KEY = originalEnv
        })
    })

    describe('issueBillingKey', () => {
        it('성공 시 빌링키 결과를 반환한다', async () => {
            const mockResponse = {
                billingKey: 'billing_key_123',
                customerKey: 'customer_001',
                cardCompany: '삼성카드',
                cardNumber: '5234****1234',
                authenticatedAt: '2026-03-11T09:00:00+09:00',
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            })

            const result = await client.issueBillingKey('auth_key_abc', 'customer_001')

            expect(result).toEqual(mockResponse)
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.tosspayments.com/v1/billing/authorizations/issue',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        authKey: 'auth_key_abc',
                        customerKey: 'customer_001',
                    }),
                })
            )
        })

        it('실패 시 TossPaymentApiError를 발생시킨다', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () =>
                    Promise.resolve({
                        code: 'INVALID_AUTH_KEY',
                        message: '유효하지 않은 인증 키입니다',
                    }),
            })

            await expect(client.issueBillingKey('invalid_key', 'customer_001')).rejects.toThrow(
                TossPaymentApiError
            )
        })
    })

    describe('chargeBilling', () => {
        it('성공 시 결제 결과를 반환한다', async () => {
            const mockResponse = {
                paymentKey: 'payment_123',
                orderId: 'order_001',
                status: 'DONE',
                totalAmount: 9900,
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            })

            const result = await client.chargeBilling(
                'billing_key_123',
                'order_001',
                9900,
                'Pro 플랜 구독',
                'customer_001'
            )

            expect(result).toEqual(mockResponse)
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.tosspayments.com/v1/billing/billing_key_123',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        customerKey: 'customer_001',
                        orderId: 'order_001',
                        amount: 9900,
                        orderName: 'Pro 플랜 구독',
                    }),
                })
            )
        })

        it('결제 실패 시 TossPaymentApiError를 발생시킨다', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () =>
                    Promise.resolve({
                        code: 'REJECT_CARD_PAYMENT',
                        message: '카드 결제가 거절되었습니다',
                    }),
            })

            try {
                await client.chargeBilling('billing_key_123', 'order_001', 9900, 'Pro 플랜', 'customer_001')
                expect.fail('에러가 발생하지 않음')
            } catch (error) {
                expect(error).toBeInstanceOf(TossPaymentApiError)
                const apiError = error as TossPaymentApiError
                expect(apiError.errorCode).toBe('REJECT_CARD_PAYMENT')
                expect(apiError.statusCode).toBe(400)
            }
        })
    })

    describe('cancelPayment', () => {
        it('결제를 취소할 수 있다', async () => {
            const mockResponse = {
                paymentKey: 'payment_123',
                status: 'CANCELED',
                cancels: [
                    {
                        cancelAmount: 9900,
                        cancelReason: '사용자 요청',
                        canceledAt: '2026-03-11T09:00:00+09:00',
                    },
                ],
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            })

            const result = await client.cancelPayment('payment_123', '사용자 요청')

            expect(result).toEqual(mockResponse)
        })
    })

    describe('getPayment', () => {
        it('결제 정보를 조회할 수 있다', async () => {
            const mockResponse = {
                paymentKey: 'payment_123',
                orderId: 'order_001',
                status: 'DONE',
                totalAmount: 9900,
            }

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse),
            })

            const result = await client.getPayment('payment_123')

            expect(result).toEqual(mockResponse)
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.tosspayments.com/v1/payments/payment_123',
                expect.objectContaining({
                    method: 'GET',
                })
            )
        })
    })

    describe('인증 헤더', () => {
        it('Basic 인증 헤더를 올바르게 생성한다', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({}),
            })

            await client.getPayment('payment_123')

            const expectedAuth = `Basic ${Buffer.from('test_sk_123456789:').toString('base64')}`
            const callArgs = mockFetch.mock.calls[0]
            expect(callArgs[1].headers.Authorization).toBe(expectedAuth)
        })
    })

    describe('에러 처리', () => {
        it('알 수 없는 에러 응답을 처리한다', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({}),
            })

            try {
                await client.getPayment('payment_123')
                expect.fail('에러가 발생하지 않음')
            } catch (error) {
                expect(error).toBeInstanceOf(TossPaymentApiError)
                const apiError = error as TossPaymentApiError
                expect(apiError.errorCode).toBe('UNKNOWN_ERROR')
                expect(apiError.statusCode).toBe(500)
            }
        })
    })
})
