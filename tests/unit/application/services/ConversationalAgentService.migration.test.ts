import { describe, it, expect } from 'vitest'
import { ConversationalAgentService } from '../../../../src/application/services/ConversationalAgentService'

describe('ConversationalAgentService migration parity (RED)', () => {
  it('should expose a legacy parity migration API (expected to be undefined/missing in RED)', () => {
    // Instantiate with null dependencies to keep test lightweight
    const service: any = new (ConversationalAgentService as any)(null, null)

    // This method is expected to exist in a complete migration; if not present, test fails (RED)
    const hasParityFn = typeof service.migrateLegacyParity === 'function'
    expect(hasParityFn).toBe(true)
  })
})
