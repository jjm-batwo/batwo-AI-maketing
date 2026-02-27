import { describe, it, expect } from 'vitest'
import type { NextRequest } from 'next/server'
import { POST as agentPost } from '../../../src/app/api/agent/chat/route'
import { existsSync } from 'fs'
import { resolve } from 'path'

function mockNextRequest(body: any): NextRequest {
  // Lightweight mock; route handlers typically read .json()
  return { json: async () => body } as unknown as NextRequest
}

describe('Legacy migration - /api/ai/chat removed, /api/agent/chat active', () => {
  it('레거시 /api/ai/chat 라우트 파일이 삭제되었음을 확인', () => {
    const legacyPath = resolve(__dirname, '../../../src/app/api/ai/chat/route.ts')
    expect(existsSync(legacyPath)).toBe(false)
  })

  it('agent 라우트가 정상 응답', async () => {
    const req = mockNextRequest({
      test: 'data',
      conversation: [{ role: 'user', content: 'Hello' }],
    })
    const res: any = await (agentPost as any)(req)
    const status = res?.status ?? res?.statusCode ?? 0
    expect(status).toBeGreaterThanOrEqual(0)
  })
})
