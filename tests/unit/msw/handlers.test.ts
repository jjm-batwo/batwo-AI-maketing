/**
 * TEST-10: MSW 핸들러 통합 테스트
 *
 * MSW 핸들러들이 올바르게 동작하는지 검증
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { mswServer } from '@tests/msw/server'

describe('MSW Handlers Integration', () => {
  beforeAll(() => mswServer.listen({ onUnhandledRequest: 'warn' }))
  afterEach(() => mswServer.resetHandlers())
  afterAll(() => mswServer.close())

  describe('Meta API Handlers', () => {
    it('should return ad accounts for /me/adaccounts', async () => {
      const response = await fetch('https://graph.facebook.com/v25.0/me/adaccounts')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].id).toBe('act_123456789')
      expect(data.data[0].account_status).toBe(1)
      expect(data.data[0].currency).toBe('KRW')
    })

    it('should return campaigns for ad account', async () => {
      const response = await fetch('https://graph.facebook.com/v25.0/act_test123/campaigns')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(2)
      expect(data.data[0].status).toBe('ACTIVE')
      expect(data.data[0].objective).toBe('OUTCOME_SALES')
    })

    it('should return insights for campaign', async () => {
      const response = await fetch('https://graph.facebook.com/v25.0/camp_001/insights')
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].impressions).toBe('42000')
      expect(data.data[0].ctr).toBe('2.74')
      expect(data.data[0].actions).toHaveLength(3)
      expect(data.data[0].actions[0].action_type).toBe('purchase')
    })

    it('should validate token via debug_token', async () => {
      const response = await fetch(
        'https://graph.facebook.com/v25.0/debug_token?input_token=valid_token'
      )
      const data = await response.json()

      expect(data.data.is_valid).toBe(true)
      expect(data.data.scopes).toContain('ads_management')
    })

    it('should return error for invalid token', async () => {
      const response = await fetch(
        'https://graph.facebook.com/v25.0/debug_token?input_token=invalid_token'
      )
      const data = await response.json()

      expect(data.data.is_valid).toBe(false)
      expect(data.data.error.code).toBe(190)
    })
  })

  describe('OpenAI API Handlers', () => {
    it('should return chat completion', async () => {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'test' }],
        }),
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.id).toBe('chatcmpl-test-001')
      expect(data.model).toBe('gpt-4')
      expect(data.choices).toHaveLength(1)
      expect(data.choices[0].finish_reason).toBe('stop')
      expect(data.usage.total_tokens).toBe(205)
    })

    it('should return embeddings', async () => {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: 'test', model: 'text-embedding-ada-002' }),
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.data[0].embedding).toHaveLength(1536)
      expect(data.model).toBe('text-embedding-ada-002')
    })
  })

  describe('Toss Payments API Handlers', () => {
    it('should confirm payment', async () => {
      const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_test_001',
          orderId: 'order_test_001',
          amount: 49000,
        }),
      })
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.status).toBe('DONE')
      expect(data.totalAmount).toBe(49000)
      expect(data.method).toBe('카드')
      expect(data.card.number).toBe('4330****1234')
    })

    it('should reject duplicate payment', async () => {
      const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_dup',
          orderId: 'order_duplicate',
          amount: 49000,
        }),
      })
      const data = await response.json()

      expect(response.status).toBe(409)
      expect(data.code).toBe('ALREADY_PROCESSED_PAYMENT')
    })

    it('should reject zero-amount payment', async () => {
      const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey: 'pk_invalid',
          orderId: 'order_invalid',
          amount: 0,
        }),
      })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.code).toBe('INVALID_REQUEST')
    })

    it('should cancel payment', async () => {
      const response = await fetch(
        'https://api.tosspayments.com/v1/payments/pk_test_001/cancel',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelReason: '고객 요청' }),
        }
      )
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.status).toBe('CANCELED')
      expect(data.cancels).toHaveLength(1)
      expect(data.cancels[0].cancelReason).toBe('고객 요청')
    })

    it('should get payment by paymentKey', async () => {
      const response = await fetch(
        'https://api.tosspayments.com/v1/payments/pk_test_query'
      )
      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.paymentKey).toBe('pk_test_query')
      expect(data.status).toBe('DONE')
      expect(data.totalAmount).toBe(49000)
    })
  })
})
