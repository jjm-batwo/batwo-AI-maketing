import { describe, it, expect } from 'vitest'

describe('Test Environment', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should have access to path aliases', async () => {
    // This test verifies that TypeScript path aliases are working
    const utils = await import('@lib/utils')
    expect(utils).toBeDefined()
    expect(typeof utils.cn).toBe('function')
  })
})
