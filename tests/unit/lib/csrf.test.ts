/**
 * CSRF 검증 단위 테스트
 */

import { describe, it, expect } from 'vitest'
import { validateCSRF } from '@/lib/csrf'
import { NextRequest } from 'next/server'

describe('validateCSRF', () => {
    describe('안전한 메서드', () => {
        it('GET 요청은 항상 통과한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                method: 'GET',
            })

            expect(validateCSRF(request)).toBe(true)
        })

        it('HEAD 요청은 항상 통과한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                method: 'HEAD',
            })

            expect(validateCSRF(request)).toBe(true)
        })

        it('OPTIONS 요청은 항상 통과한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                method: 'OPTIONS',
            })

            expect(validateCSRF(request)).toBe(true)
        })
    })

    describe('변경 메서드 (POST, PUT, DELETE, PATCH)', () => {
        it('X-Requested-With 헤더가 XMLHttpRequest이면 통과한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })

            expect(validateCSRF(request)).toBe(true)
        })

        it('X-Requested-With 헤더가 없으면 실패한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                method: 'POST',
            })

            expect(validateCSRF(request)).toBe(false)
        })

        it('X-Requested-With 헤더가 다른 값이면 실패한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                method: 'POST',
                headers: { 'X-Requested-With': 'SomeOtherValue' },
            })

            expect(validateCSRF(request)).toBe(false)
        })

        it('DELETE 요청에서도 헤더 검증이 동작한다', () => {
            const requestWithHeader = new NextRequest('http://localhost:3000/api/test', {
                method: 'DELETE',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })
            expect(validateCSRF(requestWithHeader)).toBe(true)

            const requestWithoutHeader = new NextRequest('http://localhost:3000/api/test', {
                method: 'DELETE',
            })
            expect(validateCSRF(requestWithoutHeader)).toBe(false)
        })

        it('PATCH 요청에서도 헤더 검증이 동작한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                method: 'PATCH',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            })

            expect(validateCSRF(request)).toBe(true)
        })

        it('PUT 요청에서도 헤더 검증이 동작한다', () => {
            const request = new NextRequest('http://localhost:3000/api/test', {
                method: 'PUT',
            })

            expect(validateCSRF(request)).toBe(false)
        })
    })
})
