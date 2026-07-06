// ====================================================
// PromptForge AI — Environment Validator Unit Tests
// ====================================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { validateEnv, envSchema } from '../../src/shared/env'

describe('Environment Validator', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should parse valid variables and apply defaults', () => {
    process.env.GROQ_API_KEY = 'gsk_test'
    process.env.PORT = '1234'
    process.env.NODE_ENV = 'test'
    process.env.DEBUG = 'true'

    const env = validateEnv()
    expect(env.GROQ_API_KEY).toBe('gsk_test')
    expect(env.PORT).toBe(1234)
    expect(env.NODE_ENV).toBe('test')
    expect(env.DEBUG).toBe(true)
  })

  it('should fail validation on invalid values', () => {
    process.env.NODE_ENV = 'invalid_env' // Should be development, production, or test

    const parsed = envSchema.safeParse(process.env)
    expect(parsed.success).toBe(false)
  })
})
