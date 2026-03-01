import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

describe('Legacy migration - /api/ai/chat removed, /api/agent/chat active', () => {
  it('레거시 /api/ai/chat 라우트 파일이 삭제되었음을 확인', () => {
    const legacyPath = resolve(__dirname, '../../../src/app/api/ai/chat/route.ts')
    expect(existsSync(legacyPath)).toBe(false)
  })

  it('agent 라우트 파일이 존재하고 POST 핸들러를 export', () => {
    const agentPath = resolve(__dirname, '../../../src/app/api/agent/chat/route.ts')
    expect(existsSync(agentPath)).toBe(true)

    const source = readFileSync(agentPath, 'utf-8')
    expect(source).toContain('export async function POST')
  })
})
