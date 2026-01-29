import { describe, it, expect } from 'vitest'
import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'

describe('Vercel AI SDK', () => {
  it('should import streamText without errors', () => {
    expect(streamText).toBeDefined()
    expect(typeof streamText).toBe('function')
  })

  it('should import openai provider without errors', () => {
    expect(openai).toBeDefined()
    expect(typeof openai).toBe('function')
  })
})
