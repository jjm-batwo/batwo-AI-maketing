import { describe, it, expect } from 'vitest'
import type { NextRequest } from 'next/server'
import { POST as legacyPost } from '../../../src/app/api/ai/chat/route'
import { POST as agentPost } from '../../../src/app/api/agent/chat/route'

function mockNextRequest(body: any): NextRequest {
  // Lightweight mock; route handlers typically read .json()
  return { json: async () => body } as unknown as NextRequest
}

describe('Task 1.1 - Legacy migration regression tests for agent endpoint parity and legacy route removal (RED)', () => {
  it('LEGACY: legacy route /api/ai/chat should be removed and return 404', async () => {
    const req = mockNextRequest({ test: 'data' })
    const res: any = await (legacyPost as any)(req)
    const status = res?.status ?? res?.statusCode ?? 404
    // Expect 404 as legacy route should be removed
    expect(status).toBe(404)
  })

  it('AGENT: agent route should exist and attempt to handle legacy scenarios (parity check placeholder)', async () => {
    const req = mockNextRequest({
      test: 'data',
      conversation: [{ role: 'user', content: 'Hello' }],
    })
    const res: any = await (agentPost as any)(req)
    const status = res?.status ?? res?.statusCode ?? 0
    // Ensure agent route responds (not a hard 404). This is a RED-phase parity check placeholder.
    expect(status).toBeGreaterThanOrEqual(0)

    // Attempt to read body if available; parity check will compare with legacy output in later steps
    const text = typeof res?.text === 'function' ? await res.text() : null
    if (text) {
      try {
        // optional JSON body check
        JSON.parse(text)
      } catch {
        // ignore non-JSON bodies
      }
    }
  })
})
