/**
 * Rate Limit 메모리 기반 동작 테스트
 *
 * 메모리 스토어의 윈도우 기반 Rate Limiting 로직을 검증합니다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Upstash 의존성을 모킹하여 순수 메모리 기반 동작만 테스트
vi.mock('@/lib/security/config', () => ({
    RATE_LIMIT_CONFIG: {
        general: { tokens: 100, interval: 60 * 1000 },
        ai: { tokens: 20, interval: 60 * 1000 },
        auth: { tokens: 10, interval: 60 * 1000 },
        campaignCreate: { tokens: 5, interval: 60 * 1000 },
    },
}))

import {
    checkRateLimit,
    getClientIp,
    getRateLimitTypeForPath,
    addRateLimitHeaders,
    rateLimitExceededResponse,
} from '@/lib/middleware/rateLimit'
import { NextRequest, NextResponse } from 'next/server'

describe('rateLimit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // 환경변수 제거하여 Upstash가 아닌 메모리 모드로 동작하게 함
        delete process.env.UPSTASH_REDIS_REST_URL
        delete process.env.UPSTASH_REDIS_REST_TOKEN
    })

    describe('checkRateLimit (memory)', () => {
        it('첫 요청은 성공한다', async () => {
            const result = await checkRateLimit(`test-ip-${Date.now()}`, 'general')

            expect(result.success).toBe(true)
            expect(result.remaining).toBe(99) // 100 - 1
            expect(result.limit).toBe(100)
        })

        it('한도를 초과하면 실패한다', async () => {
            const identifier = `test-exceed-${Date.now()}`

            // AI 한도(20)를 초과
            for (let i = 0; i < 20; i++) {
                const result = await checkRateLimit(identifier, 'ai')
                expect(result.success).toBe(true)
            }

            // 21번째 요청은 실패
            const result = await checkRateLimit(identifier, 'ai')
            expect(result.success).toBe(false)
            expect(result.remaining).toBe(0)
        })
    })

    describe('getClientIp', () => {
        it('x-forwarded-for 헤더에서 IP를 추출한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
            })

            expect(getClientIp(request)).toBe('1.2.3.4')
        })

        it('cf-connecting-ip 헤더에서 IP를 추출한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: { 'cf-connecting-ip': '10.0.0.1' },
            })

            expect(getClientIp(request)).toBe('10.0.0.1')
        })

        it('x-real-ip 헤더에서 IP를 추출한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                headers: { 'x-real-ip': '192.168.1.1' },
            })

            expect(getClientIp(request)).toBe('192.168.1.1')
        })

        it('헤더가 없으면 unknown을 반환한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test')

            expect(getClientIp(request)).toBe('unknown')
        })
    })

    describe('getRateLimitTypeForPath', () => {
        it('AI 경로는 ai 타입을 반환한다', () => {
            expect(getRateLimitTypeForPath('/api/ai/chat')).toBe('ai')
            expect(getRateLimitTypeForPath('/api/openai/complete')).toBe('ai')
        })

        it('인증 경로는 auth 타입을 반환한다', () => {
            expect(getRateLimitTypeForPath('/api/auth/signin')).toBe('auth')
        })

        it('캠페인 생성 경로는 campaignCreate 타입을 반환한다', () => {
            expect(getRateLimitTypeForPath('/api/campaigns/create')).toBe('campaignCreate')
        })

        it('기타 경로는 general 타입을 반환한다', () => {
            expect(getRateLimitTypeForPath('/api/campaigns')).toBe('general')
            expect(getRateLimitTypeForPath('/api/reports')).toBe('general')
        })
    })

    describe('응답 헬퍼', () => {
        it('addRateLimitHeaders가 헤더를 추가한다', () => {
            const response = NextResponse.json({ ok: true })
            const result = {
                success: true,
                limit: 100,
                remaining: 50,
                reset: Date.now() + 60000,
            }

            addRateLimitHeaders(response, result)

            expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
            expect(response.headers.get('X-RateLimit-Remaining')).toBe('50')
        })

        it('rateLimitExceededResponse는 429를 반환한다', () => {
            const result = {
                success: false,
                limit: 100,
                remaining: 0,
                reset: Date.now() + 60000,
            }

            const response = rateLimitExceededResponse(result)

            expect(response.status).toBe(429)
            expect(response.headers.get('Retry-After')).toBeTruthy()
        })
    })
})
